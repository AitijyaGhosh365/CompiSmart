import { create } from "zustand";
import { VideoData, ChatMessage } from "@/types";

interface AppState {
  sessionId: string | null;
  setSessionId: (id: string) => void;

  videoA: VideoData | null;
  videoB: VideoData | null;
  setVideos: (a: VideoData, b: VideoData) => void;

  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  updateStreamingMessage: (content: string) => void;
  setStreamingSources: (sources: Source[]) => void;
  clearChat: () => void;

  isLoading: boolean;
  isStreaming: boolean;
  setLoading: (v: boolean) => void;
  setStreaming: (v: boolean) => void;
}

import { Source } from "@/types";

export const useStore = create<AppState>((set) => ({
  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),

  videoA: null,
  videoB: null,
  setVideos: (a, b) => set({ videoA: a, videoB: b }),

  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  updateStreamingMessage: (content) =>
    set((state) => {
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === "assistant") {
        last.content += content;
      } else {
        msgs.push({ role: "assistant", content, timestamp: Date.now() });
      }
      return { messages: msgs };
    }),
  setStreamingSources: (sources) =>
    set((state) => {
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === "assistant") {
        last.sources = sources;
      }
      return { messages: msgs };
    }),
  clearChat: () => set({ messages: [] }),

  isLoading: false,
  isStreaming: false,
  setLoading: (v) => set({ isLoading: v }),
  setStreaming: (v) => set({ isStreaming: v }),
}));
