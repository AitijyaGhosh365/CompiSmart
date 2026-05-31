from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.youtube.scraper import (
    is_youtube_url,
    get_youtube_transcript,
    extract_video_id,
    get_youtube_metadata,
)
from app.services.utils.engagement import calculate_engagement_rate

router = APIRouter(prefix="/api/youtube", tags=["youtube"])


class UrlRequest(BaseModel):
    url: str


class YouTubeVideoInfo(BaseModel):
    video_id: str
    title: str
    creator: str
    views: int
    likes: int
    comments: int
    engagement_rate: float
    follower_count: int
    hashtags: list[str]
    upload_date: str
    duration: int
    transcript: str


@router.post("/info", response_model=YouTubeVideoInfo)
async def get_video_info(request: UrlRequest):
    if not is_youtube_url(request.url):
        raise HTTPException(status_code=400, detail="URL must be a YouTube URL")

    try:
        metadata = get_youtube_metadata(request.url)
        transcript = get_youtube_transcript(request.url)
        video_id = extract_video_id(request.url) or ""
        
        # Safe duration conversion to int
        duration_val = metadata.get("duration", 0)
        duration_sec = 0
        if isinstance(duration_val, (int, float)):
            duration_sec = int(duration_val)
        elif isinstance(duration_val, str):
            parts = duration_val.split(":")
            try:
                if len(parts) == 2:
                    duration_sec = int(parts[0]) * 60 + int(parts[1])
                elif len(parts) == 3:
                    duration_sec = int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
                else:
                    duration_sec = int(float(duration_val))
            except:
                duration_sec = 0

        engagement = calculate_engagement_rate(
            metadata.get("views") or 0,
            metadata.get("likes") or 0,
            metadata.get("comments") or 0,
        )

        return YouTubeVideoInfo(
            video_id=video_id,
            title=metadata.get("title", "Unknown Title") or "Unknown Title",
            creator=metadata.get("creator", "Unknown Channel") or "Unknown Channel",
            views=metadata.get("views") or 0,
            likes=metadata.get("likes") or 0,
            comments=metadata.get("comments") or 0,
            engagement_rate=engagement,
            follower_count=metadata.get("followers_count") or metadata.get("follower_count") or 0,
            hashtags=metadata.get("hashtags", []),
            upload_date=str(metadata.get("upload_date", "")),
            duration=duration_sec,
            transcript=transcript,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process video: {str(e)}")
