"use client";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { summarizeMeetingContent } from "@/server-actions/meeting-transcriptions";

export default function AiTab({ meetingDbId }: { meetingDbId: string }) {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setErrorMessage(null);

    try {
      const result = await summarizeMeetingContent(meetingDbId);
      if (!result.success) {
        setErrorMessage(result.error ?? "Failed to summarize meeting");
        return;
      }

      setSummary(result.data?.summary ?? "No summary generated.");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-3">
        <h3 className="text-sm font-bold mb-5">Actions</h3>
        <Button
          variant="secondary"
          size="lg"
          onClick={handleSummarize}
          disabled={isSummarizing}
          className="gap-2 w-full"
        >
          {isSummarizing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Summarizing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Summarize Meeting
            </>
          )}
        </Button>

        {errorMessage && (
          <p className="text-xs text-red-400">Error: {errorMessage}</p>
        )}

        {summary && (
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
              Meeting Summary
            </h4>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {summary}
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
