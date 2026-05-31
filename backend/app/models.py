from pydantic import BaseModel, Field
from typing import List, Optional, Literal


class VideoIngestRequest(BaseModel):
    video_a: str = Field(..., description="YouTube video URL")
    video_b: str = Field(..., description="Instagram Reel URL")


class VideoData(BaseModel):
    id: Literal["A", "B"]
    title: str
    creator: str
    views: int
    likes: int
    comments: int
    engagement_rate: float
    follower_count: int
    hashtags: List[str]
    upload_date: str
    duration: int
    transcript_chunks: int


class VideoIngestResponse(BaseModel):
    session_id: str
    video_a: VideoData
    video_b: VideoData
    status: str


class ChatRequest(BaseModel):
    session_id: str
    message: str


class Source(BaseModel):
    video: Literal["A", "B"]
    chunk_id: str
    text: str


class HealthResponse(BaseModel):
    status: str
    vector_db: str
