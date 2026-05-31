import ReactMarkdown from "react-markdown";
import { ChatMessage } from "@/types";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function ChatMessageComponent({ message }: { message: ChatMessage }) {
  const [showSources, setShowSources] = useState(false);

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-primary text-primary-foreground rounded-lg px-4 py-2">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] space-y-2">
        <div className="bg-muted rounded-lg px-4 py-3">
          <ReactMarkdown className="text-sm prose prose-sm dark:prose-invert max-w-none">
            {message.content}
          </ReactMarkdown>
        </div>
        {message.sources && message.sources.length > 0 && (
          <div>
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {showSources ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              Sources ({message.sources.length})
            </button>
            {showSources && (
              <div className="mt-1 space-y-1">
                {message.sources.map((source, i) => (
                  <div key={i} className="text-xs p-2 rounded bg-background border">
                    <span className="font-semibold text-primary">Video {source.video}</span>
                    <p className="mt-1 text-muted-foreground line-clamp-2">{source.text}</p>
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
