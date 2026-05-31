"use client";

import ReactMarkdown from "react-markdown";
import { ChatMessage } from "@/types";
import { ChevronDown, ChevronRight, Sparkles, User } from "lucide-react";
import { useState } from "react";

export default function ChatMessageComponent({ message }: { message: ChatMessage }) {
  const [showSources, setShowSources] = useState(false);

  if (message.role === "user") {
    return (
      <div className="flex justify-end items-start gap-2.5">
        <div className="max-w-[80%] bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-md border border-indigo-500/10">
          <p className="text-sm whitespace-pre-wrap leading-relaxed font-sans font-medium">{message.content}</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
          <User size={14} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start items-start gap-2.5">
      <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0 animate-pulse">
        <Sparkles size={14} />
      </div>
      <div className="max-w-[90%] space-y-2">
        <div className="bg-white border border-zinc-200/80 text-zinc-800 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
          <div className="text-sm prose prose-sm max-w-none leading-relaxed prose-p:my-1 prose-headings:text-zinc-800 prose-strong:text-zinc-900 prose-ul:my-1 prose-li:my-0.5 prose-code:text-blue-600">
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="px-2">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 font-semibold transition-colors"
            >
              {showSources ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              Citations ({message.sources.length})
            </button>
            {showSources && (
              <div className="mt-2 space-y-2 transition-all duration-300">
                {message.sources.map((source, i) => (
                  <div key={i} className="text-xs p-3 rounded-xl bg-white border border-zinc-200 shadow-sm">
                    <span className={`font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider border ${
                      source.video === "A" 
                        ? "bg-blue-50 text-blue-600 border-blue-100" 
                        : "bg-violet-50 text-violet-600 border-violet-100"
                    }`}>
                      Source {source.video}
                    </span>
                    <p className="mt-2 text-zinc-600 leading-relaxed font-sans">{source.text}</p>
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
