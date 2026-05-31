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
    <div className="bg-zinc-950/60 border border-white/5 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -z-10" />

      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Compare Video Analytics</h2>
        <p className="text-xs text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
          Enter two YouTube or Instagram video URLs to instantly analyze and query their performance.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider pl-1">
            Video A (YouTube/Instagram)
          </label>
          <input
            type="url"
            value={videoA}
            onChange={(e) => setVideoA(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-white/5 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider pl-1">
            Video B (YouTube/Instagram)
          </label>
          <input
            type="url"
            value={videoB}
            onChange={(e) => setVideoB(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-white/5 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
            required
          />
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs leading-relaxed">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/10 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
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
