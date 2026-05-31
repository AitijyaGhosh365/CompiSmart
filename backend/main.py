from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.videos import router as api_router
from app.api.instagram import router as instagram_router
from app.api.youtube import router as youtube_router
from app.models import HealthResponse

app = FastAPI(
    title="CompiSmart RAG Video Analytics",
    description="Full-stack RAG chatbot for comparing social media video engagement",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(instagram_router)
app.include_router(youtube_router)


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", vector_db="connected")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
