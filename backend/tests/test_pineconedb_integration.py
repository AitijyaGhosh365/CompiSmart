import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.pinecone.db import get_video

YT_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

print("=== Testing get_video ===")
result = get_video(url=YT_URL, video_id="A")
print(f"Status: {result['status']}")
print(f"Video ID: {result.get('video_id', 'N/A')}")

if result['status'] == 'added':
    print(f"Chunks upserted: {result.get('chunks_upserted', 'N/A')}")
    print(f"Metadata keys: {list(result.get('metadata', {}).keys())}")
elif result['status'] == 'exists':
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    print(f"Stored metadata: {result.get('stored_metadata', {})}")