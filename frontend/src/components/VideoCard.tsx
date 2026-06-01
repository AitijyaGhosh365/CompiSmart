"use client";

import { VideoData } from "@/types";
import { Eye, Heart, MessageSquare, Users, Calendar, Clock, Hash } from "lucide-react";

const getEmbedUrl = (url: string) => {
  if (!url) return "";
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  const igMatch = url.match(/instagram\.com\/(?:reel|p)\/([a-zA-Z0-9_-]+)/);
  if (igMatch) {
    return `https://www.instagram.com/p/${igMatch[1]}/embed`;
  }
  return "";
};

export default function VideoCard({ video }: { video: VideoData }) {
  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const embedUrl = getEmbedUrl(video.video_url);
  
  // Custom Light-Themed styling
  const themeClass = video.id === "A" 
    ? "bg-white border-zinc-200/80 shadow-[0_8px_30px_rgba(59,130,246,0.03)] hover:border-blue-300" 
    : "bg-white border-zinc-200/80 shadow-[0_8px_30px_rgba(139,92,246,0.03)] hover:border-violet-300";

  const badgeColor = video.id === "A"
    ? "bg-blue-50 text-blue-600 border-blue-100 shadow-[0_0_10px_rgba(59,130,246,0.05)]"
    : "bg-violet-50 text-violet-600 border-violet-100 shadow-[0_0_10px_rgba(139,92,246,0.05)]";

  const progressStroke = video.id === "A" ? "stroke-blue-600" : "stroke-violet-600";
  const progressBg = video.id === "A" ? "stroke-blue-100" : "stroke-violet-100";

  // Circular gauge settings for engagement rate
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(video.engagement_rate, 10) / 10) * circumference;

  return (
    <div className={`flex flex-col h-full border rounded-2xl overflow-hidden shadow-sm transition-all duration-500 ${themeClass}`}>
      
      {/* Top Header */}
      <div className="p-4 border-b border-zinc-200/60 bg-zinc-50/50 flex items-center justify-between flex-none">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border ${badgeColor}`}>
            Video {video.id}
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-zinc-800 max-w-[110px] truncate" title={video.creator}>
              @{video.creator}
            </span>
            <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-medium">
              <Users size={10} className="text-zinc-400" />
              {formatNumber(video.follower_count)}
            </span>
          </div>
        </div>

        {/* Circular Engagement Gauge */}
        <div className="relative w-12 h-12 flex items-center justify-center flex-none">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="24" cy="24" r={radius} className={progressBg} strokeWidth="2.5" fill="transparent" />
            <circle 
              cx="24" 
              cy="24" 
              r={radius} 
              className={`${progressStroke} transition-all duration-1000 ease-out`} 
              strokeWidth="3.5" 
              fill="transparent" 
              strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset} 
              strokeLinecap="round" 
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-bold text-zinc-800 font-mono tracking-tighter">
              {video.engagement_rate}%
            </span>
          </div>
        </div>
      </div>

      {/* Video Player Embed */}
      <div className="p-4 flex-none border-b border-zinc-100">
        {embedUrl ? (
          <div className={`relative ${video.video_url.includes("instagram.com") ? "aspect-[9/16] max-h-[380px]" : "aspect-video"} rounded-xl overflow-hidden border border-zinc-200/50 shadow-md group transition-all duration-300 hover:shadow-lg`}>
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full border-0 overflow-hidden"
              scrolling="no"
              style={{ overflow: "hidden" }}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        ) : (
          <div className="aspect-video bg-zinc-100 border border-zinc-200/50 rounded-xl flex flex-col items-center justify-center text-zinc-400 space-y-2">
            <span className="text-3xl">🎬</span>
            <span className="text-xs font-mono">No video URL provided</span>
          </div>
        )}
      </div>

      {/* Scrollable Video Info & Stats Section */}
      <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-zinc-200">
        <div className="space-y-2.5">
          <h3 className="font-bold text-sm text-zinc-800 leading-snug tracking-wide" title={video.title}>
            {video.title}
          </h3>
          <div className="flex items-center gap-4 text-[10px] font-semibold font-mono text-zinc-500">
            <span className="flex items-center gap-1">
              <Calendar size={11} className="text-zinc-400" />
              {video.upload_date}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-zinc-400" />
              {formatDuration(video.duration)}
            </span>
          </div>
        </div>

        {/* Dashboard Grid of Key Metrics */}
        <div className="grid grid-cols-3 gap-2 bg-zinc-50 border border-zinc-200/60 rounded-xl p-3 text-center shadow-sm">
          <div>
            <span className="flex items-center justify-center gap-1 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
              <Eye size={11} className="text-blue-500" />
              Views
            </span>
            <p className="text-sm font-black text-zinc-800 mt-1 font-mono tracking-tight">{formatNumber(video.views)}</p>
          </div>
          <div>
            <span className="flex items-center justify-center gap-1 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
              <Heart size={11} className="text-rose-500" />
              Likes
            </span>
            <p className="text-sm font-black text-zinc-800 mt-1 font-mono tracking-tight">{formatNumber(video.likes)}</p>
          </div>
          <div>
            <span className="flex items-center justify-center gap-1 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
              <MessageSquare size={11} className="text-emerald-500" />
              Comments
            </span>
            <p className="text-sm font-black text-zinc-800 mt-1 font-mono tracking-tight">{formatNumber(video.comments)}</p>
          </div>
        </div>

        {/* Hashtags */}
        {video.hashtags && video.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {video.hashtags.slice(0, 5).map((tag) => (
              <span 
                key={tag} 
                className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-zinc-50 border border-zinc-200/80 text-zinc-500 hover:text-zinc-700 transition-colors flex items-center gap-0.5"
              >
                <Hash size={8} className="text-zinc-400" />
                {tag.toLowerCase()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
