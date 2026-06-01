import json
import asyncio
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from app.models import ChatRequest
from app.services.pinecone.db import get_video
from app.api.state import session_histories

router = APIRouter(prefix="/api", tags=["chat"])

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

            # Dynamic In-Context Ingestion: If any video is not in the database, index it dynamically!
            for idx, url in enumerate(source_urls):
                vid_label = "A" if idx == 0 else "B"
                res = await loop.run_in_executor(None, lambda u=url: get_video(u))
                if res.get("status") == "added":
                    yield {
                        "event": "message",
                        "data": json.dumps({
                            "type": "chunk",
                            "content": f"🌐 *Video {vid_label} was not found in the vector index. Scraping and indexing transcript right now...*\n"
                        })
                    }
                    await asyncio.sleep(0.5)

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
