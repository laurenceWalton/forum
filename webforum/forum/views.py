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
