"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { ingestVideos } from "@/lib/api";
import { Sparkles, Link2, ArrowRight } from "lucide-react";

const YoutubeIcon = ({ size = 15, className = "" }: { size?: number; className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <polygon points="10 15 15 12 10 9" fill="currentColor" />
  </svg>
);

const InstagramIcon = ({ size = 15, className = "" }: { size?: number; className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function IngestForm() {
  const [videoA, setVideoA] = useState("");
  const [videoB, setVideoB] = useState("");
  const [error, setError] = useState("");
  const { setSessionId, setVideos, setLoading, isLoading } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await ingestVideos(videoA, videoB);
      setSessionId(data.session_id);
      setVideos(data.video_a, data.video_b);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isYoutube = (url: string) => {
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  const isInstagram = (url: string) => {
    return url.includes("instagram.com");
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-zinc-200/80 rounded-3xl p-8 shadow-xl space-y-6 relative overflow-hidden">
      {/* Background soft pastel glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-100/30 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-100/30 rounded-full blur-3xl -z-10" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Video Input A */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Video Source A
            </label>
            <span className="flex items-center gap-1 text-[9px] font-bold text-zinc-400 font-mono">
              {videoA && isYoutube(videoA) && <span className="text-red-500 flex items-center gap-0.5"><YoutubeIcon size={10} /> YouTube</span>}
              {videoA && isInstagram(videoA) && <span className="text-pink-500 flex items-center gap-0.5"><InstagramIcon size={10} /> Instagram</span>}
              {(!videoA || (!isYoutube(videoA) && !isInstagram(videoA))) && <span className="flex items-center gap-0.5"><Link2 size={10} /> Paste URL</span>}
            </span>
          </div>
          <div className="relative group">
            <input
              type="url"
              value={videoA}
              onChange={(e) => setVideoA(e.target.value)}
              placeholder="Paste YouTube or Instagram link..."
              className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder-zinc-400 text-sm focus:outline-none focus:bg-white focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.04)] transition-all duration-300"
              required
            />
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-blue-500 transition-colors">
              {videoA && isYoutube(videoA) ? (
                <YoutubeIcon size={15} className="text-red-500" />
              ) : videoA && isInstagram(videoA) ? (
                <InstagramIcon size={15} className="text-pink-500" />
              ) : (
                <Link2 size={15} />
              )}
            </div>
          </div>
        </div>

        {/* Video Input B */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Video Source B
            </label>
            <span className="flex items-center gap-1 text-[9px] font-bold text-zinc-400 font-mono">
              {videoB && isYoutube(videoB) && <span className="text-red-500 flex items-center gap-0.5"><YoutubeIcon size={10} /> YouTube</span>}
              {videoB && isInstagram(videoB) && <span className="text-pink-500 flex items-center gap-0.5"><InstagramIcon size={10} /> Instagram</span>}
              {(!videoB || (!isYoutube(videoB) && !isInstagram(videoB))) && <span className="flex items-center gap-0.5"><Link2 size={10} /> Paste URL</span>}
            </span>
          </div>
          <div className="relative group">
            <input
              type="url"
              value={videoB}
              onChange={(e) => setVideoB(e.target.value)}
              placeholder="Paste YouTube or Instagram link..."
              className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder-zinc-400 text-sm focus:outline-none focus:bg-white focus:border-indigo-500/50 focus:shadow-[0_0_20px_rgba(99,102,241,0.04)] transition-all duration-300"
              required
            />
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-indigo-500 transition-colors">
              {videoB && isYoutube(videoB) ? (
                <YoutubeIcon size={15} className="text-red-500" />
              ) : videoB && isInstagram(videoB) ? (
                <InstagramIcon size={15} className="text-pink-500" />
              ) : (
                <Link2 size={15} />
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs leading-relaxed font-semibold shadow-[0_2px_10px_rgba(244,63,94,0.02)]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-600/10 hover:shadow-xl hover:shadow-indigo-600/15 hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Running Ingestion Pipeline...
            </span>
          ) : (
            <>
              Analyze & Compare
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
