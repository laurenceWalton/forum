from rest_framework import serializers
from .models import User, Post, Comment, Like

class UserSerializer(serializers.ModelSerializer):
    """
    Translates User model to/from JSON.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'is_moderator']

class CommentSerializer(serializers.ModelSerializer):
    """
    Translates Comment model to/from JSON.
    Includes the author's username for the frontend.
    """
    author_username = serializers.ReadOnlyField(source='author.username')

    class Meta:
        model = Comment
        fields = ['id', 'author', 'author_username', 'content', 'created_at']
        read_only_fields = ['author', 'created_at']

class PostSerializer(serializers.ModelSerializer):
    """
    Translates Post model to/from JSON.
    Includes calculated counts for engagement metrics.
    """
    author_username = serializers.ReadOnlyField(source='author.username')
    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'author', 'author_username', 'content', 
            'created_at', 'is_misleading', 'like_count', 'comment_count',
            'category'
        ]
        read_only_fields = ['author', 'created_at', 'is_misleading', 'category']

    def get_like_count(self, obj):
        return obj.likes.count()

    def get_comment_count(self, obj):
        return obj.comments.count()
