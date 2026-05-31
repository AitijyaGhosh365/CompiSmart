import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.embedding.embedding import get_embedding

result = get_embedding("How to make a cake")
print(f"Embedding length: {len(result)}")
print(f"First 5 values: {result[:5]}")