import re
from typing import Optional
from youtube_transcript_api import YouTubeTranscriptApi
import yt_dlp
from app.services.utils.engagement import calculate_engagement_rate


def is_youtube_url(url: str) -> bool:
    pattern = (
        r'^(https?://)?'
        r'((www|m)\.)?'
        r'(youtube\.com/(watch\?v=|shorts/)|youtu\.be/)'
    )
    print("Validated :", bool(re.match(pattern, url)))
    return bool(re.match(pattern, url))


def extract_video_id(url: str) -> Optional[str]:
    if is_youtube_url(url):
        match = re.search(r'v=([a-zA-Z0-9_-]+)', url)
        if match:
            return match.group(1)
        match = re.search(r'youtu\.be/([a-zA-Z0-9_-]+)', url)
        if match:
            return match.group(1)
        match = re.search(r'shorts/([a-zA-Z0-9_-]+)', url)
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


def get_youtube_transcript_timestamped(url: str) -> list:
    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError(f"Could not extract video ID from YouTube URL: {url}")

    api = YouTubeTranscriptApi()
    transcript = api.fetch(video_id)
    return [
        {"text": snippet.text, "start": snippet.start, "duration": snippet.duration}
        for snippet in transcript.snippets
    ]





def get_youtube_metadata(url: str) -> dict:
    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError(f"Could not extract video ID from YouTube URL: {url}")

    ydl_opts = {"quiet": True, "no_warnings": True, "extract_flat": False}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)

    return {
        "title": info.get("title"),
        "description": info.get("description"),
        "creator": info.get("channel"),
        "creator_id": info.get("channel_id"),
        
        "followers_count": info.get("channel_follower_count"),
        
        "likes": info.get("like_count"),
        "comments": info.get("comment_count"),
        
        "views": info.get("view_count"),
        
        "engagement_rate": calculate_engagement_rate(
            info.get("view_count") or 0,
            info.get("like_count") or 0,
            info.get("comment_count") or 0,
        ),
        
        
        
        "hashtags": [tag.strip("#") for tag in info.get("tags", [])] if info.get("tags") else [],
        
        "upload_date": info.get("upload_date"),
        
        "duration": info.get("duration_string") or str(info.get("duration", "")),
        
        "video_url": url,
        "audio_url": url,
        
        "verified": info.get("channel_is_verified"),
    }


def scrape_video(url: str) -> tuple[dict, str]:
    print(f"  [Scraper] Fetching YouTube metadata for URL: {url}...")
    metadata = get_youtube_metadata(url)
    print(f"  [Scraper] YouTube metadata fetched successfully. Channel: @{metadata.get('creator')}.")
    
    print(f"  [Scraper] Fetching YouTube transcript subtitles...")
    try:
        transcript = get_youtube_transcript(url)
        print(f"  [Scraper] YouTube transcript subtitles fetched successfully.")
    except Exception as e:
        print(f"  [Scraper] Transcript fetch failed for YouTube URL {url}: {e}. Falling back to placeholder.")
        transcript = "[No transcript available for this video]"
    return metadata, transcript


def scrape_video_timestamped(url: str) -> tuple[dict, list]:
    print(f"  [Scraper] Fetching YouTube metadata for URL: {url}...")
    metadata = get_youtube_metadata(url)
    print(f"  [Scraper] YouTube metadata fetched successfully. Channel: @{metadata.get('creator')}.")
    
    print(f"  [Scraper] Fetching YouTube transcript subtitles...")
    try:
        timestamped = get_youtube_transcript_timestamped(url)
        print(f"  [Scraper] YouTube transcript subtitles fetched successfully ({len(timestamped)} segments).")
    except Exception as e:
        print(f"  [Scraper] Transcript fetch failed for YouTube URL {url}: {e}. Falling back to placeholder.")
        timestamped = [{"text": "[No transcript available for this video]", "start": 0.0, "duration": 10.0}]
    return metadata, timestamped


def get_transcript(url: str) -> str:
    if is_youtube_url(url):
        return get_youtube_transcript(url)
    raise ValueError(f"Unsupported URL format: {url}")
