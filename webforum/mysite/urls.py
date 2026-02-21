from django.contrib import admin
from django.urls import path, include
from forum.views import CustomAuthToken

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('forum.urls')),
    path('api/login/', CustomAuthToken.as_view(), name='api_token_auth'),
]
