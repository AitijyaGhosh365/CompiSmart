from typing import AsyncGenerator, Dict, Any
from langchain_core.messages import HumanMessage

from app.graph.rag_graph import build_rag_graph, RAGState
from app.services.memory import get_memory, add_to_memory


async def stream_rag_response(session_id: str, message: str) -> AsyncGenerator[Dict[str, Any], None]:
    graph = build_rag_graph()

    history = get_memory(session_id)
    messages = history + [HumanMessage(content=message)]

    initial_state: RAGState = {
        "session_id": session_id,
        "messages": messages,
        "retrieved_chunks": [],
        "response": "",
        "sources": [],
    }

    full_response = ""
    sources = []

    async for event in graph.astream_events(initial_state, version="v2"):
        event_type = event.get("event")

        if event_type == "on_chat_model_stream":
            chunk_content = event["data"]["chunk"].content
            if chunk_content:
                full_response += chunk_content
                yield {"type": "chunk", "content": chunk_content}

        if event_type == "on_chain_end" and "format_sources" in event.get("name", ""):
            sources = event["data"].output.get("sources", [])
            yield {"type": "sources", "sources": sources}

    add_to_memory(session_id, message, full_response)
    yield {"type": "done"}
