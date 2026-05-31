from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path


class Settings(BaseSettings):
    llm_provider: str = "gemini"
    gemini_api_key: str = ""
    aicredit_api_key: str = ""
    brightdata_api_key: str = ""
    assemblyai_api_key : str = ""
    llm_model: str = "gemini-3-flash-preview"
    embedding_model: str = "gemini-embedding-2"
    chroma_db_path: str = "./chroma_db"
    max_chunk_size: int = 500
    chunk_overlap: int = 50
    top_k: int = 5

    class Config:
        env_file = str(Path(__file__).resolve().parent.parent / ".env")

    @property
    def active_api_key(self) -> str:
        if self.llm_provider == "gemini":
            return self.gemini_api_key
        return self.aicredit_api_key

    @property
    def aicredit_base_url(self) -> str:
        return "https://api.aicredit.in/v1"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
