from typing import List, Dict, Any
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage

_conversation_memory: Dict[str, List[BaseMessage]] = {}


def get_memory(session_id: str) -> List[BaseMessage]:
    return _conversation_memory.get(session_id, [])


def add_to_memory(session_id: str, user_message: str, ai_response: str):
    if session_id not in _conversation_memory:
        _conversation_memory[session_id] = []

    _conversation_memory[session_id].append(HumanMessage(content=user_message))
    _conversation_memory[session_id].append(AIMessage(content=ai_response))


def clear_memory(session_id: str):
    if session_id in _conversation_memory:
        del _conversation_memory[session_id]
