import { VideoData } from "@/types";

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
    if (rate >= 5) return "text-green-500";
    if (rate >= 2) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-primary/10 text-primary">
          Video {video.id}
        </span>
        <span className={`text-lg font-bold ${getEngagementColor(video.engagement_rate)}`}>
          {video.engagement_rate}% engagement
        </span>
      </div>

      <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>

      <div className="text-sm text-muted-foreground">
        <p>{video.creator}</p>
        <p>{formatNumber(video.follower_count)} followers</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <p className="font-semibold">{formatNumber(video.views)}</p>
          <p className="text-xs text-muted-foreground">Views</p>
        </div>
        <div>
          <p className="font-semibold">{formatNumber(video.likes)}</p>
          <p className="text-xs text-muted-foreground">Likes</p>
        </div>
        <div>
          <p className="font-semibold">{formatNumber(video.comments)}</p>
          <p className="text-xs text-muted-foreground">Comments</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {video.hashtags.slice(0, 5).map((tag) => (
          <span key={tag} className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
            {tag}
          </span>
        ))}
      </div>

      <div className="text-xs text-muted-foreground flex justify-between">
        <span>{video.upload_date}</span>
        <span>{formatDuration(video.duration)}</span>
      </div>
    </div>
  );
}
