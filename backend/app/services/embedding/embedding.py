from google import genai
from app.config import get_settings


def get_embedding(contents: str) -> list[float]:
    settings = get_settings()

    client = genai.Client(
        api_key=settings.gemini_api_key
    )

    result = client.models.embed_content(
        model=settings.embedding_model,
        contents=contents,
    )

    return result.embeddings[0].values