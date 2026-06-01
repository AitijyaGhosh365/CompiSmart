"use client";

import { VideoData } from "@/types";
import { Eye, Heart, MessageSquare, Users, Calendar, Clock, Hash } from "lucide-react";

const getEmbedUrl = (url: string) => {
  if (!url) return "";
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const igMatch = url.match(/instagram\.com\/(?:reels?|p)\/([a-zA-Z0-9_-]+)/);
  if (igMatch) return `https://www.instagram.com/p/${igMatch[1]}/embed`;
  return "";
};

export default function VideoCard({ video }: { video: VideoData }) {
  const isA = video.id === "A";
  const accent = isA ? "blue" : "violet";
  const accentHex = isA ? "#2563eb" : "#7c3aed";
  const embedUrl = getEmbedUrl(video.video_url);
  const isInstagram = video.video_url?.includes("instagram.com");

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  const formatDuration = (s: number) => {
    if (!s) return "—";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const ringColor = isA ? "stroke-blue-500" : "stroke-violet-500";
  const ringBg = isA ? "stroke-blue-100" : "stroke-violet-100";
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(video.engagement_rate || 0, 15) / 15) * circumference;

  return (
    <div className={`flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm ${isA ? "hover:shadow-md hover:border-blue-200" : "hover:shadow-md hover:border-violet-200"} transition-all duration-300`}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between flex-none border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`text-[10px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-lg border ${isA ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-violet-50 text-violet-600 border-violet-100"}`}>
            Video {video.id}
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-800 truncate" title={video.creator}>
              @{video.creator}
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Users size={10} />
              {formatNumber(video.follower_count || 0)}
            </span>
          </div>
        </div>

        {/* Engagement Gauge */}
        <div className="relative w-11 h-11 flex items-center justify-center flex-none">
          <svg className="w-full h-full -rotate-90">
            <circle cx="22" cy="22" r={radius} className={ringBg} strokeWidth="2" fill="transparent" />
            <circle cx="22" cy="22" r={radius} className={`${ringColor} transition-all duration-1000 ease-out`} strokeWidth="2.5" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
          </svg>
          <div className="absolute text-center">
            <span className="text-[9px] font-extrabold text-slate-700 font-mono">
              {video.engagement_rate?.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="p-3 flex-none">
        {embedUrl ? (
          <div className={`relative ${isInstagram ? "aspect-[9/16] mx-auto max-w-[70%]" : "aspect-video"} rounded-xl overflow-hidden border border-slate-200/60 shadow-sm group`}>
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full border-0"
              scrolling="no"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        ) : (
          <div className="aspect-video bg-slate-100 border border-slate-200/50 rounded-xl flex flex-col items-center justify-center text-slate-400 space-y-2">
            <span className="text-2xl">🎬</span>
            <span className="text-[10px] font-medium">No player available</span>
          </div>
        )}
      </div>

      {/* Info & Stats */}
      <div className="flex-1 p-4 pt-0 overflow-y-auto scrollbar-hide space-y-3">
        <div className="space-y-1.5">
          <h3 className="font-bold text-sm text-slate-800 leading-snug line-clamp-2" title={video.title}>
            {video.title}
          </h3>
          <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {video.upload_date || "—"}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {formatDuration(video.duration)}
            </span>
          </div>
        </div>

        {/* Metric Tiles */}
        <div className="grid grid-cols-3 gap-2">
          <MetricTile icon={<Eye size={12} className="text-blue-500" />} label="Views" value={formatNumber(video.views || 0)} />
          <MetricTile icon={<Heart size={12} className="text-rose-500" />} label="Likes" value={formatNumber(video.likes || 0)} />
          <MetricTile icon={<MessageSquare size={12} className="text-emerald-500" />} label="Comments" value={formatNumber(video.comments || 0)} />
        </div>

        {/* Hashtags */}
        {video.hashtags && video.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {video.hashtags.slice(0, 5).map((tag) => (
              <span key={tag} className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-0.5">
                <Hash size={8} />
                {tag.replace(/^#/, "").toLowerCase()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs font-extrabold text-slate-800 font-mono">{value}</p>
    </div>
  );
}
