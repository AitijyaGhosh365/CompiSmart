"use client";

import { useStore } from "@/lib/store";
import IngestForm from "@/components/IngestForm";
import VideoComparison from "@/components/VideoComparison";
import ChatPanel from "@/components/ChatPanel";

export default function Home() {
  const { sessionId } = useStore();

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <h1 className="text-xl font-bold">CompiSmart Video Analyzer</h1>
        <p className="text-sm text-muted-foreground">Compare video engagement with AI-powered RAG</p>
      </header>

      <div className="p-6">
        {!sessionId && (
          <div className="max-w-md mx-auto mb-8">
            <IngestForm />
          </div>
        )}

        {sessionId && (
          <div className="mb-6">
            <VideoComparison />
          </div>
        )}

        <div className="border rounded-lg h-[500px]">
          <ChatPanel />
        </div>
      </div>
    </main>
  );
}
