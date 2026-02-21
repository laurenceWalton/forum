from django.contrib.auth.models import AbstractUser
from django.db import models
from pgvector.django import VectorField

class User(AbstractUser):
    """
    Custom User model for Barrows Connected Stores.
    Regular Users can post, comment, and like.
    Moderators (is_moderator=True) can additionally flag posts as misleading.
    """
    is_moderator = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} ({'Moderator' if self.is_moderator else 'User'})"

class Post(models.Model):
    """
    A forum post. Posts are immutable (cannot be edited/deleted by users).
    """
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_misleading = models.BooleanField(default=False)
    
    # AI Vector field (Option C: Semantic Search)
    # Using 768 dimensions for compatibility with Gemini text-embedding-004
    embedding = VectorField(dimensions=768, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Post by {self.author.username} at {self.created_at}"

class Comment(models.Model):
    """
    A comment on a specific post.
    """
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.username} on {self.post.id}"

class Like(models.Model):
    """
    A like on a post. Logic ensures one like per post per user.
    Users cannot like their own posts (enforced in serializers/views).
    """
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Database-level rule: A user can only like a specific post once.
        constraints = [
            models.UniqueConstraint(fields=['user', 'post'], name='unique_user_post_like')
        ]

    def __str__(self):
        return f"{self.user.username} likes Post {self.post.id}"
