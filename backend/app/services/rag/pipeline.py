import re
from typing import Dict, Any, List, Optional
from pinecone import Pinecone
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, MessagesState, START, END
from app.config import get_settings
from app.services.pinecone.db import _get_index, _url_to_source_id, NAMESPACE


def search_pinecone(
    query: str,
    video_id: str = "",
    top_k: int = 5,
    source_urls: List[str] = None,
) -> List[Dict[str, Any]]:
    settings = get_settings()
    index = _get_index()

    # If source_urls are provided, perform individual exact equality queries for each video URL
    if source_urls:
        all_hits = []
        seen_ids = set()
        
        # Balance results: split top_k evenly between the source URLs
        sub_k = max(1, top_k // len(source_urls))
        
        for url in source_urls:
            search_kwargs = {
                "namespace": NAMESPACE,
                "top_k": sub_k,
                "inputs": {"text": query},
                "filter": {"source_url": {"$eq": url}}  # Exact equality metadata filter
            }
            try:
                results = index.search(**search_kwargs)
                hits = results.result.hits if hasattr(results, 'result') and hasattr(results.result, 'hits') else []
                for hit in hits:
                    hit_id = getattr(hit, "id", None) or getattr(hit, "id_", None) or (hit.get("id_") or hit.get("id") or hit.get("_id") if isinstance(hit, dict) else "")
                    if hit_id and hit_id not in seen_ids:
                        seen_ids.add(hit_id)
                        all_hits.append(hit)
            except Exception:
                pass
        hits = all_hits
    else:
        search_kwargs = {
            "namespace": NAMESPACE,
            "top_k": top_k,
            "inputs": {"text": query},
        }
        if video_id:
            search_kwargs["filter"] = {"video_id": video_id}

        results = index.search(**search_kwargs)
        hits = results.result.hits if hasattr(results, 'result') and hasattr(results.result, 'hits') else []

    return [
        {
            "id": getattr(hit, "id", None) or getattr(hit, "id_", None) or (hit.get("id_") or hit.get("id") or hit.get("_id") if isinstance(hit, dict) else ""),
            "text": (hit.get("fields", {}) if isinstance(hit, dict) else getattr(hit, "fields", {}) or {}).get("text", ""),
            "score": getattr(hit, "score", None) or getattr(hit, "score_", None) or (hit.get("score_") or hit.get("score") if isinstance(hit, dict) else 0),
            "video_id": (hit.get("fields", {}) if isinstance(hit, dict) else getattr(hit, "fields", {}) or {}).get("video_id", ""),
            "source_url": (hit.get("fields", {}) if isinstance(hit, dict) else getattr(hit, "fields", {}) or {}).get("source_url", ""),
            "chunk_type": (hit.get("fields", {}) if isinstance(hit, dict) else getattr(hit, "fields", {}) or {}).get("chunk_type", ""),
            "chunk_index": (hit.get("fields", {}) if isinstance(hit, dict) else getattr(hit, "fields", {}) or {}).get("chunk_index", ""),
        }
        for hit in hits
    ]


def format_context(chunks: List[Dict[str, Any]]) -> str:
    if not chunks:
        return "No relevant context found."

    def sort_key(c):
        if c.get("chunk_type") == "meta":
            return (0, c.get("video_id", ""), 0)
        return (1, c.get("video_id", ""), c.get("chunk_index", 0) or 0)

    sorted_chunks = sorted(chunks, key=sort_key)

    parts = []
    for i, chunk in enumerate(sorted_chunks, 1):
        vid = chunk.get("video_id", "?")
        ctype = chunk.get("chunk_type", "")
        text = chunk.get("text", "")
        label = f"Video {vid}"
        if ctype == "meta":
            label += " (metadata)"
        else:
            label += f" (chunk {chunk.get('chunk_index', '?')})"
        parts.append(f"[{i}] {label}:\n{text}")

    return "\n\n".join(parts)


SYSTEM_PROMPT = """You are CompiSmart, an AI assistant that helps creators analyze and compare social media videos.

You have access to context from two videos (Video A and Video B). The context includes metadata and transcript chunks.

Rules:
- Always cite your sources using [1], [2], etc. references from the context.
- When comparing videos, reference which video (A or B) the information comes from.
- If asked about engagement rate, calculate it as (likes + comments) / views * 100.
- Be specific, data-driven, and actionable in your suggestions.
- If the context doesn't contain enough info, say so honestly.
- Maintain conversation memory across turns.
"""


def get_all_chunks_by_url(url: str) -> List[Dict[str, Any]]:
    """Fetch all chunks for a given source_url from Pinecone."""
    index = _get_index()
    all_chunks = []
    seen_ids = set()

    queries = [
        {"text": "metadata title creator views likes engagement", "filter": {"source_url": {"$eq": url}, "chunk_type": {"$eq": "meta"}}},
        {"text": "video transcript speech segment conversation content", "filter": {"source_url": {"$eq": url}, "chunk_type": {"$eq": "transcript"}}},
    ]

    for q in queries:
        try:
            search_kwargs = {
                "namespace": NAMESPACE,
                "top_k": 100,
                "inputs": {"text": q["text"]},
                "filter": q.get("filter"),
            }
            result = index.search(**search_kwargs)
            hits = result.result.hits if hasattr(result, 'result') and hasattr(result.result, 'hits') else []
            for hit in hits:
                hit_id = getattr(hit, "id", None) or getattr(hit, "id_", None) or (hit.get("id_") or hit.get("id") or hit.get("_id") if isinstance(hit, dict) else None)
                if hit_id and hit_id not in seen_ids:
                    seen_ids.add(hit_id)
                    all_chunks.append({
                        "id": hit_id,
                        "text": (hit.get("fields", {}) if isinstance(hit, dict) else getattr(hit, "fields", {}) or {}).get("text", ""),
                        "score": getattr(hit, "score", None) or getattr(hit, "score_", None) or (hit.get("score_") or hit.get("score") if isinstance(hit, dict) else 0),
                        "video_id": (hit.get("fields", {}) if isinstance(hit, dict) else getattr(hit, "fields", {}) or {}).get("video_id", ""),
                        "source_url": (hit.get("fields", {}) if isinstance(hit, dict) else getattr(hit, "fields", {}) or {}).get("source_url", ""),
                        "chunk_type": (hit.get("fields", {}) if isinstance(hit, dict) else getattr(hit, "fields", {}) or {}).get("chunk_type", ""),
                        "chunk_index": (hit.get("fields", {}) if isinstance(hit, dict) else getattr(hit, "fields", {}) or {}).get("chunk_index", ""),
                    })
        except Exception:
            pass

    return all_chunks


def get_all_chunks(video_id: str) -> List[Dict[str, Any]]:
    """Fetch all chunks for a given video_id from Pinecone."""
    index = _get_index()
    all_chunks = []
    seen_ids = set()

    queries = [
        {"text": "metadata title creator views likes engagement", "filter": {"video_id": video_id, "chunk_type": {"$eq": "meta"}}},
        {"text": "video transcript speech segment conversation content", "filter": {"video_id": video_id, "chunk_type": {"$eq": "transcript"}}},
    ]

    for q in queries:
        try:
            search_kwargs = {
                "namespace": NAMESPACE,
                "top_k": 100,
                "inputs": {"text": q["text"]},
                "filter": q.get("filter"),
            }
            result = index.search(**search_kwargs)
            hits = result.result.hits if hasattr(result, 'result') and hasattr(result.result, 'hits') else []
            for hit in hits:
                hit_id = getattr(hit, "id", None) or getattr(hit, "id_", None) or (hit.get("id_") or hit.get("id") or hit.get("_id") if isinstance(hit, dict) else None)
                if hit_id and hit_id not in seen_ids:
                    seen_ids.add(hit_id)
                    all_chunks.append({
                        "id": hit_id,
                        "text": (hit.get("fields", {}) if isinstance(hit, dict) else getattr(hit, "fields", {}) or {}).get("text", ""),
                        "score": getattr(hit, "score", None) or getattr(hit, "score_", None) or (hit.get("score_") or hit.get("score") if isinstance(hit, dict) else 0),
                        "video_id": (hit.get("fields", {}) if isinstance(hit, dict) else getattr(hit, "fields", {}) or {}).get("video_id", ""),
                        "source_url": (hit.get("fields", {}) if isinstance(hit, dict) else getattr(hit, "fields", {}) or {}).get("source_url", ""),
                        "chunk_type": (hit.get("fields", {}) if isinstance(hit, dict) else getattr(hit, "fields", {}) or {}).get("chunk_type", ""),
                        "chunk_index": (hit.get("fields", {}) if isinstance(hit, dict) else getattr(hit, "fields", {}) or {}).get("chunk_index", ""),
                    })
        except Exception:
            pass

    return all_chunks


def retrieve_and_respect(state: MessagesState, config: RunnableConfig = None) -> Dict[str, Any]:
    settings = get_settings()
    last_message = state["messages"][-1].content

    # Extract configurable parameters from LangGraph config
    configurable = config.configurable if config and hasattr(config, "configurable") else {}
    if not isinstance(configurable, dict) and hasattr(config, "get"):
        configurable = config.get("configurable", {})
    source_urls = configurable.get("source_urls", []) if isinstance(configurable, dict) else []

    context_parts = []
    
    # Segregated RAG Retrieval: Query Video A and Video B individually to avoid any prompt confusion
    if source_urls and len(source_urls) >= 2:
        for idx, url in enumerate(source_urls):
            vid_label = "A" if idx == 0 else "B"
            
            # 1. Semantic search specifically for this URL
            chunks = search_pinecone(query=last_message, top_k=settings.top_k, source_urls=[url])
            
            # 2. Complete transcript segments specifically for this URL
            vid_chunks = get_all_chunks_by_url(url)
            seen_ids = {c["id"] for c in chunks}
            for c in vid_chunks:
                if c["id"] not in seen_ids:
                    seen_ids.add(c["id"])
                    chunks.append(c)
            
            # Overwrite in-memory video_id slot
            for c in chunks:
                c["video_id"] = vid_label
                
            formatted = format_context(chunks)
            context_parts.append(f"=== CONTEXT FOR VIDEO {vid_label} (URL: {url}) ===\n{formatted}")
    else:
        # Fallback to general search if single or no source_urls
        chunks = search_pinecone(query=last_message, top_k=settings.top_k, source_urls=source_urls if source_urls else None)
        for vid in ["A", "B"]:
            vid_chunks = get_all_chunks(vid)
            seen_ids = {c["id"] for c in chunks}
            for c in vid_chunks:
                if c["id"] not in seen_ids:
                    seen_ids.add(c["id"])
                    chunks.append(c)
                    
        # Dynamically assign video_id based on url matching if available
        for c in chunks:
            if source_urls and len(source_urls) > 0 and c.get("source_url") == source_urls[0]:
                c["video_id"] = "A"
            elif source_urls and len(source_urls) > 1 and c.get("source_url") == source_urls[1]:
                c["video_id"] = "B"
                
        formatted = format_context(chunks)
        context_parts.append(formatted)

    context = "\n\n".join(context_parts)
    system_msg = SystemMessage(content=f"{SYSTEM_PROMPT}\n\nContext:\n{context}")

    llm = ChatGoogleGenerativeAI(
        model=settings.llm_model,
        google_api_key=settings.gemini_api_key,
    )

    all_messages = [system_msg] + state["messages"]
    response = llm.invoke(all_messages)

    return {"messages": [response]}


def build_rag_graph() -> StateGraph:
    graph = StateGraph(MessagesState)
    graph.add_node("retrieve_and_respond", retrieve_and_respect)
    graph.add_edge(START, "retrieve_and_respond")
    graph.add_edge("retrieve_and_respond", END)
    return graph.compile()


rag_app = None


def get_rag_app():
    global rag_app
    if rag_app is None:
        rag_app = build_rag_graph()
    return rag_app


def _extract_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        texts = []
        for part in content:
            if isinstance(part, dict) and part.get("type") == "text":
                texts.append(part.get("text", ""))
            elif isinstance(part, str):
                texts.append(part)
        return "\n".join(texts)
    return str(content)


def chat(
    query: str, 
    history: List[Dict[str, str]] = None, 
    source_urls: List[str] = None
) -> str:
    app = get_rag_app()
    messages = []
    if history:
        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))
    messages.append(HumanMessage(content=query))

    config = {"configurable": {"source_urls": source_urls}} if source_urls else None
    result = app.invoke({"messages": messages}, config=config)
    return _extract_text(result["messages"][-1].content)


