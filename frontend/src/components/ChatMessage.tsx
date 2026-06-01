"use client";

import ReactMarkdown from "react-markdown";
import { ChatMessage } from "@/types";
import { ChevronDown, ChevronRight, Sparkles, User } from "lucide-react";
import { useState } from "react";

export default function ChatMessageComponent({ message }: { message: ChatMessage }) {
  const [showSources, setShowSources] = useState(false);

  if (message.role === "user") {
    return (
      <div className="flex justify-end items-start gap-2.5 animate-fade-in-up">
        <div className="max-w-[80%] bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-md">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
          <User size={14} className="text-blue-500" />
        </div>
      </div>
    );
  }

  const content = message.content || "";
  const hasText = content.trim().length > 0;

  return (
    <div className="flex justify-start items-start gap-2.5 animate-fade-in-up">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200/50 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Sparkles size={14} className="text-blue-600" />
      </div>
      <div className="max-w-[90%] space-y-2">
        {hasText && (
          <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-sm">
            <div className="text-sm prose prose-sm max-w-none leading-relaxed prose-p:my-1 prose-headings:text-slate-800 prose-strong:text-slate-900 prose-ul:my-1 prose-li:my-0.5 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:rounded">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="px-1">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
            >
              {showSources ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              {message.sources.length} source{message.sources.length > 1 ? "s" : ""}
            </button>
            {showSources && (
              <div className="mt-2 space-y-2">
                {message.sources.map((source, i) => (
                  <div key={i} className="text-xs p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <span className={`inline-block font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider border ${source.video === "A" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-violet-50 text-violet-600 border-violet-100"}`}>
                      Video {source.video}
                    </span>
                    <p className="mt-2 text-slate-600 leading-relaxed line-clamp-3">{source.text}</p>
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
