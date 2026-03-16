"use client";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export default function AiTab({ meetingDbId }: { meetingDbId: string }) {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const handleSummarize = async () => {
    setIsSummarizing(true);
    // TODO: Implement AI summarization API call
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Demo delay
    setIsSummarizing(false);
  };
  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-3">
        <h3 className="text-sm font-bold mb-5">Actions</h3>
        {/* Summarize Button */}
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
      </div>
    </ScrollArea>
  );
}
