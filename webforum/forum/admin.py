from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Post, Comment, Like

class CustomUserAdmin(UserAdmin):
    """
    Extending the standard UserAdmin to include our custom is_moderator field.
    """
    model = User
    list_display = ['username', 'email', 'is_moderator', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Roles', {'fields': ('is_moderator',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom Roles', {'fields': ('is_moderator',)}),
    )

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'created_at', 'is_misleading')
    list_filter = ('is_misleading', 'created_at')
    search_fields = ('content', 'author__username')

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'post', 'created_at')

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'post', 'created_at')

# Register our Custom User model
admin.site.register(User, CustomUserAdmin)
