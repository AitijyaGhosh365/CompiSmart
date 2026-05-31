from typing import List, Dict, Any, TypedDict
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.config import get_settings
from app.services.embedding import query_chroma


class RAGState(TypedDict):
    session_id: str
    messages: List[BaseMessage]
    retrieved_chunks: List[Dict[str, Any]]
    response: str
    sources: List[Dict[str, Any]]


def get_llm():
    settings = get_settings()

    if settings.llm_provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=settings.llm_model,
            google_api_key=settings.gemini_api_key,
            streaming=True,
        )
    else:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=settings.llm_model,
            api_key=settings.aicredit_api_key,
            base_url=settings.aicredit_base_url,
            streaming=True,
        )


def retrieve(state: RAGState) -> RAGState:
    query = state["messages"][-1].content
    chunks = query_chroma(state["session_id"], query, top_k=get_settings().top_k)
    state["retrieved_chunks"] = chunks
    return state


def generate(state: RAGState) -> RAGState:
    context = "\n\n".join([chunk["text"] for chunk in state["retrieved_chunks"]])

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a video analytics assistant. Compare two social media videos (Video A and Video B) and help creators understand engagement differences.

Use the provided context from video transcripts to answer questions. Always cite which video (A or B) your information comes from.

Context from transcripts:
{context}

Be specific, data-driven, and actionable. If asked about engagement rates, hooks, or comparisons, reference specific transcript sections."""),
        MessagesPlaceholder(variable_name="messages"),
        ("human", "{question}"),
    ])

    llm = get_llm()
    chain = prompt | llm

    history = state["messages"][:-1]
    question = state["messages"][-1].content

    response = chain.invoke({
        "context": context,
        "messages": history,
        "question": question,
    })

    state["response"] = response.content
    return state


def format_sources(state: RAGState) -> RAGState:
    sources = []
    for chunk in state["retrieved_chunks"]:
        sources.append({
            "video": chunk["metadata"].get("video_id", "unknown"),
            "chunk_id": chunk.get("id", ""),
            "text": chunk["text"][:200] + "..." if len(chunk["text"]) > 200 else chunk["text"],
        })
    state["sources"] = sources
    return state


def build_rag_graph():
    workflow = StateGraph(RAGState)

    workflow.add_node("retrieve", retrieve)
    workflow.add_node("generate", generate)
    workflow.add_node("format_sources", format_sources)

    workflow.set_entry_point("retrieve")
    workflow.add_edge("retrieve", "generate")
    workflow.add_edge("generate", "format_sources")
    workflow.add_edge("format_sources", END)

    return workflow.compile()
