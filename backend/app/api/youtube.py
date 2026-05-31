from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.youtube.transcript import (
    is_youtube_url,
    get_youtube_transcript,
    extract_video_id,
)
from app.services.metadata import get_video_metadata
from app.services.engagement import calculate_engagement_rate

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
        metadata = get_video_metadata(request.url)
        transcript = get_youtube_transcript(request.url)
        video_id = extract_video_id(request.url) or ""
        engagement = calculate_engagement_rate(
            metadata["views"], metadata["likes"], metadata["comments"]
        )

        return YouTubeVideoInfo(
            video_id=video_id,
            title=metadata["title"],
            creator=metadata["creator"],
            views=metadata["views"],
            likes=metadata["likes"],
            comments=metadata["comments"],
            engagement_rate=engagement,
            follower_count=metadata["follower_count"],
            hashtags=metadata["hashtags"],
            upload_date=metadata["upload_date"],
            duration=metadata["duration"],
            transcript=transcript,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process video: {str(e)}")
