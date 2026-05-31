"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Zap } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <div className="flex-1 relative rounded-xl border border-zinc-200 bg-zinc-50 focus-within:bg-white focus-within:border-blue-500/50 focus-within:shadow-[0_4px_20px_rgba(59,130,246,0.04)] transition-all duration-300">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Query comparative insights..."
          rows={1}
          className="w-full px-4 py-3 bg-transparent text-zinc-800 placeholder-zinc-400 resize-none min-h-[44px] max-h-[120px] focus:outline-none text-sm leading-relaxed"
          disabled={disabled}
        />
        <div className="absolute right-3 bottom-3 text-zinc-400">
          <Zap size={12} className={disabled ? "text-zinc-300" : "text-blue-600 animate-pulse"} />
        </div>
      </div>
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="h-[44px] w-[44px] flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none transition-all duration-200 flex-shrink-0"
      >
        <Send size={16} />
      </button>
    </form>
  );
}
