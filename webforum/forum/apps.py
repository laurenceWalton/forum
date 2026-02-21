from django.apps import AppConfig

class ForumConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'forum'

    def ready(self):
        """
        The ready() method is called when Django starts.
        We import our signals here so the 'post_save' listeners 
        are active and ready to catch new posts.
        """
        import forum.signals
