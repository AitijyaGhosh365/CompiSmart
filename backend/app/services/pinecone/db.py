from pinecone import Pinecone
from app.config import get_settings

settings = get_settings()

pc = Pinecone(api_key="********-****-****-****-************")
index = pc.Index("quickstart")