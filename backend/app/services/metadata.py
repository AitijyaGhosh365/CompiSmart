import yt_dlp
from typing import Dict, Any


def get_video_metadata(url: str) -> Dict[str, Any]:
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)

        if not info:
            raise ValueError(f"Could not extract metadata from URL: {url}")

        metadata = {
            "title": info.get("title", "Unknown"),
            "creator": info.get("channel", info.get("uploader", "Unknown")),
            "views": info.get("view_count", 0) or 0,
            "likes": info.get("like_count", 0) or 0,
            "comments": info.get("comment_count", 0) or 0,
            "follower_count": info.get("channel_follower_count", 0) or 0,
            "hashtags": extract_hashtags(info.get("description", "") or ""),
            "upload_date": info.get("upload_date", "Unknown"),
            "duration": str(info.get("duration", 0) or 0) + " seconds",
        }

        return metadata


def extract_hashtags(description: str) -> list:
    import re
    if not description:
        return []
    hashtags = re.findall(r'#\w+', description)
    return list(set(hashtags))
