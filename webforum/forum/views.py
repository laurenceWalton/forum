from rest_framework import viewsets, permissions, status, decorators
from rest_framework.response import Response
from .models import Post, Comment, Like
from .serializers import PostSerializer, CommentSerializer, UserSerializer

class IsModeratorOrReadOnly(permissions.BasePermission):
    """
    Custom permission: Anyone can read, but only Moderators can edit 'is_misleading'.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated

from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token

class CustomAuthToken(ObtainAuthToken):
    """
    Returns Token plus User data for frontend permissions.
    """
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'is_moderator': user.is_moderator
        })

from pgvector.django import L2Distance
from google import genai
import os

class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and creating forum posts.
    """
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        # Automatically set the author to the logged-in user
        serializer.save(author=self.request.user)

    def get_queryset(self):
        queryset = Post.objects.all()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset

    @decorators.action(detail=False, methods=['get'])
    def search(self, request):
        """
        AI Semantic Search with optional category filtering.
        """
        query_text = request.query_params.get('q')
        category = request.query_params.get('category')
        
        if not query_text:
            return Response({"error": "No search query provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Generate embedding
            api_key = os.getenv("GOOGLE_API_KEY")
            client = genai.Client(api_key=api_key)
            response = client.models.embed_content(model="gemini-embedding-001", contents=query_text)
            query_vector = response.embeddings[0].values

            # 2. Base Query
            queryset = Post.objects.exclude(embedding__isnull=True)
            
            # 3. Apply Category Filter if provided
            if category and category != "All":
                queryset = queryset.filter(category=category)

            # 4. Order by Distance
            results = queryset.order_by(L2Distance('embedding', query_vector))[:2]

            serializer = self.get_serializer(results, many=True)
            return Response(serializer.data)

        except Exception as e:
            return Response({"error": f"Search failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @decorators.action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def flag(self, request, pk=None):
        """
        Custom action: Only moderators can flag a post as misleading.
        """
        if not request.user.is_moderator:
            return Response(
                {"detail": "Only moderators can flag posts."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        post = self.get_object()
        post.is_misleading = request.data.get('is_misleading', True)
        post.save()
        return Response(self.get_serializer(post).data)

    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        """
        Custom action: Handle the 'Like' logic.
        """
        post = self.get_object()
        
        # Rule: Cannot like your own post
        if post.author == request.user:
            return Response(
                {"error": "You cannot like your own post."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Rule: One like per user (Toggle logic)
        like_exists = Like.objects.filter(user=request.user, post=post).exists()
        if like_exists:
            Like.objects.filter(user=request.user, post=post).delete()
            return Response({"detail": "Post unliked."}, status=status.HTTP_200_OK)
        
        Like.objects.create(user=request.user, post=post)
        return Response({"detail": "Post liked."}, status=status.HTTP_201_CREATED)

class CommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing comments on posts.
    """
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Allow filtering comments by post ID: /api/comments/?post=1
        post_id = self.request.query_params.get('post')
        if post_id:
            return self.queryset.filter(post_id=post_id)
        return self.queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
