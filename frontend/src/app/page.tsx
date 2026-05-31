"use client";

import { useStore } from "@/lib/store";
import IngestForm from "@/components/IngestForm";
import VideoCard from "@/components/VideoCard";
import ChatPanel from "@/components/ChatPanel";
import { Trash2, Film } from "lucide-react";

export default function Home() {
  const { sessionId, videoA, videoB, isLoading } = useStore();

  const handleReset = async () => {
    if (sessionId) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        await fetch(`${apiUrl}/api/sessions/${sessionId}`, { method: "DELETE" });
      } catch {}
    }
    // Deep reset the Zustand store state
    useStore.setState({
      sessionId: null,
      videoA: null,
      videoB: null,
      messages: [],
    });
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans overflow-x-hidden relative">
      {/* Background Glowing Mesh */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 bg-zinc-900/20 backdrop-blur-md flex items-center justify-between flex-none">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-blue-500 animate-pulse" />
          <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            CompiSmart Studio
          </h1>
        </div>

        {sessionId && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 text-xs font-semibold tracking-wide transition-all duration-200"
          >
            <Trash2 size={13} />
            Reset Analysis
          </button>
        )}
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 p-6 flex items-center justify-center relative">
        {!sessionId ? (
          /* Landing page with Ingestion Form */
          <div className="w-full max-w-md mx-auto py-12 relative">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
                <div className="relative w-16 h-16">
                  <span className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                  <span className="absolute inset-0 border-4 border-t-blue-500 border-r-indigo-500 rounded-full animate-spin" />
                </div>
                <div className="space-y-1.5 mt-4">
                  <h3 className="text-base font-bold text-zinc-200">Ingesting Transcripts</h3>
                  <p className="text-xs text-zinc-500 max-w-[280px]">
                    Downloading video audio, transcribing using AssemblyAI, chunking, and index-indexing in Pinecone DB...
                  </p>
                </div>
              </div>
            ) : (
              <IngestForm />
            )}
          </div>
        ) : (
          /* Three-Column Comparative Console Grid */
          <div className="w-full h-[calc(100vh-120px)] grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column: Video A Player & Info */}
            <div className="lg:col-span-3 flex flex-col h-full min-h-[300px]">
              {videoA && <VideoCard video={videoA} />}
            </div>

            {/* Center Column: AI Co-Pilot Chat System */}
            <div className="lg:col-span-6 flex flex-col h-full min-h-[400px]">
              <ChatPanel />
            </div>

            {/* Right Column: Video B Player & Info */}
            <div className="lg:col-span-3 flex flex-col h-full min-h-[300px]">
              {videoB && <VideoCard video={videoB} />}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
