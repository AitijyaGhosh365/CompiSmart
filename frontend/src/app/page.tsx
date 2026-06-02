"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import IngestForm from "@/components/IngestForm";
import VideoCard from "@/components/VideoCard";
import ChatPanel from "@/components/ChatPanel";
import { Trash2, Film, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

export default function Home() {
  const { sessionId, videoA, videoB, isLoading } = useStore();

  const handleReset = async () => {
    if (sessionId) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        await fetch(`${apiUrl}/api/sessions/${sessionId}`, { method: "DELETE" });
      } catch {}
    }
    useStore.setState({ sessionId: null, videoA: null, videoB: null, messages: [] });
  };

  return (
    <div className="h-dvh flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden">
      {/* Ambient Background Orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-blue-200/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-indigo-200/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-100/10 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between flex-none z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-800">CompiSmart</h1>
            <span className="hidden sm:inline text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">STUDIO</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {sessionId && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-xs font-semibold transition-all duration-200 shadow-sm"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {isLoading ? (
          <SkeletonLoader />
        ) : !sessionId ? (
          <LandingPage />
        ) : (
          <Console />
        )}
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="h-full overflow-y-auto scrollbar-hide px-4 py-6 sm:py-8">
      <div className="flex flex-col items-center justify-center min-h-full gap-6">
        <div className="text-center space-y-4 sm:space-y-5 max-w-lg mx-auto animate-fade-in-up shrink-0">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100/60">
            <Sparkles size={12} className="text-blue-500" />
            <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-blue-600">AI-Powered Video Analytics</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight text-slate-800 leading-tight">
            Analyze & Compare
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">Video Performance</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Paste two video URLs — YouTube or Instagram Reels. Extract transcripts, compute engagement metrics, semantic search, and chat with a RAG co-pilot.
          </p>

          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px]">
            {["Transcript Extraction", "Semantic Search", "Engagement Analytics", "RAG Chat"].map((f) => (
              <span key={f} className="px-2.5 sm:px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-500 font-medium shadow-sm">
                {f}
              </span>
            ))}
          </div>
        </div>

        <div className="w-full max-w-lg mx-auto mt-6 sm:mt-8 animate-slide-up shrink-0">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl shadow-blue-500/5">
            <IngestForm />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="h-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 animate-fade-in">
      {/* Video A Skeleton — hidden on mobile */}
      <div className="hidden lg:block lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 animate-shimmer" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-slate-200 rounded-full animate-shimmer" />
              <div className="h-2 w-14 bg-slate-100 rounded-full animate-shimmer" />
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-100 animate-shimmer" />
        </div>
        <div className="aspect-video bg-slate-200 rounded-xl animate-shimmer" />
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-slate-200 rounded-full animate-shimmer" />
          <div className="h-3 w-1/2 bg-slate-100 rounded-full animate-shimmer" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-slate-200 rounded-xl animate-shimmer" />
          ))}
        </div>
      </div>

      {/* Chat Skeleton */}
      <div className="col-span-1 lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative h-full">
        <div className="p-3 border-b border-slate-200/60 flex items-center gap-3 shrink-0">
          <div className="h-8 w-24 sm:w-28 bg-slate-200 rounded-lg animate-shimmer" />
          <div className="h-8 w-24 sm:w-28 bg-slate-200 rounded-lg animate-shimmer" />
        </div>
        <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
              <div className={`h-12 rounded-2xl animate-shimmer ${i % 2 === 0 ? "w-1/3 bg-slate-100 rounded-br-sm" : "w-2/3 bg-slate-200 rounded-bl-sm"}`} />
            </div>
          ))}
        </div>
        <div className="p-3 sm:p-4 border-t border-slate-200/60 flex gap-3 shrink-0">
          <div className="h-11 flex-1 bg-slate-100 rounded-xl animate-shimmer" />
          <div className="h-11 w-12 bg-slate-200 rounded-xl animate-shimmer" />
        </div>

        {/* Ingestion overlay */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-white rounded-2xl shadow-2xl shadow-blue-500/5 border border-slate-200 p-6 sm:p-8 max-w-xs sm:max-w-sm mx-4 text-center space-y-4 animate-scale-in">
            <div className="relative mx-auto w-12 sm:w-14 h-12 sm:h-14">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-indigo-500 animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">Processing Videos</h3>
              <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed">
                Extracting transcripts, chunking content, and indexing in Pinecone...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Video B Skeleton — hidden on mobile */}
      <div className="hidden lg:block lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 animate-shimmer" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-slate-200 rounded-full animate-shimmer" />
              <div className="h-2 w-14 bg-slate-100 rounded-full animate-shimmer" />
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-100 animate-shimmer" />
        </div>
        <div className="aspect-video bg-slate-200 rounded-xl animate-shimmer" />
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-slate-200 rounded-full animate-shimmer" />
          <div className="h-3 w-1/2 bg-slate-100 rounded-full animate-shimmer" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-slate-200 rounded-xl animate-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}

function Console() {
  const { videoA, videoB } = useStore();
  const [tab, setTab] = useState<"a" | "chat" | "b">("chat");

  return (
    <div className="h-full flex flex-col">
      {/* Mobile tab bar */}
      <div className="lg:hidden flex items-center border-b border-slate-200 bg-white shrink-0">
        <TabBtn active={tab === "a"} onClick={() => setTab("a")} label="Video A" color="blue" />
        <TabBtn active={tab === "chat"} onClick={() => setTab("chat")} label="Chat" color="indigo" />
        <TabBtn active={tab === "b"} onClick={() => setTab("b")} label="Video B" color="violet" />
      </div>

      {/* Desktop: 3-column grid */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 sm:gap-5 p-4 sm:p-6 h-full">
        <div className="lg:col-span-3 min-h-0 overflow-y-auto scrollbar-thin">
          {videoA && <VideoCard video={videoA} />}
        </div>
        <div className="lg:col-span-6 min-h-0 overflow-hidden flex flex-col">
          <ChatPanel />
        </div>
        <div className="lg:col-span-3 min-h-0 overflow-y-auto scrollbar-thin">
          {videoB && <VideoCard video={videoB} />}
        </div>
      </div>

      {/* Mobile: single column via tab */}
      <div className="lg:hidden flex-1 min-h-0 overflow-hidden">
        {tab === "a" && videoA && (
          <div className="h-full overflow-y-auto scrollbar-thin">
            <VideoCard video={videoA} />
          </div>
        )}
        {tab === "chat" && (
          <ChatPanel />
        )}
        {tab === "b" && videoB && (
          <div className="h-full overflow-y-auto scrollbar-thin">
            <VideoCard video={videoB} />
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color: string }) {
  const activeColors = {
    blue: "border-blue-500 text-blue-600",
    violet: "border-violet-500 text-violet-600",
    indigo: "border-indigo-500 text-indigo-600",
  };
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-xs font-bold tracking-wide transition-all border-b-2 ${
        active ? activeColors[color as keyof typeof activeColors] : "border-transparent text-slate-400 hover:text-slate-600"
      }`}
    >
      {label}
    </button>
  );
}
