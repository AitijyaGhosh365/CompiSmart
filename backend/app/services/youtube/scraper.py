import re
from typing import Optional
from youtube_transcript_api import YouTubeTranscriptApi
import yt_dlp


def is_youtube_url(url: str) -> bool:
    return bool(re.match(r'(https?://)?(www\.)?(youtube\.com/watch\?v=|youtu\.be/)', url))


def extract_video_id(url: str) -> Optional[str]:
    if is_youtube_url(url):
        match = re.search(r'v=([a-zA-Z0-9_-]+)', url)
        if match:
            return match.group(1)
        match = re.search(r'youtu\.be/([a-zA-Z0-9_-]+)', url)
        if match:
            return match.group(1)
    return None


def get_youtube_transcript(url: str) -> str:
    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError(f"Could not extract video ID from YouTube URL: {url}")

    api = YouTubeTranscriptApi()
    transcript = api.fetch(video_id)
    return " ".join([snippet.text for snippet in transcript.snippets])





def get_transcript(url: str) -> str:
    if is_youtube_url(url):
        return get_youtube_transcript(url)

    else:
        raise ValueError(f"Unsupported URL format: {url}")