def chat_stream(
    query: str, 
    history: List[Dict[str, str]] = None, 
    source_urls: List[str] = None
):
    messages = []
    if history:
        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))
    messages.append(HumanMessage(content=query))

    settings = get_settings()
    context_parts = []
    urls = [url for url in source_urls] if source_urls else []

    # Segregated RAG Retrieval: Query Video A and Video B individually to avoid any prompt confusion
    if urls and len(urls) >= 2:
        for idx, url in enumerate(urls):
            vid_label = "A" if idx == 0 else "B"
            
            # 1. Semantic search specifically for this URL
            chunks = search_pinecone(query=query, top_k=settings.top_k, source_urls=[url])
            
            # 2. Complete transcript segments specifically for this URL
            vid_chunks = get_all_chunks_by_url(url)
            seen_ids = {c["id"] for c in chunks}
            for c in vid_chunks:
                if c["id"] not in seen_ids:
                    seen_ids.add(c["id"])
                    chunks.append(c)
            
            # Overwrite in-memory video_id slot
            for c in chunks:
                c["video_id"] = vid_label
                
            formatted = format_context(chunks)
            context_parts.append(f"=== CONTEXT FOR VIDEO {vid_label} (URL: {url}) ===\n{formatted}")
    else:
        # Fallback to general search if single or no source_urls
        chunks = search_pinecone(query=query, top_k=settings.top_k, source_urls=urls if urls else None)
        for vid in ["A", "B"]:
            vid_chunks = get_all_chunks(vid)
            seen_ids = {c["id"] for c in chunks}
            for c in vid_chunks:
                if c["id"] not in seen_ids:
                    seen_ids.add(c["id"])
                    chunks.append(c)
                    
        # Dynamically assign video_id based on url matching if available
        for c in chunks:
            if len(urls) > 0 and c.get("source_url") == urls[0]:
                c["video_id"] = "A"
            elif len(urls) > 1 and c.get("source_url") == urls[1]:
                c["video_id"] = "B"
                
        formatted = format_context(chunks)
        context_parts.append(formatted)

    context = "\n\n".join(context_parts)
    system_msg = SystemMessage(content=f"{SYSTEM_PROMPT}\n\nContext:\n{context}")

    llm = ChatGoogleGenerativeAI(
        model=settings.llm_model,
        google_api_key=settings.gemini_api_key,
    )

    all_messages = [system_msg] + messages
    for chunk in llm.stream(all_messages):
        yield _extract_text(chunk.content)