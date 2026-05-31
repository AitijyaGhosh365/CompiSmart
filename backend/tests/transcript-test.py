import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.transcript import get_transcript, is_youtube_url, is_instagram_url
from app.services.metadata import get_video_metadata

YT_URL = "https://www.youtube.com/watch?v=pEVAmal41Go"

def test_youtube_url_detection():
    assert is_youtube_url(YT_URL) is True
    assert is_youtube_url("https://youtu.be/dQw4w9WgXcQ") is True
    assert is_youtube_url("https://instagram.com/reel/abc") is False
    print("PASS: YouTube URL detection")

def test_instagram_url_detection():
    assert is_instagram_url("https://www.instagram.com/reel/abc123") is True
    assert is_instagram_url("https://instagram.com/reel/xyz") is True
    assert is_instagram_url(YT_URL) is False
    print("PASS: Instagram URL detection")

def test_youtube_transcript():
    try:
        transcript = get_transcript(YT_URL)
        assert len(transcript) > 0
        print(f"PASS: YouTube transcript fetched ({len(transcript)} chars)")
    except Exception as e:
        print(f"FAIL: YouTube transcript - {e}")

if __name__ == "__main__":
    res = get_transcript(YT_URL)
    print(res)
    
    res = get_video_metadata(YT_URL)
    print(res)
