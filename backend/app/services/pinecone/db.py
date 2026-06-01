import re
import time
from typing import Dict, Any, List
from pinecone import Pinecone
from app.config import get_settings
from app.services.pinecone.chunk_generation import chunk_text
from app.services.youtube.scraper import is_youtube_url, scrape_video_timestamped
from app.services.instagram.scraper import scrape_video as ig_scrape_video, REEL_RE, POST_RE
import inspect

NAMESPACE = "video_data"


def _get_index():
    settings = get_settings()
    pc = Pinecone(api_key=settings.pinecone_api_key)
    index = pc.Index(settings.pinecone_index_name)

    # print(inspect.signature(index.search))

    return index

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


def add_video(url: str) -> Dict[str, Any]:
    settings = get_settings()

    if is_youtube_url(url):
        metadata, timestamped = scrape_video_timestamped(url)
        chunks = chunk_text(
            timestamped=timestamped,
            max_chunk_size=settings.max_chunk_size,
            overlap=settings.chunk_overlap,
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
        "metadata": metadata,
        "chunks_upserted": len(chunks),
    }


def get_video(
    url: str,
    force_refresh: bool = False
) -> Dict[str, Any]:

    index = _get_index()

    if not force_refresh:
        try:
            result = index.search(
                namespace=NAMESPACE,
                top_k=1,
                inputs={"text": "video"},
                filter={
                    "source_url": {"$eq": url}
                }
            )

            # print("SEARCH RESULT:", result)

            hits = result.get("result", {}).get("hits", [])

            if hits:
                metadata = hits[0].get("fields", {})

                return {
                    "source_url": url,
                    "status": "exists",
                    "stored_metadata": metadata,
                }

        except Exception as e:
            print(f"Search failed: {e}")


    result = add_video(url)
    result["status"] = "added"

    return result