import uuid
import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List, Dict, Any

from app.config import get_settings


def get_chroma_client():
    settings = get_settings()
    return chromadb.PersistentClient(
        path=settings.chroma_db_path,
        settings=ChromaSettings(anonymized_telemetry=False),
    )


def get_embeddings():
    settings = get_settings()

    if settings.llm_provider == "gemini":
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        return GoogleGenerativeAIEmbeddings(
            model=settings.embedding_model,
            google_api_key=settings.gemini_api_key,
        )
    else:
        from langchain_openai import OpenAIEmbeddings
        return OpenAIEmbeddings(
            model=settings.embedding_model,
            openai_api_key=settings.aicredit_api_key,
            openai_api_base=settings.aicredit_base_url,
        )


def chunk_transcript(transcript: str, video_id: str, session_id: str) -> List[Dict[str, Any]]:
    settings = get_settings()
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.max_chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )
    chunks = splitter.split_text(transcript)

    return [
        {
            "text": chunk,
            "metadata": {
                "video_id": video_id,
                "session_id": session_id,
                "chunk_index": i,
            },
        }
        for i, chunk in enumerate(chunks)
    ]


def store_chunks_in_chroma(session_id: str, chunks: List[Dict[str, Any]]):
    client = get_chroma_client()
    collection_name = f"session_{session_id}"

    collection = client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )

    texts = [chunk["text"] for chunk in chunks]
    metadatas = [chunk["metadata"] for chunk in chunks]
    ids = [f"{session_id}_{i}" for i in range(len(chunks))]

    embeddings = get_embeddings()
    embedded_texts = embeddings.embed_documents(texts)

    collection.add(
        documents=texts,
        metadatas=metadatas,
        ids=ids,
        embeddings=embedded_texts,
    )

    return collection_name


def query_chroma(session_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    client = get_chroma_client()
    collection_name = f"session_{session_id}"

    try:
        collection = client.get_collection(name=collection_name)
    except Exception:
        return []

    embeddings = get_embeddings()
    query_embedding = embeddings.embed_query(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
    )

    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    ids = results.get("ids", [[]])[0]
    distances = results.get("distances", [[]])[0]

    return [
        {
            "text": doc,
            "metadata": meta,
            "id": chunk_id,
            "distance": dist,
        }
        for doc, meta, chunk_id, dist in zip(documents, metadatas, ids, distances)
    ]
