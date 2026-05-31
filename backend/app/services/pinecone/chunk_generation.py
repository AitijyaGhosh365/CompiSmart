import re
from typing import List, Dict, Any
from dataclasses import dataclass


@dataclass
class Chunk:
    id: str
    text: str
    metadata: Dict[str, Any]


def _metadata_text(meta: Dict[str, Any]) -> str:
    parts = [f"{k}: {v}" for k, v in meta.items() if v]
    return ". ".join(parts)


def chunk_text(
    text: str,
    max_chunk_size: int = 250,
    overlap: int = 50,
    video_id: str = "",
    source_url: str = "",
    creator: str = "",
    metadata: Dict[str, Any] = None,
) -> List[Chunk]:
    source_id = re.sub(r'[^a-zA-Z0-9]', '_', source_url).strip('_') or video_id
    chunks: List[Chunk] = []

    if metadata:
        meta_str = _metadata_text(metadata)
        if len(meta_str) <= max_chunk_size:
            chunks.append(Chunk(
                id=f"{source_id}#meta",
                text=meta_str,
                metadata={"video_id": video_id, "source_url": source_url, "chunk_type": "meta"},
            ))
        else:
            meta_parts = [meta_str[i:i + max_chunk_size] for i in range(0, len(meta_str), max_chunk_size)]
            for i, part in enumerate(meta_parts):
                chunks.append(Chunk(
                    id=f"{source_id}#meta{i}" if i else f"{source_id}#meta",
                    text=part,
                    metadata={"video_id": video_id, "source_url": source_url, "chunk_type": "meta"},
                ))

    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    sentences = [s for s in sentences if s.strip()]

    if not sentences:
        return chunks

    current = ""
    chunk_index = 0

    for sentence in sentences:
        if len(current) + len(sentence) + 1 > max_chunk_size and current:
            chunks.append(Chunk(
                id=f"{source_id}#chunk{chunk_index}",
                text=current.strip(),
                metadata={"video_id": video_id, "source_url": source_url, "chunk_type": "transcript", "chunk_index": chunk_index},
            ))
            chunk_index += 1
            words = current.split()
            overlap_words = words[-overlap:] if len(words) > overlap else words
            current = " ".join(overlap_words) + " " + sentence
        else:
            current = (current + " " + sentence).strip() if current else sentence

    if current.strip():
        chunks.append(Chunk(
            id=f"{source_id}#chunk{chunk_index}",
            text=current.strip(),
            metadata={"video_id": video_id, "source_url": source_url, "chunk_type": "transcript", "chunk_index": chunk_index},
        ))

    return chunks