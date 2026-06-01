import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.youtube.scraper import get_youtube_metadata, scrape_video

YT_URL = "https://www.youtube.com/watch?v=1G4isv_Fylg"

print("=== YouTube Data API Metadata ===")
metadata = get_youtube_metadata(YT_URL)
for k, v in metadata.items():
    val = str(v)[:100].encode("ascii", "replace").decode("ascii")
    print(f"  {k}: {val}")

print("\n=== Full Pipeline (API metadata + AssemblyAI transcript) ===")
metadata, transcript = scrape_video(YT_URL)
print(f"Title: {metadata['title'][:80]}")
print(f"Creator: {metadata['creator']}")
print(f"Views: {metadata['views']:,}")
print(f"Transcript ({len(transcript)} chars):")
print(transcript[:300])
