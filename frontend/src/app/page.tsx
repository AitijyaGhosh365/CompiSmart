"use client";

import { useStore } from "@/lib/store";
import IngestForm from "@/components/IngestForm";
import VideoCard from "@/components/VideoCard";
import ChatPanel from "@/components/ChatPanel";
import { Trash2, Film, Sparkles } from "lucide-react";

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
      <div className="flex-1 p-6 relative overflow-hidden h-[calc(100vh-4rem)] w-full">
        {isLoading ? (
          /* Three-Column Console Pulsating Loading Skeleton */
          <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch overflow-hidden animate-pulse relative">
            {/* Left Column Skeleton: Video Player A */}
            <div className="lg:col-span-3 h-full border border-zinc-200/80 bg-white rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-sm space-y-4">
              <div className="space-y-3 flex-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-200" />
                    <div className="space-y-1">
                      <div className="h-2.5 w-16 bg-zinc-200 rounded" />
                      <div className="h-2 w-10 bg-zinc-100 rounded" />
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200/50" />
                </div>
                <div className="aspect-video w-full bg-zinc-200 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-3.5 w-[80%] bg-zinc-200 rounded" />
                  <div className="h-2 w-[40%] bg-zinc-100 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 bg-zinc-50 border border-zinc-200/50 rounded-xl p-3">
                <div className="h-8 bg-zinc-200 rounded" />
                <div className="h-8 bg-zinc-200 rounded" />
                <div className="h-8 bg-zinc-200 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-4 w-12 bg-zinc-200 rounded" />
                <div className="h-4 w-16 bg-zinc-200 rounded" />
              </div>
            </div>

            {/* Center Column Skeleton: Chat / Co-Pilot */}
            <div className="lg:col-span-6 h-full border border-zinc-200/80 bg-white rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm relative">
              {/* Header Skeleton */}
              <div className="p-3 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between flex-none">
                <div className="h-7 w-36 bg-zinc-200 rounded-xl" />
                <div className="h-3.5 w-20 bg-zinc-200 rounded" />
              </div>
              {/* Chat Feed Skeleton */}
              <div className="flex-1 p-5 space-y-4 overflow-hidden relative">
                <div className="flex justify-end">
                  <div className="h-10 w-[40%] bg-zinc-100 rounded-2xl rounded-tr-none" />
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-200 flex-none" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-[70%] bg-zinc-200 rounded" />
                    <div className="h-3 w-[85%] bg-zinc-200 rounded" />
                    <div className="h-3 w-[50%] bg-zinc-200 rounded" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="h-8 w-[30%] bg-zinc-100 rounded-2xl rounded-tr-none" />
                </div>
                <div className="flex gap-2 pt-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-200 flex-none" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-[60%] bg-zinc-200 rounded" />
                    <div className="h-3 w-[40%] bg-zinc-200 rounded" />
                  </div>
                </div>
              </div>
              {/* Input Skeleton */}
              <div className="p-4 border-t border-zinc-200 bg-white flex items-center gap-3 flex-none">
                <div className="h-10 flex-1 bg-zinc-100 rounded-xl" />
                <div className="h-10 w-16 bg-zinc-200 rounded-xl" />
              </div>

              {/* Glassmorphic Active Ingestion Progress Card */}
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-20">
                <div className="flex flex-col items-center justify-center space-y-4 py-8 px-6 text-center bg-white border border-zinc-200/80 rounded-3xl shadow-xl max-w-sm mx-4">
                  <div className="relative w-12 h-12">
                    <span className="absolute inset-0 border-4 border-blue-600/10 rounded-full" />
                    <span className="absolute inset-0 border-4 border-t-blue-600 border-r-indigo-600 rounded-full animate-spin" />
                  </div>
                  <div className="space-y-1.5 mt-2">
                    <h3 className="text-xs font-black text-zinc-800 uppercase tracking-wider">Ingesting Transcripts</h3>
                    <p className="text-[10px] text-zinc-500 max-w-[240px] leading-relaxed">
                      Downloading video audio, transcribing using AssemblyAI, chunking transcripts, and indexing Pinecone database...
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column Skeleton: Video Player B */}
            <div className="lg:col-span-3 h-full border border-zinc-200/80 bg-white rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-sm space-y-4">
              <div className="space-y-3 flex-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-200" />
                    <div className="space-y-1">
                      <div className="h-2.5 w-18 bg-zinc-200 rounded" />
                      <div className="h-2 w-12 bg-zinc-100 rounded" />
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200/50" />
                </div>
                <div className="aspect-video w-full bg-zinc-200 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-3.5 w-[75%] bg-zinc-200 rounded" />
                  <div className="h-2 w-[50%] bg-zinc-100 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 bg-zinc-50 border border-zinc-200/50 rounded-xl p-3">
                <div className="h-8 bg-zinc-200 rounded" />
                <div className="h-8 bg-zinc-200 rounded" />
                <div className="h-8 bg-zinc-200 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-4 w-10 bg-zinc-200 rounded" />
                <div className="h-4 w-14 bg-zinc-200 rounded" />
              </div>
            </div>
          </div>
        ) : !sessionId ? (
          /* Landing page with Ingestion Form centered */
          <div className="w-full h-full flex flex-col items-center justify-center relative z-10 max-y-full overflow-y-auto px-4 py-8">
            <div className="text-center space-y-4 max-w-md mx-auto mb-8 animate-fade-in">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100/80 text-blue-600 text-[10px] font-black uppercase tracking-widest shadow-[0_2px_10px_rgba(59,130,246,0.05)]">
                <Sparkles size={11} className="text-blue-500 animate-pulse" />
                AI Video Studio
              </div>
              <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-zinc-800 leading-tight">
                Unlock Deeper <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">Video Insights</span>
              </h2>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed font-medium">
                Ingest any two YouTube videos or Instagram Reels. Instantly extract transcripts, perform semantic database searches, visualize comparative metrics, and chat with your RAG co-pilot.
              </p>
            </div>
            <div className="w-full max-w-md mx-auto shadow-2xl rounded-3xl">
              <IngestForm />
            </div>
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
