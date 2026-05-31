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
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Ingest videos to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((msg, i) => (
          <ChatMessageComponent key={i} message={msg} />
        ))}
        {isStreaming && messages[messages.length - 1]?.role === "assistant" && (
          <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t p-3">
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
