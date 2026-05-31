import uuid
import json
import asyncio
from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse
from typing import Dict, Any

from app.models import VideoIngestRequest, VideoIngestResponse, VideoData, ChatRequest
from app.services.pinecone.db import get_video
from app.services.rag.pipeline import chat_stream
from app.services.youtube.scraper import get_youtube_metadata, is_youtube_url
from app.services.instagram.scraper import scrape_instagram_reels

router = APIRouter(prefix="/api", tags=["api"])

# In-memory store for session histories
session_histories = {}


def fetch_clean_metadata(url: str) -> dict:
    try:
        if is_youtube_url(url):
            return get_youtube_metadata(url)
        elif "instagram.com" in url:
            reels = scrape_instagram_reels([url])
            if reels:
                return reels[0]
    except Exception:
        pass
    return {}


def extract_video_fields(meta: dict, chunks_count: int, url: str) -> Dict[str, Any]:
    # Safely convert field values with defaults
    def to_int(v) -> int:
        if v is None:
            return 0
        try:
            return int(float(v))
        except:
            return 0
            
    def to_float(v) -> float:
        if v is None:
            return 0.0
        try:
            return float(v)
        except:
            return 0.0

    # hashtags parsing
    tags = meta.get("hashtags", [])
    if isinstance(tags, str):
        try:
            tags = eval(tags)
        except:
            tags = [tags] if tags else []

    duration_val = meta.get("duration", "0")
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

    # Format upload date beautifully (e.g., 20241117 -> 2024-11-17)
    upload_date = str(meta.get("upload_date", ""))
    if len(upload_date) == 8 and upload_date.isdigit():
        upload_date = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}"

    return {
        "title": meta.get("title", "Unknown Title") or "Unknown Title",
        "creator": meta.get("creator", "Unknown Creator") or "Unknown Creator",
        "views": to_int(meta.get("views", 0)),
        "likes": to_int(meta.get("likes", 0)),
        "comments": to_int(meta.get("comments", 0)),
        "engagement_rate": to_float(meta.get("engagement_rate", 0.0)),
        "follower_count": to_int(meta.get("follower_count") or meta.get("followers_count") or 0),
        "hashtags": tags,
        "upload_date": upload_date,
        "duration": duration_sec,
        "transcript_chunks": chunks_count,
        "video_url": url,
    }


@router.post("/videos/ingest", response_model=VideoIngestResponse)
async def ingest_videos(request: VideoIngestRequest):
    try:
        # 1. Start vector database indexing in a separate thread pool
        res_a = await asyncio.to_thread(get_video, request.video_a, "A")
        res_b = await asyncio.to_thread(get_video, request.video_b, "B")
        
        # 2. Fetch fresh, structured metadata directly from the scraper functions
        meta_a = await asyncio.to_thread(fetch_clean_metadata, request.video_a)
        meta_b = await asyncio.to_thread(fetch_clean_metadata, request.video_b)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest videos: {str(e)}")

    # Robustly parse chunks_a and chunks_b to ensure they are always valid integers (never None)
    def parse_chunks(res) -> int:
        val = res.get("chunks_upserted")
        if not val:
            stored = res.get("stored_metadata")
            if isinstance(stored, dict):
                val = stored.get("chunks_upserted")
        try:
            return int(float(val)) if val is not None else 10
        except:
            return 10

    chunks_a = parse_chunks(res_a)
    chunks_b = parse_chunks(res_b)

    fields_a = extract_video_fields(meta_a, chunks_a, request.video_a)
    fields_b = extract_video_fields(meta_b, chunks_b, request.video_b)

    video_a_data = VideoData(id="A", **fields_a)
    video_b_data = VideoData(id="B", **fields_b)

    session_id = str(uuid.uuid4())
    session_histories[session_id] = []

    return VideoIngestResponse(
        session_id=session_id,
        video_a=video_a_data,
        video_b=video_b_data,
        status="ready",
    )


@router.post("/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    history = session_histories.get(request.session_id, [])

    # Safe iterator chunk getter to prevent asyncio StopIteration Future crashes
    def get_next_chunk(it):
        try:
            return True, next(it)
        except StopIteration:
            return False, None

    async def event_generator():
        response_chunks = []
        try:
            loop = asyncio.get_event_loop()
            iterator = chat_stream(request.message, history=history)
            
            while True:
                has_next, chunk = await loop.run_in_executor(None, get_next_chunk, iterator)
                if not has_next:
                    break
                if chunk:
                    response_chunks.append(chunk)
                    yield {"event": "message", "data": json.dumps({"type": "chunk", "content": chunk})}
        except Exception as e:
            yield {"event": "message", "data": json.dumps({"type": "chunk", "content": f"\n\n*Error: {str(e)}*"})}

        full_response = "".join(response_chunks)
        history.append({"role": "user", "content": request.message})
        history.append({"role": "assistant", "content": full_response})
        session_histories[request.session_id] = history

        yield {"event": "message", "data": json.dumps({"type": "done"})}

    return EventSourceResponse(event_generator())


@router.delete("/sessions/{session_id}")
async def clear_session(session_id: str):
    if session_id in session_histories:
        del session_histories[session_id]
    return {"status": "cleared", "session_id": session_id}
