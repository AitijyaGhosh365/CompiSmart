import sys
import os
import time
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import httpx
import yt_dlp
from app.config import get_settings

YT_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
settings = get_settings()

print("=== Step 1: Extract direct audio URL via yt-dlp ===")
ydl_opts = {"quiet": True, "no_warnings": True, "format": "bestaudio/best"}
with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    info = ydl.extract_info(YT_URL, download=False)

audio_url = info.get("url")
if not audio_url:
    for fmt in info.get("formats", []):
        if fmt.get("acodec") != "none" and fmt.get("url"):
            audio_url = fmt["url"]
            break
print(f"Audio URL: {audio_url[:80]}...")

print("\n=== Step 2: Download audio bytes ===")
audio_bytes = httpx.get(audio_url, timeout=60, follow_redirects=True).content
print(f"Downloaded: {len(audio_bytes)} bytes ({len(audio_bytes) / 1024:.1f} KB)")

print("\n=== Step 3: Upload to AssemblyAI ===")
resp = httpx.post(
    "https://api.assemblyai.com/v2/upload",
    headers={"authorization": settings.assemblyai_api_key},
    content=audio_bytes,
)
resp.raise_for_status()
upload_url = resp.json()["upload_url"]
print(f"Upload OK: {upload_url[:50]}...")

print("\n=== Step 4: Start transcription ===")
resp = httpx.post(
    "https://api.assemblyai.com/v2/transcript",
    json={"audio_url": upload_url, "language_detection": True},
    headers={"authorization": settings.assemblyai_api_key},
)
resp.raise_for_status()
transcript_id = resp.json()["id"]

print("=== Polling ===")
while True:
    resp = httpx.get(
        f"https://api.assemblyai.com/v2/transcript/{transcript_id}",
        headers={"authorization": settings.assemblyai_api_key},
    )
    r = resp.json()
    s = r["status"]
    print(f"  {s}")
    if s == "completed":
        print(f"\nTranscript ({len(r['text'])} chars):\n{r['text'][:500]}")
        break
    elif s == "error":
        print(f"ERROR: {r.get('error')}")
        break
    time.sleep(3)
