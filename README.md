# CompiSmart — AI Video Analytics & RAG Comparison

Full-stack RAG chatbot that compares two social media videos (YouTube + Instagram Reels) using Gemini AI, Pinecone vector search, and real-time transcript analysis.

## What It Does

- **Ingests** any YouTube or Instagram Reel URL — extracts transcripts and metadata (views, likes, comments, hashtags, upload date, duration)
- **Computes** engagement rates and indexes transcript chunks in Pinecone with `llama-text-embed-v2`
- **RAG Chat** — ask comparative questions ("Why did Video A get more engagement?", "Compare the hooks in the first 5 seconds")
- **Streams** responses via SSE with source citations and conversation memory

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, Tailwind CSS v4, Zustand, React Markdown |
| Backend | FastAPI (Python 3.12), LangChain, LangGraph |
| LLM | Google Gemini 2.5 Flash |
| Embeddings | Pinecone integrated `llama-text-embed-v2` |
| Vector DB | Pinecone |
| Transcript (IG) | AssemblyAI |
| Transcript (YT) | Bright Data |
| Metadata (YT) | YouTube Data API v3 |
| Metadata (IG) | Bright Data |
| Hosting | Vercel (frontend), GCP Cloud Run (backend) |

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate       # or: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env         # fill in your API keys
python main.py
```

### Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

## Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com) | LLM for RAG responses |
| `BRIGHTDATA_API_KEY` | [Bright Data](https://brightdata.com) | Instagram metadata + YouTube transcript |
| `ASSEMBLYAI_API_KEY` | [AssemblyAI](https://assemblyai.com) | Instagram reel transcription |
| `PINECONE_API_KEY` | [Pinecone](https://pinecone.io) | Vector database |
| `PINECONE_INDEX_NAME` | Pinecone | Index name (e.g. `compistart`) |
| `YOUTUBE_API_KEY` | [Google Cloud Console](https://console.cloud.google.com) | YouTube Data API v3 |
| `NEXT_PUBLIC_API_URL` | [Backend link in .env.local] | Used for frontend to backend connection |

There are other variable in .env.example which were used in earlier implementation but are not used anymore one can leave it empty

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/videos/ingest` | Ingest two video URLs (YouTube or Instagram) |
| `POST` | `/api/chat/stream` | Streaming RAG chat with source citations |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/version` | Version COntrol |
| `POST` | `/api/youtube/info` | YouTube video metadata + transcript |
| `POST` | `/api/instagram/reel` | Instagram reel metadata |

## Deployment

```bash
# Build & push to GCP Artifact Registry
docker build -t asia-south1-docker.pkg.dev/PROJECT/compismart-backend/api:latest .
docker push asia-south1-docker.pkg.dev/PROJECT/compismart-backend/api:latest

# Deploy to Cloud Run
gcloud run deploy compismart-api --image asia-south1-docker.pkg.dev/PROJECT/compismart-backend/api:latest \
  --region asia-south1 --allow-unauthenticated --set-env-vars "KEY1=...,KEY2=..."
```

Frontend: deploy on [Vercel](https://vercel.com) with `NEXT_PUBLIC_API_URL` set to the Cloud Run URL.

## How It Works

```
URL → YouTube API / Bright Data → metadata + transcript
  → chunk_text (250 chars, 50 overlap) → Pinecone upsert
  → User query → Pinecone search → Gemini RAG → streamed response
```

## Limitations

<!-- Add project limitations here -->
