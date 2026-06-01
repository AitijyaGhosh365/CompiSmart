import re
import httpx
from typing import Optional
from app.config import get_settings
from app.services.utils.engagement import calculate_engagement_rate

YOUTUBE_DATASET_ID = "gd_lk56epmy2i5g7lzu0k"
BRIGHTDATA_URL = "https://api.brightdata.com/datasets/v3/scrape"


def is_youtube_url(url: str) -> bool:
    pattern = (
        r'^(https?://)?'
        r'((www|m)\.)?'
        r'(youtube\.com/(watch\?v=|shorts/)|youtu\.be/)'
    )
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


def _fetch_brightdata(url: str) -> dict:
    settings = get_settings()
    resp = httpx.post(
        BRIGHTDATA_URL,
        headers={
            "Authorization": f"Bearer {settings.brightdata_api_key}",
            "Content-Type": "application/json",
        },
        params={"dataset_id": YOUTUBE_DATASET_ID, "include_errors": "true"},
        json={"input": [{"url": url}]},
        timeout=120.0,
    )
    resp.raise_for_status()
    data = resp.json()
    if isinstance(data, dict):
        if "output" in data:
            data = data["output"]
        else:
            data = [data]
    if isinstance(data, list) and data:
        return data[0]
    return {}


def get_youtube_transcript(url: str) -> str:
    raw = _fetch_brightdata(url)
    return raw.get("transcript") or "[No transcript available]"


def get_youtube_transcript_timestamped(url: str) -> list:
    transcript = get_youtube_transcript(url)
    return [{"text": transcript, "start": 0.0, "duration": 0.0}]


def get_youtube_metadata(url: str) -> dict:
    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError(f"Could not extract video ID from YouTube URL: {url}")

    settings = get_settings()
    resp = httpx.get(
        "https://www.googleapis.com/youtube/v3/videos",
        params={
            "part": "snippet,statistics,contentDetails",
            "id": video_id,
            "key": settings.youtube_api_key,
        },
        timeout=15.0,
    )
    resp.raise_for_status()
    data = resp.json()
    item = data["items"][0] if data.get("items") else {}

    snippet = item.get("snippet", {})
    stats = item.get("statistics", {})
    details = item.get("contentDetails", {})

    views = int(stats.get("viewCount", 0))
    likes = int(stats.get("likeCount", 0))
    comments = int(stats.get("commentCount", 0))

    return {
        "title": snippet.get("title", ""),
        "description": snippet.get("description", ""),
        "creator": snippet.get("channelTitle", ""),
        "creator_id": snippet.get("channelId", ""),
        "followers_count": 0,
        "likes": likes,
        "comments": comments,
        "views": views,
        "engagement_rate": calculate_engagement_rate(views, likes, comments),
        "hashtags": snippet.get("tags", []),
        "upload_date": snippet.get("publishedAt", ""),
        "duration": details.get("duration", ""),
        "video_url": url,
        "audio_url": url,
        "verified": False,
    }


def scrape_video(url: str) -> tuple[dict, str]:
    print(f"  [Scraper] Fetching YouTube metadata via API...")
    metadata = get_youtube_metadata(url)
    print(f"  [Scraper] Metadata fetched. Channel: @{metadata.get('creator')}.")
    
    print(f"  [Scraper] Fetching transcript via Bright Data...")
    transcript = get_youtube_transcript(url)
    print(f"  [Scraper] Transcript ready ({len(transcript)} chars).")
    return metadata, transcript


def scrape_video_timestamped(url: str) -> tuple[dict, list]:
    print(f"  [Scraper] Fetching YouTube metadata via API...")
    metadata = get_youtube_metadata(url)
    print(f"  [Scraper] Metadata fetched. Channel: @{metadata.get('creator')}.")
    
    print(f"  [Scraper] Fetching transcript via Bright Data...")
    timestamped = get_youtube_transcript_timestamped(url)
    print(f"  [Scraper] Transcript ready.")
    return metadata, timestamped


def get_transcript(url: str) -> str:
    if is_youtube_url(url):
        return get_youtube_transcript(url)
    raise ValueError(f"Unsupported URL format: {url}")
