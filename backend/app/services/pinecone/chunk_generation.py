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


def _format_time(seconds: float) -> str:
    minutes = int(seconds) // 60
    secs = int(seconds) % 60
    return f"{minutes}:{secs:02d}"


def chunk_text(
    text: str = "",
    timestamped: List[Dict[str, Any]] = None,
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
        chunks.append(Chunk(
            id=f"{source_id}#meta",
            text=meta_str,
            metadata={"video_id": video_id, "source_url": source_url, "chunk_type": "meta"},
        ))

    if timestamped:
        current_parts = []
        current_start = timestamped[0]["start"] if timestamped else 0
        chunk_index = 0

        for i, snippet in enumerate(timestamped):
            time_label = f"[{_format_time(snippet['start'])}]"
            part = f"{time_label} {snippet['text']}"

            if sum(len(p) for p in current_parts) + len(part) + len(current_parts) > max_chunk_size and current_parts:
                chunk_text_str = " ".join(current_parts)
                end_time = timestamped[i - 1]["start"] + timestamped[i - 1].get("duration", 0)
                chunks.append(Chunk(
                    id=f"{source_id}#chunk{chunk_index}",
                    text=chunk_text_str,
                    metadata={
                        "video_id": video_id,
                        "source_url": source_url,
                        "chunk_type": "transcript",
                        "chunk_index": chunk_index,
                        "start_time": current_start,
                        "end_time": end_time,
                    },
                ))
                chunk_index += 1
                overlap_snippets = timestamped[max(0, i - overlap):i]
                current_parts = [f"[{_format_time(s['start'])}] {s['text']}" for s in overlap_snippets]
                if overlap_snippets:
                    current_start = overlap_snippets[0]["start"]
            else:
                current_parts.append(part)

        if current_parts:
            end_time = timestamped[-1]["start"] + timestamped[-1].get("duration", 0)
            chunks.append(Chunk(
                id=f"{source_id}#chunk{chunk_index}",
                text=" ".join(current_parts),
                metadata={
                    "video_id": video_id,
                    "source_url": source_url,
                    "chunk_type": "transcript",
                    "chunk_index": chunk_index,
                    "start_time": current_start,
                    "end_time": end_time,
                },
            ))

        return chunks

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