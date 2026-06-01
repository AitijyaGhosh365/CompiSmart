"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { ingestVideos } from "@/lib/api";
import { Sparkles, Link2, ArrowRight } from "lucide-react";

const YoutubeIcon = ({ size = 15 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <polygon points="10 15 15 12 10 9" fill="currentColor" />
  </svg>
);

const InstagramIcon = ({ size = 15 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

  const isYoutube = (url: string) => url.includes("youtube.com") || url.includes("youtu.be");
  const isInstagram = (url: string) => url.includes("instagram.com");

  const getPlatform = (url: string) => {
    if (!url) return null;
    if (isYoutube(url)) return { icon: <YoutubeIcon size={14} />, name: "YouTube", color: "text-red-500", bg: "bg-red-50", border: "border-red-100" };
    if (isInstagram(url)) return { icon: <InstagramIcon size={14} />, name: "Instagram", color: "text-pink-500", bg: "bg-pink-50", border: "border-pink-100" };
    return null;
  };

  const platformA = getPlatform(videoA);
  const platformB = getPlatform(videoB);

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-base font-bold text-slate-800">Compare Two Videos</h3>
        <p className="text-xs text-slate-500">Paste YouTube or Instagram Reel URLs below</p>
      </div>

      {/* Video A Input */}
      <InputField
        label="Video A"
        value={videoA}
        onChange={setVideoA}
        placeholder="https://www.youtube.com/watch?v=..."
        platform={platformA}
        focusColor="focus:border-blue-400 focus:ring-blue-100"
      />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">VS</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Video B Input */}
      <InputField
        label="Video B"
        value={videoB}
        onChange={setVideoB}
        placeholder="https://www.instagram.com/reel/..."
        platform={platformB}
        focusColor="focus:border-violet-400 focus:ring-violet-100"
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-medium">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Analyze & Compare
            <ArrowRight size={15} />
          </>
        )}
      </button>
    </form>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  platform,
  focusColor,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  platform: { icon: React.ReactNode; name: string; color: string; bg: string; border: string } | null;
  focusColor: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        {platform && (
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${platform.color} ${platform.bg} px-2 py-0.5 rounded-md border ${platform.border}`}>
            {platform.icon}
            {platform.name}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-sm ${focusColor} focus:bg-white focus:ring-4 transition-all duration-200 outline-none`}
          required
        />
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          {platform ? (
            <span className={platform.color}>{platform.icon}</span>
          ) : (
            <Link2 size={15} />
          )}
        </div>
      </div>
    </div>
  );
}
