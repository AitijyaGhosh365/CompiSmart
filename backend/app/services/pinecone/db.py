import re
from typing import Dict, Any
from pinecone import Pinecone
from app.config import get_settings
from app.services.pinecone.chunk_generation import chunk_text
from app.services.youtube.scraper import is_youtube_url, scrape_video as yt_scrape_video
from app.services.instagram.scraper import scrape_video as ig_scrape_video, REEL_RE, POST_RE

NAMESPACE = "video_data"


def _get_index():
    settings = get_settings()
    pc = Pinecone(api_key=settings.pinecone_api_key)
    return pc.Index(settings.pinecone_index_name)


def _url_to_source_id(url: str) -> str:
    return re.sub(r'[^a-zA-Z0-9]', '_', url).strip('_')


def _sanitize_metadata(meta: Dict[str, Any]) -> Dict[str, Any]:
    """Pinecone only accepts str, int, float, bool, or list[str] as metadata values."""
    clean = {}
    for k, v in meta.items():
        if v is None:
            continue
        if isinstance(v, bool):
            clean[k] = v
        elif isinstance(v, (int, float)):
            clean[k] = v
        elif isinstance(v, str):
            clean[k] = v
        elif isinstance(v, list):
            clean[k] = [str(item) for item in v if item is not None]
        else:
            clean[k] = str(v)
    return clean


def add_video(url: str, video_id: str) -> Dict[str, Any]:
    """Scrape video metadata + transcript, chunk, and upsert to Pinecone."""
    settings = get_settings()

    if is_youtube_url(url):
        metadata, transcript = yt_scrape_video(url)
    elif REEL_RE.match(url) or POST_RE.match(url):
        metadata, transcript = ig_scrape_video(url)
    else:
        raise ValueError(f"Unsupported URL: {url}")

    chunks = chunk_text(
        text=transcript,
        max_chunk_size=settings.max_chunk_size,
        overlap=settings.chunk_overlap,
        video_id=video_id,
        source_url=url,
        creator=metadata.get("creator", ""),
        metadata=metadata,
    )

    index = _get_index()
    records = []
    for chunk in chunks:
        record = {"id": chunk.id, "text": chunk.text}
        record.update(_sanitize_metadata(chunk.metadata))
        records.append(record)
    index.upsert_records(namespace=NAMESPACE, records=records)

    return {
        "source_url": url,
        "video_id": video_id,
        "metadata": metadata,
        "transcript": transcript,
        "chunks_upserted": len(chunks),
    }


def get_video(url: str, video_id: str = "") -> Dict[str, Any]:
    """Check if video exists in Pinecone. If not, add it. Return video data."""
    source_id = _url_to_source_id(url)
    meta_id = f"{source_id}#meta"
    index = _get_index()

    try:
        result = index.fetch(ids=[meta_id], namespace=NAMESPACE)
        if result.get("vectors"):
            vector = result["vectors"][meta_id]
            stored_metadata = vector.get("metadata", {})
            return {
                "source_url": url,
                "video_id": stored_metadata.get("video_id", ""),
                "status": "exists",
                "meta_id": meta_id,
                "stored_metadata": stored_metadata,
            }
    except Exception:
        pass

    if not video_id:
        raise ValueError("video_id is required when adding a new video")

    result = add_video(url, video_id)
    result["status"] = "added"
    return result