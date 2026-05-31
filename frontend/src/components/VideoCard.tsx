"use client";

import { VideoData } from "@/types";

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

  const getEngagementColor = (rate: number) => {
    if (rate >= 5) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (rate >= 2) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  const embedUrl = getEmbedUrl(video.video_url);
  const themeClass = video.id === "A" 
    ? "from-blue-600/10 to-transparent border-blue-500/20" 
    : "from-indigo-600/10 to-transparent border-indigo-500/20";

  const badgeColor = video.id === "A"
    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
    : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";

  return (
    <div className={`flex flex-col h-full bg-zinc-950/60 backdrop-blur-xl border rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-white/10 bg-gradient-to-b ${themeClass}`}>
      {/* Video Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border ${badgeColor}`}>
            Video {video.id}
          </span>
          <span className="text-xs text-zinc-400 font-mono max-w-[120px] truncate" title={video.creator}>
            @{video.creator}
          </span>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getEngagementColor(video.engagement_rate)}`}>
          {video.engagement_rate}% Engagement
        </span>
      </div>

      {/* Video Player Embed */}
      <div className="p-4 flex-none">
        {embedUrl ? (
          <div className="relative aspect-video rounded-xl overflow-hidden border border-white/5 shadow-2xl group">
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        ) : (
          <div className="aspect-video bg-zinc-900 border border-white/5 rounded-xl flex flex-col items-center justify-center text-zinc-500 space-y-2">
            <span className="text-3xl">🎬</span>
            <span className="text-xs font-mono">No video URL provided</span>
          </div>
        )}
      </div>

      {/* Video Info & Stats */}
      <div className="flex-1 p-4 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-zinc-100 line-clamp-2 leading-relaxed" title={video.title}>
            {video.title}
          </h3>
          <p className="text-xs text-zinc-500">
            Uploaded: {video.upload_date} • Duration: {formatDuration(video.duration)}
          </p>
        </div>

        {/* Dashboard Grid of Key Metrics */}
        <div className="grid grid-cols-3 gap-2 bg-zinc-900/40 border border-white/5 rounded-xl p-3 text-center">
          <div>
            <p className="text-xs text-zinc-400">Views</p>
            <p className="text-sm font-bold text-zinc-100 mt-0.5">{formatNumber(video.views)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Likes</p>
            <p className="text-sm font-bold text-zinc-100 mt-0.5">{formatNumber(video.likes)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Comments</p>
            <p className="text-sm font-bold text-zinc-100 mt-0.5">{formatNumber(video.comments)}</p>
          </div>
        </div>

        {/* Hashtags */}
        {video.hashtags && video.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {video.hashtags.slice(0, 6).map((tag) => (
              <span 
                key={tag} 
                className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                #{tag.toLowerCase()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
