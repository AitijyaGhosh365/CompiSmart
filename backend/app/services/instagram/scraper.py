import httpx
import re
from typing import List, Dict, Any
from app.config import get_settings

PROFILE_DATASET_ID = "gd_l1vikfch901nx3by4"
POST_DATASET_ID = "gd_lk5ns7kz21pck8jpis"
REEL_DATASET_ID = "gd_lyclm20il4r5helnj"

BASE_URL = "https://api.brightdata.com/datasets/v3/scrape"

POST_RE = re.compile(r'(https?://)?(www\.)?instagram\.com/p/[A-Za-z0-9_-]+/?')
REEL_RE = re.compile(r'(https?://)?(www\.)?instagram\.com/reels?/[A-Za-z0-9_-]+/?')


def _validate_url(url: str, pattern: re.Pattern) -> str:
    if not pattern.match(url):
        raise ValueError(f"Invalid Instagram URL: {url}")
    return url

def _simplify_content(item: Dict[str, Any]) -> Dict[str, Any]:
    description = item.get("description", "")

    duration = None
    videos_duration = item.get("videos_duration", [])

    if videos_duration and isinstance(videos_duration, list):
        duration = videos_duration[0].get("video_duration")

    video_url = None
    videos = item.get("videos", [])

    if videos and isinstance(videos, list):
        video_url = videos[0]

    return {
        "title": description.split("\n")[0].strip() if description else None,
        "description": description,

        "creator": item.get("user_posted"),
        "creator_id": item.get("user_posted_id"),

        "followers_count": item.get("followers"),

        "likes": item.get("likes"),
        "comments": item.get("num_comments"),

        "views": (
            item.get("video_play_count")
            or item.get("video_view_count")
            or item.get("views")
        ),

        "hashtags": item.get("hashtags", []),

        "upload_date": item.get("date_posted"),

        "duration": duration,

        "video_url": video_url,

        "audio_url": item.get("audio_url"),

        "content_type": item.get("content_type"),

        "thumbnail": item.get("thumbnail"),

        "verified": item.get("is_verified"),
    }

def _scrape(
    dataset_id: str,
    urls: List[str],
) -> List[Dict[str, Any]]:
    settings = get_settings()
    response = httpx.post(
        BASE_URL,
        headers={
            "Authorization": f"Bearer {settings.brightdata_api_key}",
            "Content-Type": "application/json",
        },
        params={
            "dataset_id": dataset_id,
            "notify": "false",
            "include_errors": "true",
        },
        json={
            "input": [{"url": url} for url in urls]
        },
        timeout=120.0,
    )

    response.raise_for_status()
    data = response.json()

    if isinstance(data, dict):
        if "output" in data:
            data = data["output"]
        else:
            data = [data]

    return data if isinstance(data, list) else []


def scrape_instagram_profiles(urls: List[str]) -> List[Dict[str, Any]]:
    return _scrape(PROFILE_DATASET_ID, urls)


def scrape_instagram_posts(urls: List[str]) -> List[Dict[str, Any]]:
    for url in urls:
        _validate_url(url, POST_RE) 

    posts = _scrape(POST_DATASET_ID, urls)

    return [_simplify_content(post) for post in posts]

def scrape_instagram_reels(urls: List[str]) -> List[Dict[str, Any]]:
    post_urls = []
    

    for url in urls:
        _validate_url(url, REEL_RE) or _validate_url(url, POST_RE)

        post_urls.append(
            url.replace("/reels/", "/p/")
               .replace("/reel/", "/p/")
        )

    print(post_urls)
    return scrape_instagram_posts(post_urls)

def get_snapshot(snapshot_id: str) -> Dict[str, Any]:
    settings = get_settings()
    response = httpx.get(
        f"https://api.brightdata.com/datasets/v3/snapshot/{snapshot_id}",
        headers={
            "Authorization": f"Bearer {settings.brightdata_api_key}",
        },
        timeout=120.0,
    )
    response.raise_for_status()
    return response.json()

