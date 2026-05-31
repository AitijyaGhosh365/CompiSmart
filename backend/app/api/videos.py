import uuid
import json
from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.models import VideoIngestRequest, VideoIngestResponse, VideoData, ChatRequest
from app.services.transcript import get_transcript, is_youtube_url
from app.services.metadata import get_video_metadata
from app.services.engagement import calculate_engagement_rate
from app.services.embedding import chunk_transcript, store_chunks_in_chroma
from app.services.rag import stream_rag_response
from app.services.memory import clear_memory

router = APIRouter(prefix="/api", tags=["api"])


@router.post("/videos/ingest", response_model=VideoIngestResponse)
async def ingest_videos(request: VideoIngestRequest):
    if not is_youtube_url(request.video_a):
        raise HTTPException(status_code=400, detail="video_a must be a YouTube URL")
    if not is_youtube_url(request.video_b):
        raise HTTPException(status_code=400, detail="video_b must be a YouTube URL")

    session_id = str(uuid.uuid4())

    try:
        transcript_a = get_transcript(request.video_a)
        metadata_a = get_video_metadata(request.video_a)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process Video A: {str(e)}")

    try:
        transcript_b = get_transcript(request.video_b)
        metadata_b = get_video_metadata(request.video_b)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process Video B: {str(e)}")

    engagement_a = calculate_engagement_rate(
        metadata_a["views"], metadata_a["likes"], metadata_a["comments"]
    )
    engagement_b = calculate_engagement_rate(
        metadata_b["views"], metadata_b["likes"], metadata_b["comments"]
    )

    chunks_a = chunk_transcript(transcript_a, "A", session_id)
    chunks_b = chunk_transcript(transcript_b, "B", session_id)

    store_chunks_in_chroma(session_id, chunks_a)
    store_chunks_in_chroma(session_id, chunks_b)

    video_a_data = VideoData(
        id="A",
        title=metadata_a["title"],
        creator=metadata_a["creator"],
        views=metadata_a["views"],
        likes=metadata_a["likes"],
        comments=metadata_a["comments"],
        engagement_rate=engagement_a,
        follower_count=metadata_a["follower_count"],
        hashtags=metadata_a["hashtags"],
        upload_date=metadata_a["upload_date"],
        duration=metadata_a["duration"],
        transcript_chunks=len(chunks_a),
    )

    video_b_data = VideoData(
        id="B",
        title=metadata_b["title"],
        creator=metadata_b["creator"],
        views=metadata_b["views"],
        likes=metadata_b["likes"],
        comments=metadata_b["comments"],
        engagement_rate=engagement_b,
        follower_count=metadata_b["follower_count"],
        hashtags=metadata_b["hashtags"],
        upload_date=metadata_b["upload_date"],
        duration=metadata_b["duration"],
        transcript_chunks=len(chunks_b),
    )

    return VideoIngestResponse(
        session_id=session_id,
        video_a=video_a_data,
        video_b=video_b_data,
        status="ready",
    )


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    async def event_generator():
        async for event in stream_rag_response(request.session_id, request.message):
            yield {"event": event["type"], "data": json.dumps(event)}

    return EventSourceResponse(event_generator())


@router.delete("/sessions/{session_id}")
async def clear_session(session_id: str):
    clear_memory(session_id)
    return {"status": "cleared", "session_id": session_id}
