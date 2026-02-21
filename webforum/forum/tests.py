from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from .models import Post
from unittest.mock import patch, MagicMock
import threading

User = get_user_model()

class PostAITest(TransactionTestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='password123')

    @patch('google.genai.Client')
    def test_post_creation_triggers_embedding(self, mock_client_class):
        """
        Tests that creating a post triggers the background embedding signal
        using the new google-genai library with a mock.
        """
        # 1. Setup the mock client and its nested methods
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        
        # 2. Define the fake response with .embeddings[0].values
        fake_response = MagicMock()
        fake_response.embeddings = [MagicMock(values=[0.1] * 3072)]
        mock_client.models.embed_content.return_value = fake_response

        # 3. Create the post (starts the thread)
        post = Post.objects.create(
            author=self.user,
            content="This is a test post for AI embedding."
        )

        # 4. Find the background thread that was just started and wait for it
        for thread in threading.enumerate():
            if thread.name.startswith("AI_Embedding"):
                thread.join(timeout=5)

        # 5. Refresh from DB and verify the mocked result
        post.refresh_from_db()
        self.assertIsNotNone(post.embedding, "The post embedding field was not updated.")
        self.assertEqual(len(post.embedding), 3072)
        self.assertTrue(mock_client.models.embed_content.called, "The AI embedding API was not called.")
        print(f"Test Success: Background thread with new SDK updated Post {post.id}.")
