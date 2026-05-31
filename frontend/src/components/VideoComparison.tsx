"use client";

import { useStore } from "@/lib/store";
import VideoCard from "./VideoCard";

export default function VideoComparison() {
  const { videoA, videoB } = useStore();

  if (!videoA || !videoB) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <VideoCard video={videoA} />
      <VideoCard video={videoB} />
    </div>
  );
}
