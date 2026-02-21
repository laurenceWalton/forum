import threading
import os
import sys
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import Post
from google import genai

def generate_post_embedding(post_id):
    """
    Background task to generate a 3072-dim vector using the modern google-genai SDK.
    """
    try:
        post = Post.objects.get(id=post_id)
        api_key = os.getenv("GOOGLE_API_KEY")

        if not api_key and 'test' not in sys.argv:
            print(f"Warning: No GOOGLE_API_KEY found for post {post_id}.")
            return

        # Initialize the modern GenAI client
        client = genai.Client(api_key=api_key)
        
        # Generate embedding using the confirmed gemini-embedding-001 model
        response = client.models.embed_content(
            model="gemini-embedding-001",
            contents=post.content
        )
        
        # Save the vector values (the new SDK returns them in .embeddings[0].values)
        post.embedding = response.embeddings[0].values
        post.save()
        print(f"Success: Generated AI embedding for post {post_id}.")

    except Exception as e:
        print(f"Error generating embedding for post {post_id}: {e}")

@receiver(post_save, sender=Post)
def trigger_ai_embedding(sender, instance, created, **kwargs):
    """
    Trigger background embedding after a successful database commit.
    """
    if created:
        def start_thread():
            thread = threading.Thread(
                target=generate_post_embedding, 
                args=(instance.id,),
                name=f"AI_Embedding_{instance.id}"
            )
            thread.start()

        transaction.on_commit(start_thread)
