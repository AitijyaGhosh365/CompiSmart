"use client";

import ReactMarkdown from "react-markdown";
import { ChatMessage } from "@/types";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function ChatMessageComponent({ message }: { message: ChatMessage }) {
  const [showSources, setShowSources] = useState(false);

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-lg border border-blue-500/20">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] space-y-2">
        <div className="bg-zinc-900/60 border border-white/5 backdrop-blur-md text-zinc-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-xl">
          <div className="text-sm prose prose-sm dark:prose-invert max-w-none leading-relaxed prose-p:my-1 prose-headings:text-zinc-100 prose-strong:text-zinc-100 prose-ul:my-1 prose-li:my-0.5">
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="px-2">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showSources ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              Sources ({message.sources.length})
            </button>
            {showSources && (
              <div className="mt-2 space-y-2 transition-all duration-300">
                {message.sources.map((source, i) => (
                  <div key={i} className="text-xs p-3 rounded-xl bg-zinc-950/80 border border-white/5">
                    <span className={`font-semibold px-2 py-0.5 rounded text-[10px] uppercase border ${
                      source.video === "A" 
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                        : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                    }`}>
                      Video {source.video}
                    </span>
                    <p className="mt-2 text-zinc-400 leading-relaxed font-sans">{source.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
