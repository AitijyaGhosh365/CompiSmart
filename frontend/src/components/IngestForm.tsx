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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">YouTube Video A</label>
        <input
          type="text"
          value={videoA}
          onChange={(e) => setVideoA(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full px-3 py-2 border rounded-md bg-background"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">YouTube Video B</label>
        <input
          type="text"
          value={videoB}
          onChange={(e) => setVideoB(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full px-3 py-2 border rounded-md bg-background"
          required
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
      >
        {isLoading ? "Processing..." : "Analyze Videos"}
      </button>
    </form>
  );
}
