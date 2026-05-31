import re
import time
from typing import Dict, Any, List
from pinecone import Pinecone
from app.config import get_settings
from app.services.pinecone.chunk_generation import chunk_text
from app.services.youtube.scraper import is_youtube_url, scrape_video_timestamped
from app.services.instagram.scraper import scrape_video as ig_scrape_video, REEL_RE, POST_RE

NAMESPACE = "video_data"


def _get_index():
    settings = get_settings()
    pc = Pinecone(api_key=settings.pinecone_api_key)
    return pc.Index(settings.pinecone_index_name)


def _url_to_source_id(url: str) -> str:
    return re.sub(r'[^a-zA-Z0-9]', '_', url).strip('_')


def _sanitize_metadata(meta: Dict[str, Any]) -> Dict[str, Any]:
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


def clear_namespace() -> int:
    """Delete all records in the namespace. Returns count deleted."""
    index = _get_index()
    all_ids = set()
    page = 0
    while True:
        try:
            result = index.search(
                namespace=NAMESPACE,
                top_k=100,
                inputs={"text": f"_page_{page}"},
            )
            hits = result.result.hits if hasattr(result, 'result') and hasattr(result.result, 'hits') else []
            if not hits:
                break
            for hit in hits:
                hit_id = getattr(hit, "id", None) or getattr(hit, "id_", None) or (hit.get("id_") or hit.get("id") or hit.get("_id") if isinstance(hit, dict) else None)
                if hit_id:
                    all_ids.add(hit_id)
            page += 1
            if len(hits) < 100:
                break
        except Exception:
            break

    if all_ids:
        ids = list(all_ids)
        for i in range(0, len(ids), 100):
            index.delete(ids=ids[i:i + 100], namespace=NAMESPACE)
    return len(all_ids)


def delete_video(video_id: str) -> int:
    """Delete all chunks for a given video_id from Pinecone."""
    index = _get_index()
    deleted_count = 0
    
    while True:
        all_ids = set()
        try:
            result = index.search(
                namespace=NAMESPACE,
                top_k=100,
                inputs={"text": video_id},
                filter={"video_id": video_id},
            )
            hits = result.result.hits if hasattr(result, 'result') and hasattr(result.result, 'hits') else []
            for hit in hits:
                hit_id = getattr(hit, "id", None) or getattr(hit, "id_", None) or (hit.get("id_") or hit.get("id") or hit.get("_id") if isinstance(hit, dict) else None)
                if hit_id:
                    all_ids.add(hit_id)
        except Exception:
            pass

        try:
            result2 = index.search(
                namespace=NAMESPACE,
                top_k=100,
                inputs={"text": "meta"},
                filter={"video_id": video_id, "chunk_type": "meta"},
            )
            hits2 = result2.result.hits if hasattr(result2, 'result') and hasattr(result2.result, 'hits') else []
            for hit in hits2:
                hit_id = getattr(hit, "id", None) or getattr(hit, "id_", None) or (hit.get("id_") or hit.get("id") or hit.get("_id") if isinstance(hit, dict) else None)
                if hit_id:
                    all_ids.add(hit_id)
        except Exception:
            pass

        if not all_ids:
            break
            
        ids = list(all_ids)
        for i in range(0, len(ids), 100):
            index.delete(ids=ids[i:i + 100], namespace=NAMESPACE)
        deleted_count += len(all_ids)
        time.sleep(1)
        
    return deleted_count


def _upsert_records_with_retry(index, namespace: str, records: list):
    max_retries = 5
    backoff = 15.0
    for attempt in range(max_retries):
        try:
            index.upsert_records(namespace=namespace, records=records)
            return
        except Exception as e:
            if "RESOURCE_EXHAUSTED" in str(e) or "429" in str(e):
                print(f"  Pinecone rate limit hit (RESOURCE_EXHAUSTED). Retrying in {backoff} seconds... (Attempt {attempt + 1}/{max_retries})")
                time.sleep(backoff)
                backoff *= 2.0
            else:
                raise e
    index.upsert_records(namespace=namespace, records=records)


def add_video(url: str, video_id: str) -> Dict[str, Any]:
    settings = get_settings()

    if is_youtube_url(url):
        metadata, timestamped = scrape_video_timestamped(url)
        chunks = chunk_text(
            timestamped=timestamped,
            max_chunk_size=settings.max_chunk_size,
            overlap=settings.chunk_overlap,
            video_id=video_id,
            source_url=url,
            creator=metadata.get("creator", ""),
            metadata=metadata,
        )
    elif REEL_RE.match(url) or POST_RE.match(url):
        metadata, transcript = ig_scrape_video(url)
        chunks = chunk_text(
            text=transcript,
            max_chunk_size=settings.max_chunk_size,
            overlap=settings.chunk_overlap,
            video_id=video_id,
            source_url=url,
            creator=metadata.get("creator", ""),
            metadata=metadata,
        )
    else:
        raise ValueError(f"Unsupported URL: {url}")

    index = _get_index()
    records = []
    for chunk in chunks:
        record = {"id": chunk.id, "text": chunk.text}
        record.update(_sanitize_metadata(chunk.metadata))
        records.append(record)
    
    _upsert_records_with_retry(index, namespace=NAMESPACE, records=records[:96])
    time.sleep(5)
    for i in range(96, len(records), 96):
        _upsert_records_with_retry(index, namespace=NAMESPACE, records=records[i:i + 96])
        time.sleep(5)

    return {
        "source_url": url,
        "video_id": video_id,
        "metadata": metadata,
        "chunks_upserted": len(chunks),
    }


def get_video(url: str, video_id: str = "", force_refresh: bool = False) -> Dict[str, Any]:
    """Check if video exists in Pinecone. If not (or force_refresh), add it. Return video data."""
    source_id = _url_to_source_id(url)
    meta_id = f"{source_id}#meta"
    index = _get_index()

    if not force_refresh:
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

    if force_refresh:
        delete_video(video_id)

    result = add_video(url, video_id)
    result["status"] = "added"
    return result