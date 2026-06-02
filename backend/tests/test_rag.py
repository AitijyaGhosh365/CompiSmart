import sys
import os
import time
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.pinecone.db import get_video
from app.services.rag.pipeline import chat_stream

VIDEO_A_URL = "https://www.instagram.com/reel/DYrHdO-OkOM/"
VIDEO_B_URL = "https://www.instagram.com/reel/DYsSOk_p0yi/"


VIDEO_A_URL = "https://www.youtube.com/shorts/fe6Wc6OaMK8"
VIDEO_B_URL = "https://www.youtube.com/watch?v=1G4isv_Fylg"


print("\n=== Ingesting Video A ===")
result_a = get_video(url=VIDEO_A_URL)
print(f"  Status: {result_a['status']}")
if result_a['status'] == 'added':
    print(f"  Chunks upserted: {result_a['chunks_upserted']}")

# time.sleep(10)

print("\n=== Ingesting Video B ===")
result_b = get_video(url=VIDEO_B_URL)
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

    print("\nCompiSmart: ", end="", flush=True)
    response_chunks = []
    for chunk in chat_stream(query, history=history, source_urls=[VIDEO_A_URL, VIDEO_B_URL]):
        print(chunk, end="", flush=True)
        response_chunks.append(chunk)
    print("\n")
    response = "".join(response_chunks)

    history.append({"role": "user", "content": query})
    history.append({"role": "assistant", "content": response})