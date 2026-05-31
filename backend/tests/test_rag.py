import sys
import os
import time
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.pinecone.db import get_video, delete_video, clear_namespace
from app.services.rag.pipeline import chat

VIDEO_A_URL = "https://www.youtube.com/watch?v=njNYLgjwJ8Q"
VIDEO_B_URL = "https://www.youtube.com/watch?v=kMK7zdoHjaY"

print("\n=== Ingesting Video A ===")
result_a = get_video(url=VIDEO_A_URL, video_id="A")
print(f"  Status: {result_a['status']}")
if result_a['status'] == 'added':
    print(f"  Chunks upserted: {result_a['chunks_upserted']}")

time.sleep(10)

print("\n=== Ingesting Video B ===")
result_b = get_video(url=VIDEO_B_URL, video_id="B")
print(f"  Status: {result_b['status']}")
if result_b['status'] == 'added':
    print(f"  Chunks upserted: {result_b['chunks_upserted']}")

print("\n=== CompiSmart RAG Chat ===")
print("Type 'quit' to exit.\n")

history = []
while True:
    try:
        query = input("You: ").strip()
    except (EOFError, KeyboardInterrupt):
        print("\nGoodbye!")
        break

    if query.lower() in ("quit", "exit", "q"):
        print("Goodbye!")
        break

    if not query:
        continue

    response = chat(query, history=history)
    print(f"\nCompiSmart: {response}\n")

    history.append({"role": "user", "content": query})
    history.append({"role": "assistant", "content": response})