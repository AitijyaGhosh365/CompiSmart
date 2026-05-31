const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function ingestVideos(videoA: string, videoB: string) {
  const res = await fetch(`${API_URL}/api/videos/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ video_a: videoA, video_b: videoB }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to ingest videos");
  }

  return res.json();
}

export async function streamChat(
  sessionId: string,
  message: string,
  onChunk: (text: string) => void,
  onSources: (sources: any[]) => void,
  onDone: () => void
) {
  const res = await fetch(`${API_URL}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message }),
  });

  if (!res.ok) {
    throw new Error("Chat request failed");
  }

  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const json = JSON.parse(line.slice(6));
            if (json.type === "chunk") onChunk(json.content);
            if (json.type === "sources") onSources(json.sources);
            if (json.type === "done") onDone();
          } catch {
            continue;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
