import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.instagram.scraper import scrape_instagram_reels
from app.services.assemblyAi.transcript import transcribe_audio

REEL_URL = "https://www.instagram.com/reels/DY0NYmRhy7N/"


def test_reel_transcript():
    print("--- Scraping reel ---")
    reels = scrape_instagram_reels([REEL_URL])

    if not reels:
        print("No reel data returned")
        return

    reel = reels[0]
    audio_url = reel.get("video_url") or reel.get("audio_url")

    if not audio_url:
        print(f"No audio/video URL found. Keys: {list(reel.keys())}")
        return

    print(f"Audio URL: {audio_url[:80]}...")

    print("--- Transcribing ---")
    text = transcribe_audio(audio_url)
    print(f"Transcript ({len(text)} chars):")
    print(text)


if __name__ == "__main__":
    test_reel_transcript()