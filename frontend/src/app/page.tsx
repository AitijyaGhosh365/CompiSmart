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
    useStore.setState({
      sessionId: null,
      videoA: null,
      videoB: null,
      messages: [],
    });
  };

  return (
    <main className="h-screen w-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans overflow-hidden relative">
      {/* Background Soft Ambient Meshes for Light Theme */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-200/30 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Header */}
      <header className="h-16 border-b border-zinc-200/80 px-6 py-4 bg-white/70 backdrop-blur-md flex items-center justify-between flex-none shadow-sm z-10">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-blue-600 animate-pulse" />
          <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-zinc-800 to-zinc-500 bg-clip-text text-transparent">
            CompiSmart Studio
          </h1>
        </div>

        {sessionId && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-zinc-200 shadow-sm hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-xs font-semibold tracking-wide transition-all duration-200"
          >
            <Trash2 size={13} />
            Reset Analysis
          </button>
        )}
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 p-6 relative overflow-hidden h-[calc(100vh-4rem)] flex items-center justify-center">
        {!sessionId ? (
          /* Landing page with Ingestion Form */
          <div className="w-full max-w-md mx-auto py-12 relative z-10">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center bg-white border border-zinc-200 rounded-3xl p-8 shadow-xl">
                <div className="relative w-16 h-16">
                  <span className="absolute inset-0 border-4 border-blue-600/10 rounded-full" />
                  <span className="absolute inset-0 border-4 border-t-blue-600 border-r-indigo-600 rounded-full animate-spin" />
                </div>
                <div className="space-y-1.5 mt-4">
                  <h3 className="text-base font-bold text-zinc-800">Ingesting Transcripts</h3>
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
          /* Full Height Three-Column Comparative Console Grid */
          <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch overflow-hidden">
            {/* Left Column: Video A Player & Info */}
            <div className="lg:col-span-3 h-full overflow-hidden flex flex-col">
              {videoA && <VideoCard video={videoA} />}
            </div>

            {/* Center Column: AI Co-Pilot Chat System */}
            <div className="lg:col-span-6 h-full overflow-hidden flex flex-col">
              <ChatPanel />
            </div>

            {/* Right Column: Video B Player & Info */}
            <div className="lg:col-span-3 h-full overflow-hidden flex flex-col">
              {videoB && <VideoCard video={videoB} />}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
