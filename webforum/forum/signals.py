import threading
import os
import sys
import numpy as np
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import Post
from google import genai

# 1. Refined Anchor Descriptions for clear differentiation
ANCHOR_DESCRIPTIONS = {
    "Q&A": "Questions from users seeking help, troubleshooting tips, or technical support. Contains phrases like 'How do I', 'Help needed', or 'Problem with'.",
    "News": "Official announcements, press releases, company updates, and news regarding new Barrows store openings or product launches.",
    "ConnectOS": "Deep technical discussions about software engineering, API integration, cloud latency, WebSocket stability, and backend architecture.",
    "Hardware": "Physical device installation, heat dissipation issues, LED hardware, SPIRITS units, and mechanical mounting on retail shelves."
}

ANCHOR_CACHE = {}

def get_anchor_vectors(client):
    if not ANCHOR_CACHE:
        print("Initialising Barrows Semantic Anchors...")
        for name, desc in ANCHOR_DESCRIPTIONS.items():
            res = client.models.embed_content(
                model="gemini-embedding-001",
                contents=desc
            )
            ANCHOR_CACHE[name] = np.array(res.embeddings[0].values)
    return ANCHOR_CACHE

def generate_post_embedding(post_id):
    try:
        post = Post.objects.get(id=post_id)
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key and 'test' not in sys.argv:
            return

        client = genai.Client(api_key=api_key)
        
        # Get Post Vector
        response = client.models.embed_content(
            model="gemini-embedding-001",
            contents=post.content
        )
        post_vector = np.array(response.embeddings[0].values)
        post.embedding = post_vector.tolist()

        # KNN Categorization
        anchors = get_anchor_vectors(client)
        best_category = "Uncategorized"
        min_distance = float('inf')

        for name, anchor_vector in anchors.items():
            distance = np.linalg.norm(post_vector - anchor_vector)
            if distance < min_distance:
                min_distance = distance
                best_category = name

        post.category = best_category
        post.save()
        print(f"Success: Embedded and categorized post {post_id} as [{best_category}].")

    except Exception as e:
        print(f"Categorization failed for post {post_id}: {e}")

@receiver(post_save, sender=Post)
def trigger_ai_embedding(sender, instance, created, **kwargs):
    if created:
        def start_thread():
            thread = threading.Thread(
                target=generate_post_embedding, 
                args=(instance.id,),
                name=f"AI_Embedding_{instance.id}"
            )
            thread.start()
        transaction.on_commit(start_thread)
