"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { streamChat } from "@/lib/api";
import ChatMessageComponent from "./ChatMessage";
import ChatInput from "./ChatInput";
import {
  MessageSquare,
  BarChart3,
  Eye,
  Heart,
  Sparkles,
  TrendingUp,
  Clock,
  Users,
  Zap,
  Award,
  ChevronRight
} from "lucide-react";

export default function ChatPanel() {
  const {
    sessionId,
    videoA,
    videoB,
    messages,
    addMessage,
    updateStreamingMessage,
    setStreamingSources,
    isStreaming,
    setStreaming
  } = useStore();

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
      await streamChat(
        sessionId,
        message,
        (chunk) => updateStreamingMessage(chunk),
        (sources) => setStreamingSources(sources),
        () => setStreaming(false)
      );
    } catch (err) {
      updateStreamingMessage("\n\n*Error: Failed to get response*");
      setStreaming(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-3 p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm">
        <span className="text-4xl animate-bounce">💬</span>
        <p className="text-sm font-semibold tracking-wide text-zinc-500">Ingest videos to unlock RAG chat panel</p>
      </div>
    );
  }

  // --- STATS COMPUTATIONS ---
  const hasVideos = videoA && videoB;

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  // Default fallbacks in case data isn't loaded yet
  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;

  let viewsPctA = 50;
  let viewsPctB = 50;
  let likesPctA = 50;
  let likesPctB = 50;
  let commentsPctA = 50;
  let commentsPctB = 50;

  let likeRatioA = 0;
  let likeRatioB = 0;
  let commentRatioA = 0;
  let commentRatioB = 0;

  let reachFactorA = 0;
  let reachFactorB = 0;

  let engagementDiff = 0;
  let engagementWinnerName = "";
  let engagementWinnerColor = "";
  let engagementRatioStr = "1.0";

  let viewWinnerName = "";
  let viewRatioStr = "1.0";

  let speedA = 0;
  let speedB = 0;

  if (hasVideos && videoA && videoB) {
    totalViews = videoA.views + videoB.views;
    totalLikes = videoA.likes + videoB.likes;
    totalComments = videoA.comments + videoB.comments;

    viewsPctA = totalViews > 0 ? (videoA.views / totalViews) * 100 : 50;
    viewsPctB = 100 - viewsPctA;

    likesPctA = totalLikes > 0 ? (videoA.likes / totalLikes) * 100 : 50;
    likesPctB = 100 - likesPctA;

    commentsPctA = totalComments > 0 ? (videoA.comments / totalComments) * 100 : 50;
    commentsPctB = 100 - commentsPctA;

    likeRatioA = (videoA.likes / Math.max(videoA.views, 1)) * 100;
    likeRatioB = (videoB.likes / Math.max(videoB.views, 1)) * 100;

    commentRatioA = (videoA.comments / Math.max(videoA.views, 1)) * 100;
    commentRatioB = (videoB.comments / Math.max(videoB.views, 1)) * 100;

    reachFactorA = (videoA.views / Math.max(videoA.follower_count, 1)) * 100;
    reachFactorB = (videoB.views / Math.max(videoB.follower_count, 1)) * 100;

    engagementDiff = Math.abs(videoA.engagement_rate - videoB.engagement_rate);
    engagementWinnerName = videoA.engagement_rate >= videoB.engagement_rate ? `@${videoA.creator}` : `@${videoB.creator}`;
    engagementWinnerColor = videoA.engagement_rate >= videoB.engagement_rate ? "text-blue-600" : "text-violet-600";
    engagementRatioStr = videoA.engagement_rate >= videoB.engagement_rate
      ? (videoA.engagement_rate / Math.max(videoB.engagement_rate, 0.1)).toFixed(1)
      : (videoB.engagement_rate / Math.max(videoA.engagement_rate, 0.1)).toFixed(1);

    viewWinnerName = videoA.views >= videoB.views ? `@${videoA.creator}` : `@${videoB.creator}`;
    viewRatioStr = videoA.views >= videoB.views
      ? (videoA.views / Math.max(videoB.views, 1)).toFixed(1)
      : (videoB.views / Math.max(videoA.views, 1)).toFixed(1);

    speedA = videoA.duration / Math.max(videoA.transcript_chunks, 1);
    speedB = videoB.duration / Math.max(videoB.transcript_chunks, 1);
  }

  // Bar dimensions for the SVG chart
  const engMax = hasVideos && videoA && videoB ? Math.max(videoA.engagement_rate, videoB.engagement_rate, 0.1) : 10;
  const engH_A = hasVideos && videoA ? (videoA.engagement_rate / engMax) * 105 : 0;
  const engH_B = hasVideos && videoB ? (videoB.engagement_rate / engMax) * 105 : 0;

  const likeMax = Math.max(likeRatioA, likeRatioB, 0.1);
  const likeH_A = (likeRatioA / likeMax) * 105;
  const likeH_B = (likeRatioB / likeMax) * 105;

  const commMax = Math.max(commentRatioA, commentRatioB, 0.01);
  const commH_A = (commentRatioA / commMax) * 105;
  const commH_B = (commentRatioB / commMax) * 105;

  return (
    <div className="flex flex-col h-full bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
      {/* Header with Switcher Tabs */}
      <div className="p-3 border-b border-zinc-200/80 bg-zinc-50/40 flex items-center justify-between flex-none">
        <div className="flex bg-zinc-200/60 p-0.5 rounded-xl border border-zinc-200/40">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${
              activeTab === "chat"
                ? "bg-white text-zinc-800 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <MessageSquare size={13} className={activeTab === "chat" ? "text-blue-600" : "text-zinc-400"} />
            Co-Pilot Chat
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${
              activeTab === "stats"
                ? "bg-white text-zinc-800 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <BarChart3 size={13} className={activeTab === "stats" ? "text-violet-600" : "text-zinc-400"} />
            Analytics Tab
          </button>
        </div>

        <div className="flex items-center gap-2 pr-1">
          <span className={`w-2 h-2 rounded-full ${isStreaming ? "bg-blue-500 animate-ping" : "bg-emerald-500 animate-pulse"}`} />
          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
            {activeTab === "chat" ? "RAG Co-Pilot: Active" : "Stats: Visualized"}
          </span>
        </div>
      </div>

      {activeTab === "chat" ? (
        <>
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 scrollbar-thin scrollbar-thumb-zinc-200 bg-zinc-50/20">
            {messages.map((msg, i) => (
              <ChatMessageComponent key={i} message={msg} />
            ))}
            {isStreaming && messages[messages.length - 1]?.role === "assistant" && (
              <div className="flex justify-start pl-4">
                <span className="inline-block w-2.5 h-4 bg-blue-600/80 animate-pulse rounded-sm" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <div className="border-t border-zinc-200/80 p-4 bg-white flex-none">
            <ChatInput onSend={handleSend} disabled={isStreaming} />
          </div>
        </>
      ) : (
        /* Analytics Dashboard View */
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200 bg-zinc-50/30">
          {hasVideos && videoA && videoB ? (
            <>
              {/* Creator Overview Badges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50/30 border border-blue-100 rounded-2xl flex flex-col shadow-sm">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600">Video A Creator</span>
                  <span className="text-sm font-black text-blue-900 truncate">@{videoA.creator}</span>
                  <span className="text-[10px] font-medium text-zinc-500 truncate mt-0.5">{videoA.title}</span>
                </div>
                <div className="p-3 bg-violet-50/30 border border-violet-100 rounded-2xl flex flex-col shadow-sm">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-violet-600">Video B Creator</span>
                  <span className="text-sm font-black text-violet-900 truncate">@{videoB.creator}</span>
                  <span className="text-[10px] font-medium text-zinc-500 truncate mt-0.5">{videoB.title}</span>
                </div>
              </div>

              {/* Dynamic RAG Deep Insights Card */}
              <div className="p-4 bg-white border border-zinc-200/60 rounded-2xl shadow-sm space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-100/30 to-transparent rounded-full -mr-6 -mt-6 pointer-events-none" />
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500 animate-pulse" />
                  <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider">AI Studio Insights</h4>
                </div>
                <div className="text-xs text-zinc-600 leading-relaxed space-y-2">
                  <p className="flex items-start gap-1.5">
                    <ChevronRight size={14} className="text-zinc-400 mt-0.5 flex-none" />
                    <span>
                      <strong className={engagementWinnerColor}>{engagementWinnerName}</strong> is leading in interaction density, achieving an engagement rate of <strong>{engagementWinnerName === `@${videoA.creator}` ? videoA.engagement_rate : videoB.engagement_rate}%</strong>, which is <strong className="text-zinc-800">{engagementRatioStr}x</strong> that of the counterpart.
                    </span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <ChevronRight size={14} className="text-zinc-400 mt-0.5 flex-none" />
                    <span>
                      In terms of overall reach, <strong className="text-zinc-800">{viewWinnerName}</strong> captured a higher portion of the market, generating <strong>{viewRatioStr}x</strong> more views than the secondary video.
                    </span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <ChevronRight size={14} className="text-zinc-400 mt-0.5 flex-none" />
                    <span>
                      Format comparison shows Video A is <strong>{formatDuration(videoA.duration)}</strong> while Video B is <strong>{formatDuration(videoB.duration)}</strong>, translating to transcript speeds of <strong>{speedA.toFixed(1)}s</strong> vs <strong>{speedB.toFixed(1)}s</strong> per indexed Pinecone vector.
                    </span>
                  </p>
                </div>
              </div>

              {/* Proportional Metric Share Gauges */}
              <div className="p-4 bg-white border border-zinc-200/60 rounded-2xl shadow-sm space-y-5">
                <div className="flex items-center gap-2">
                  <TrendingUp size={15} className="text-zinc-500" />
                  <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider">Volume Split Comparison</h4>
                </div>

                <div className="space-y-4">
                  {/* Views Split */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-extrabold text-zinc-600 font-mono">
                      <span className="text-blue-600">Video A ({formatNumber(videoA.views)})</span>
                      <span className="text-zinc-400 uppercase tracking-wider">Views Share</span>
                      <span className="text-violet-600">Video B ({formatNumber(videoB.views)})</span>
                    </div>
                    <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden flex border border-zinc-200/40 p-0.5">
                      <div
                        style={{ width: `${viewsPctA}%` }}
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-l-full transition-all duration-1000 ease-out flex items-center justify-center text-[8px] font-black text-white"
                      >
                        {viewsPctA > 20 && `${viewsPctA.toFixed(0)}%`}
                      </div>
                      <div
                        style={{ width: `${viewsPctB}%` }}
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-r-full transition-all duration-1000 ease-out flex items-center justify-center text-[8px] font-black text-white"
                      >
                        {viewsPctB > 20 && `${viewsPctB.toFixed(0)}%`}
                      </div>
                    </div>
                  </div>

                  {/* Likes Split */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-extrabold text-zinc-600 font-mono">
                      <span className="text-blue-600">Video A ({formatNumber(videoA.likes)})</span>
                      <span className="text-zinc-400 uppercase tracking-wider">Likes Share</span>
                      <span className="text-violet-600">Video B ({formatNumber(videoB.likes)})</span>
                    </div>
                    <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden flex border border-zinc-200/40 p-0.5">
                      <div
                        style={{ width: `${likesPctA}%` }}
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-l-full transition-all duration-1000 ease-out flex items-center justify-center text-[8px] font-black text-white"
                      >
                        {likesPctA > 20 && `${likesPctA.toFixed(0)}%`}
                      </div>
                      <div
                        style={{ width: `${likesPctB}%` }}
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-r-full transition-all duration-1000 ease-out flex items-center justify-center text-[8px] font-black text-white"
                      >
                        {likesPctB > 20 && `${likesPctB.toFixed(0)}%`}
                      </div>
                    </div>
                  </div>

                  {/* Comments Split */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-extrabold text-zinc-600 font-mono">
                      <span className="text-blue-600">Video A ({formatNumber(videoA.comments)})</span>
                      <span className="text-zinc-400 uppercase tracking-wider">Comments Share</span>
                      <span className="text-violet-600">Video B ({formatNumber(videoB.comments)})</span>
                    </div>
                    <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden flex border border-zinc-200/40 p-0.5">
                      <div
                        style={{ width: `${commentsPctA}%` }}
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-l-full transition-all duration-1000 ease-out flex items-center justify-center text-[8px] font-black text-white"
                      >
                        {commentsPctA > 20 && `${commentsPctA.toFixed(0)}%`}
                      </div>
                      <div
                        style={{ width: `${commentsPctB}%` }}
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-r-full transition-all duration-1000 ease-out flex items-center justify-center text-[8px] font-black text-white"
                      >
                        {commentsPctB > 20 && `${commentsPctB.toFixed(0)}%`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group-Normalized SVG Chart */}
              <div className="p-4 bg-white border border-zinc-200/60 rounded-2xl shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Award size={15} className="text-zinc-500" />
                    <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider">Ratios Side-by-Side</h4>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-3 text-[9px] font-bold font-mono">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500 inline-block" /> Video A</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-violet-500 inline-block" /> Video B</span>
                  </div>
                </div>

                <div className="border border-zinc-100 rounded-xl p-2 bg-zinc-50/30">
                  <svg viewBox="0 0 460 170" className="w-full h-auto">
                    <defs>
                      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#60a5fa" />
                      </linearGradient>
                      <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#a78bfa" />
                      </linearGradient>
                    </defs>

                    {/* Gridlines */}
                    <line x1="10" y1="20" x2="450" y2="20" stroke="#e4e4e7/30" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="10" y1="75" x2="450" y2="75" stroke="#e4e4e7/30" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="10" y1="130" x2="450" y2="130" stroke="#e4e4e7" strokeWidth="1.5" />

                    {/* Group 1: Engagement Rate */}
                    <rect x="65" y={130 - engH_A} width="26" height={engH_A} fill="url(#blueGrad)" rx="3" />
                    <text x="78" y={130 - engH_A - 6} textAnchor="middle" className="text-[10px] font-black fill-zinc-800 font-mono">
                      {videoA.engagement_rate.toFixed(1)}%
                    </text>

                    <rect x="97" y={130 - engH_B} width="26" height={engH_B} fill="url(#violetGrad)" rx="3" />
                    <text x="110" y={130 - engH_B - 6} textAnchor="middle" className="text-[10px] font-black fill-zinc-800 font-mono">
                      {videoB.engagement_rate.toFixed(1)}%
                    </text>

                    <text x="94" y="148" textAnchor="middle" className="text-[9px] font-black fill-zinc-500 uppercase tracking-widest">
                      Engagement
                    </text>

                    {/* Group 2: Likes Ratio */}
                    <rect x="200" y={130 - likeH_A} width="26" height={likeH_A} fill="url(#blueGrad)" rx="3" />
                    <text x="213" y={130 - likeH_A - 6} textAnchor="middle" className="text-[10px] font-black fill-zinc-800 font-mono">
                      {likeRatioA.toFixed(1)}%
                    </text>

                    <rect x="232" y={130 - likeH_B} width="26" height={likeH_B} fill="url(#violetGrad)" rx="3" />
                    <text x="245" y={130 - likeH_B - 6} textAnchor="middle" className="text-[10px] font-black fill-zinc-800 font-mono">
                      {likeRatioB.toFixed(1)}%
                    </text>

                    <text x="229" y="148" textAnchor="middle" className="text-[9px] font-black fill-zinc-500 uppercase tracking-widest">
                      Like / View %
                    </text>

                    {/* Group 3: Comments Ratio */}
                    <rect x="335" y={130 - commH_A} width="26" height={commH_A} fill="url(#blueGrad)" rx="3" />
                    <text x="348" y={130 - commH_A - 6} textAnchor="middle" className="text-[10px] font-black fill-zinc-800 font-mono">
                      {commentRatioA.toFixed(2)}%
                    </text>

                    <rect x="367" y={130 - commH_B} width="26" height={commH_B} fill="url(#violetGrad)" rx="3" />
                    <text x="380" y={130 - commH_B - 6} textAnchor="middle" className="text-[10px] font-black fill-zinc-800 font-mono">
                      {commentRatioB.toFixed(2)}%
                    </text>

                    <text x="364" y="148" textAnchor="middle" className="text-[9px] font-black fill-zinc-500 uppercase tracking-widest">
                      Comm / View %
                    </text>
                  </svg>
                </div>
              </div>

              {/* Advanced Performance Efficiencies Grid */}
              <div className="p-4 bg-white border border-zinc-200/60 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Zap size={15} className="text-zinc-500" />
                  <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider">Reach & Format Efficiency</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Reach Factor (Views per Follower) */}
                  <div className="p-3 bg-zinc-50 border border-zinc-200/40 rounded-xl space-y-1">
                    <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider block">Reach Factor (Views/Follower)</span>
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-xs font-extrabold text-blue-600 font-mono">{reachFactorA.toFixed(1)}%</span>
                      <span className="text-[10px] text-zinc-400">vs</span>
                      <span className="text-xs font-extrabold text-violet-600 font-mono">{reachFactorB.toFixed(1)}%</span>
                    </div>
                    <p className="text-[9px] text-zinc-400 pt-0.5 leading-snug">Percentage of views relative to the follower count.</p>
                  </div>

                  {/* Pace (Duration per Chunk) */}
                  <div className="p-3 bg-zinc-50 border border-zinc-200/40 rounded-xl space-y-1">
                    <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider block">Information Density</span>
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-xs font-extrabold text-blue-600 font-mono">{speedA.toFixed(1)}s</span>
                      <span className="text-[10px] text-zinc-400">vs</span>
                      <span className="text-xs font-extrabold text-violet-600 font-mono">{speedB.toFixed(1)}s</span>
                    </div>
                    <p className="text-[9px] text-zinc-400 pt-0.5 leading-snug">Average duration length of each Pinecone vectorized transcript chunk.</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400 space-y-2">
              <span>📊</span>
              <p className="text-xs font-semibold">Metadata is missing. Please re-ingest videos.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

