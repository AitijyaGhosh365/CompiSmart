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
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=f"Validation Error: {str(ve)}")
    except Exception as e:
        error_msg = str(e)
        # Handle truncated/incomplete YouTube ID or invalid URLs gracefully
        if "truncated" in error_msg.lower() or "incomplete" in error_msg.lower() or "youtube:" in error_msg.lower():
            raise HTTPException(
                status_code=400,
                detail=f"Invalid or truncated URL provided: {error_msg}"
            )
        raise HTTPException(
            status_code=400,
            detail=f"Failed to ingest video metadata: {error_msg}"
        )

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
    session_histories[session_id] = {
        "history": [],
        "video_a_url": request.video_a,
        "video_b_url": request.video_b
    }


    return VideoIngestResponse(
        session_id=session_id,
        video_a=video_a_data,
        video_b=video_b_data,
        status="ready",
    )


@router.post("/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    session_data = session_histories.get(request.session_id, {})
    if isinstance(session_data, dict):
        history = session_data.get("history", [])
        video_a_url = session_data.get("video_a_url", "")
        video_b_url = session_data.get("video_b_url", "")
    else:
        history = []
        video_a_url = ""
        video_b_url = ""

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
            
            # Step 1: Pinecone Querying
            yield {
                "event": "message",
                "data": json.dumps({
                    "type": "chunk",
                    "content": "🔍 *Querying Pinecone vector database for matching concepts...*\n"
                })
            }
            await asyncio.sleep(0.3)

            from app.services.rag.pipeline import (
                search_pinecone,
                get_all_chunks_by_url,
                format_context,
                SYSTEM_PROMPT,
                _extract_text
            )
            from app.config import get_settings
            from langchain_google_genai import ChatGoogleGenerativeAI
            from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

            settings = get_settings()

            # Execute Pinecone lookup in executor, filtering strictly by the active video URLs!
            source_urls = [url for url in [video_a_url, video_b_url] if url]
            chunks = await loop.run_in_executor(
                None, 
                lambda: search_pinecone(query=request.message, top_k=settings.top_k, source_urls=source_urls)
            )

            # Step 2: Report Matches Found
            yield {
                "event": "message",
                "data": json.dumps({
                    "type": "chunk",
                    "content": f"⚡ *Found {len(chunks)} relevant semantic matches. Retrieving full video segments...*\n"
                })
            }
            await asyncio.sleep(0.2)

            # Fetch transcripts and construct complete context
            def compile_extra_chunks():
                extra_c = []
                seen_ids = {c["id"] for c in chunks}
                for url in source_urls:
                    vid_chunks = get_all_chunks_by_url(url)
                    for c in vid_chunks:
                        if c["id"] not in seen_ids:
                            seen_ids.add(c["id"])
                            extra_c.append(c)
                return extra_c

            extra_chunks = await loop.run_in_executor(None, compile_extra_chunks)
            total_loaded = len(chunks) + len(extra_chunks)

            # Dynamically map the retrieved chunks' video_id in-memory to A or B based on their URL
            # This completely avoids any old cached video_id slot mappings in the database!
            for c in chunks + extra_chunks:
                if c.get("source_url") == video_a_url:
                    c["video_id"] = "A"
                elif c.get("source_url") == video_b_url:
                    c["video_id"] = "B"

            # Step 3: Report Context Compiled
            yield {
                "event": "message",
                "data": json.dumps({
                    "type": "chunk",
                    "content": f"📚 *Compiled {total_loaded} context blocks. Injecting comparative RAG references...*\n"
                })
            }
            await asyncio.sleep(0.2)

            # Package and yield sources to the frontend
            sources = []
            for c in chunks + extra_chunks:
                sources.append({
                    "video": c.get("video_id", "A"),
                    "chunk_id": c.get("id", ""),
                    "text": c.get("text", "")[:120] + "..."
                })
            
            yield {"event": "message", "data": json.dumps({"type": "sources", "sources": sources})}

            # Step 4: Contact LLM
            yield {
                "event": "message",
                "data": json.dumps({
                    "type": "chunk",
                    "content": "🤖 *Formulating response with Gemini Generative AI...*\n\n"
                })
            }

            # Gather messages history
            messages_history = []
            if history:
                for msg in history:
                    if msg["role"] == "user":
                        messages_history.append(HumanMessage(content=msg["content"]))
                    elif msg["role"] == "assistant":
                        messages_history.append(AIMessage(content=msg["content"]))
            messages_history.append(HumanMessage(content=request.message))

            full_chunks = chunks + extra_chunks
            
            # Segregated RAG Context Formatting to prevent LLM slot confusion
            context_parts = []
            if source_urls and len(source_urls) >= 2:
                for idx, url in enumerate(source_urls):
                    vid_label = "A" if idx == 0 else "B"
                    url_chunks = [c for c in full_chunks if c.get("source_url") == url]
                    formatted = format_context(url_chunks)
                    context_parts.append(f"=== CONTEXT FOR VIDEO {vid_label} (URL: {url}) ===\n{formatted}")
                context = "\n\n".join(context_parts)
            else:
                context = format_context(full_chunks)

            system_msg = SystemMessage(content=f"{SYSTEM_PROMPT}\n\nContext:\n{context}")

            llm = ChatGoogleGenerativeAI(
                model=settings.llm_model,
                google_api_key=settings.gemini_api_key,
            )
            all_messages = [system_msg] + messages_history

            # Obtain streaming iterator in executor
            stream_it = await loop.run_in_executor(None, lambda: llm.stream(all_messages))

            while True:
                has_next, llm_chunk = await loop.run_in_executor(None, get_next_chunk, stream_it)
                if not has_next:
                    break
                if llm_chunk:
                    content = _extract_text(llm_chunk.content)
                    if content:
                        response_chunks.append(content)
                        yield {"event": "message", "data": json.dumps({"type": "chunk", "content": content})}

        except Exception as e:
            yield {"event": "message", "data": json.dumps({"type": "chunk", "content": f"\n\n*Error: {str(e)}*"})}

        full_response = "".join(response_chunks)
        history.append({"role": "user", "content": request.message})
        history.append({"role": "assistant", "content": full_response})
        
        # Save session histories correctly with history, video_a_url and video_b_url
        if isinstance(session_histories.get(request.session_id), dict):
            session_histories[request.session_id]["history"] = history
        else:
            session_histories[request.session_id] = {
                "history": history,
                "video_a_url": video_a_url,
                "video_b_url": video_b_url
            }

        yield {"event": "message", "data": json.dumps({"type": "done"})}

    return EventSourceResponse(event_generator())


@router.delete("/sessions/{session_id}")
async def clear_session(session_id: str):
    if session_id in session_histories:
        del session_histories[session_id]
    return {"status": "cleared", "session_id": session_id}
