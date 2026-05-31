"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { streamChat } from "@/lib/api";
import ChatMessageComponent from "./ChatMessage";
import ChatInput from "./ChatInput";

export default function ChatPanel() {
  const { sessionId, messages, addMessage, updateStreamingMessage, setStreamingSources, isStreaming, setStreaming } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (message: string) => {
    if (!sessionId) return;

    addMessage({ role: "user", content: message, timestamp: Date.now() });
    addMessage({ role: "assistant", content: "", timestamp: Date.now() });
    setStreaming(true);

    try {
      await streamChat(
        sessionId,
        message,
        (chunk) => updateStreamingMessage(chunk),
        (sources) => setStreamingSources(sources),
        () => setStreaming(false)
      );
    } catch (err) {
      updateStreamingMessage("\n\n*Error: Failed to get response*");
      setStreaming(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-3 p-6 bg-zinc-950/20 rounded-2xl border border-white/5 backdrop-blur-xl">
        <span className="text-4xl animate-bounce">💬</span>
        <p className="text-sm font-medium tracking-wide">Ingest videos to unlock RAG chat panel</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950/40 border border-white/5 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="p-4 border-b border-white/5 bg-zinc-900/40 backdrop-blur-md flex items-center justify-between flex-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-zinc-200 tracking-wider uppercase">
            CompiSmart Co-Pilot
          </span>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">
          RAG Engine: Active
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 scrollbar-thin scrollbar-thumb-white/10">
        {messages.map((msg, i) => (
          <ChatMessageComponent key={i} message={msg} />
        ))}
        {isStreaming && messages[messages.length - 1]?.role === "assistant" && (
          <div className="flex justify-start pl-4">
            <span className="inline-block w-2.5 h-4 bg-blue-500/80 animate-pulse rounded-sm" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <div className="border-t border-white/5 p-4 bg-zinc-900/30 flex-none">
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
