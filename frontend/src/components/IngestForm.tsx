"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { ingestVideos } from "@/lib/api";

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

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-xl space-y-6 relative overflow-hidden">
      {/* Background soft pastel glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-100/30 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-100/30 rounded-full blur-3xl -z-10" />

      <div className="text-center space-y-2">
        <h2 className="text-xl font-black text-zinc-800 tracking-tight">Compare Video Analytics</h2>
        <p className="text-xs text-zinc-500 max-w-[280px] mx-auto leading-relaxed font-medium">
          Enter two YouTube or Instagram video URLs to instantly analyze and query their performance.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
            Video A (YouTube/Instagram)
          </label>
          <input
            type="url"
            value={videoA}
            onChange={(e) => setVideoA(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder-zinc-400 text-sm focus:outline-none focus:bg-white focus:border-blue-500/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.02)] transition-all duration-200"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
            Video B (YouTube/Instagram)
          </label>
          <input
            type="url"
            value={videoB}
            onChange={(e) => setVideoB(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder-zinc-400 text-sm focus:outline-none focus:bg-white focus:border-indigo-500/50 focus:shadow-[0_0_15px_rgba(99,102,241,0.02)] transition-all duration-200"
            required
          />
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs leading-relaxed font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/10 hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Ingesting Video Transcripts...
            </span>
          ) : (
            "Analyze & Compare"
          )}
        </button>
      </form>
    </div>
  );
}
