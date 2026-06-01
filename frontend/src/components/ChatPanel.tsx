"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { streamChat } from "@/lib/api";
import ChatMessageComponent from "./ChatMessage";
import ChatInput from "./ChatInput";
import { MessageSquare, BarChart3, Sparkles, TrendingUp, Award, Zap, ChevronRight } from "lucide-react";

export default function ChatPanel() {
  const { sessionId, videoA, videoB, messages, addMessage, updateStreamingMessage, setStreamingSources, isStreaming, setStreaming } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "stats">("chat");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (message: string) => {
    if (!sessionId) return;
    addMessage({ role: "user", content: message, timestamp: Date.now() });
    addMessage({ role: "assistant", content: "", timestamp: Date.now() });
    setStreaming(true);
    try {
      await streamChat(sessionId, message, (chunk) => updateStreamingMessage(chunk), (sources) => setStreamingSources(sources), () => setStreaming(false));
    } catch {
      updateStreamingMessage("\n\n*Error: Failed to get response*");
      setStreaming(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <p className="text-sm font-semibold text-slate-500">Ingest two videos to unlock analysis</p>
        <p className="text-xs text-slate-400 text-center max-w-60">Compare engagement, transcripts, and chat with an AI co-pilot powered by RAG</p>
      </div>
    );
  }

  if (!videoA || !videoB) {
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-2xl border border-slate-200 shadow-sm">
        <span className="text-sm text-slate-500">Loading video data...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Tabs */}
      <div className="p-2 border-b border-slate-200 flex items-center justify-between flex-none bg-slate-50/80">
        <div className="flex bg-slate-200/60 p-0.5 rounded-xl">
          <TabButton active={activeTab === "chat"} onClick={() => setActiveTab("chat")} icon={<MessageSquare size={13} />} label="Chat" />
          <TabButton active={activeTab === "stats"} onClick={() => setActiveTab("stats")} icon={<BarChart3 size={13} />} label="Analytics" />
        </div>
        <div className={`w-2 h-2 rounded-full ${isStreaming ? "bg-blue-500 animate-pulse" : "bg-emerald-500"}`} />
      </div>

      {activeTab === "chat" ? (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-white">
            {messages.map((msg, i) => (
              <ChatMessageComponent key={i} message={msg} />
            ))}
            {isStreaming && messages[messages.length - 1]?.role === "assistant" && (
              <div className="flex items-center gap-1 pl-4">
                <span className="w-1.5 h-4 bg-blue-500 rounded-full animate-pulse" />
                <span className="w-1.5 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                <span className="w-1.5 h-2 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t border-slate-200 bg-white flex-none">
            <ChatInput onSend={handleSend} disabled={isStreaming} />
          </div>
        </>
      ) : (
        <StatsDashboard videoA={videoA} videoB={videoB} />
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${active ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatsDashboard({ videoA, videoB }: { videoA: NonNullable<ReturnType<typeof useStore>["videoA"]>; videoB: NonNullable<ReturnType<typeof useStore>["videoB"]> }) {
  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
  };
  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  const totalViews = videoA.views + videoB.views;
  const viewsPctA = totalViews > 0 ? (videoA.views / totalViews) * 100 : 50;
  const likesPctA = (videoA.likes + videoB.likes) > 0 ? (videoA.likes / (videoA.likes + videoB.likes)) * 100 : 50;
  const commentsPctA = (videoA.comments + videoB.comments) > 0 ? (videoA.comments / (videoA.comments + videoB.comments)) * 100 : 50;

  const engWinner = videoA.engagement_rate >= videoB.engagement_rate ? "A" : "B";
  const engRatio = engWinner === "A" ? (videoA.engagement_rate / Math.max(videoB.engagement_rate, 0.1)).toFixed(1) : (videoB.engagement_rate / Math.max(videoA.engagement_rate, 0.1)).toFixed(1);
  const viewWinner = videoA.views >= videoB.views ? "A" : "B";
  const viewRatio = viewWinner === "A" ? (videoA.views / Math.max(videoB.views, 1)).toFixed(1) : (videoB.views / Math.max(videoA.views, 1)).toFixed(1);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-slate-50">
      {/* Creator Cards */}
      <div className="grid grid-cols-2 gap-3">
        <MiniCard color="blue" label="Video A" creator={videoA.creator} value={videoA.title} />
        <MiniCard color="violet" label="Video B" creator={videoB.creator} value={videoB.title} />
      </div>

      {/* Insights */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-amber-500" />
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Key Insights</h4>
        </div>
        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <InsightLine
            text={<><strong className={engWinner === "A" ? "text-blue-600" : "text-violet-600"}>Video {engWinner}</strong> leads engagement by <strong>{engRatio}x</strong> — {(engWinner === "A" ? videoA.engagement_rate : videoB.engagement_rate).toFixed(1)}% vs {(engWinner === "A" ? videoB.engagement_rate : videoA.engagement_rate).toFixed(1)}%</>}
          />
          <InsightLine
            text={<><strong className="text-slate-800">Video {viewWinner}</strong> has <strong>{viewRatio}x</strong> more views ({formatNumber(viewWinner === "A" ? videoA.views : videoB.views)})</>}
          />
          <InsightLine
            text={<><strong className="text-slate-800">Duration:</strong> {formatDuration(videoA.duration)} (A) vs {formatDuration(videoB.duration)} (B)</>}
          />
        </div>
      </div>

      {/* Split Bars */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-slate-500" />
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Distribution</h4>
        </div>
        <SplitBar label="Views" pctA={viewsPctA} valA={formatNumber(videoA.views)} valB={formatNumber(videoB.views)} />
        <SplitBar label="Likes" pctA={likesPctA} valA={formatNumber(videoA.likes)} valB={formatNumber(videoB.likes)} />
        <SplitBar label="Comments" pctA={commentsPctA} valA={formatNumber(videoA.comments)} valB={formatNumber(videoB.comments)} />
      </div>

      {/* Efficiency */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-slate-500" />
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Efficiency</h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <EfficiencyTile label="Reach (V/F)" valA={((videoA.views || 1) / Math.max(videoA.follower_count || 1, 1) * 100).toFixed(1)} valB={((videoB.views || 1) / Math.max(videoB.follower_count || 1, 1) * 100).toFixed(1)} suffix="%" />
          <EfficiencyTile label="Density" valA={(videoA.duration / Math.max(videoA.transcript_chunks || 1, 1)).toFixed(1)} valB={(videoB.duration / Math.max(videoB.transcript_chunks || 1, 1)).toFixed(1)} suffix="s/chunk" />
        </div>
      </div>
    </div>
  );
}

function MiniCard({ color, label, creator, value }: { color: "blue" | "violet"; label: string; creator: string; value: string }) {
  return (
    <div className={`p-3 rounded-xl border ${color === "blue" ? "bg-blue-50 border-blue-200" : "bg-violet-50 border-violet-200"}`}>
      <span className={`text-[9px] font-bold uppercase tracking-wider ${color === "blue" ? "text-blue-500" : "text-violet-500"}`}>{label}</span>
      <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">@{creator}</p>
      <p className="text-[10px] text-slate-400 truncate">{value}</p>
    </div>
  );
}

function InsightLine({ text }: { text: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5">
      <ChevronRight size={13} className="text-slate-300 mt-0.5 flex-none" />
      <span>{text}</span>
    </p>
  );
}

function SplitBar({ label, pctA, valA, valB }: { label: string; pctA: number; valA: string; valB: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-bold text-slate-500">
        <span className="text-blue-600">A: {valA}</span>
        <span>{label}</span>
        <span className="text-violet-600">B: {valB}</span>
      </div>
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
        <div style={{ width: `${pctA}%` }} className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-l-full transition-all duration-700 flex items-center justify-center">
          {pctA > 25 && <span className="text-[7px] font-bold text-white">{pctA.toFixed(0)}%</span>}
        </div>
        <div style={{ width: `${100 - pctA}%` }} className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-r-full transition-all duration-700 flex items-center justify-center">
          {100 - pctA > 25 && <span className="text-[7px] font-bold text-white">{(100 - pctA).toFixed(0)}%</span>}
        </div>
      </div>
    </div>
  );
}

function EfficiencyTile({ label, valA, valB, suffix }: { label: string; valA: string; valB: string; suffix: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs font-extrabold text-blue-600 font-mono">{valA}{suffix}</span>
        <span className="text-[10px] text-slate-300">vs</span>
        <span className="text-xs font-extrabold text-violet-600 font-mono">{valB}{suffix}</span>
      </div>
    </div>
  );
}
