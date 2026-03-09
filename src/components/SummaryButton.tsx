"use client";

import { useState } from "react";
import { Sparkles, X, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { useAlert } from "@/components/AlertProvider";
import { summarizeChatAction } from "@/server-actions/summarizeChat";
import { SummaryData } from "@/types/chatSummary";
import { formatDistanceToNow } from "date-fns";

interface SummaryButtonProps {
  conversationId?: string;
  meetingId?: string;
  className?: string;
}

export default function SummaryButton({
  conversationId,
  meetingId,
  className,
}: SummaryButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const { showAlert } = useAlert();

  // Validate that exactly one ID is provided
  if (!conversationId && !meetingId) {
    console.error("SummaryButton requires either conversationId or meetingId");
    return null;
  }

  if (conversationId && meetingId) {
    console.error(
      "SummaryButton cannot have both conversationId and meetingId",
    );
    return null;
  }

  const handleSummarize = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const request = conversationId
        ? { type: "conversation" as const, id: conversationId }
        : { type: "meeting" as const, id: meetingId! };

      const result = await summarizeChatAction(request);

      if (!result.success) {
        showAlert({
          type: "error",
          title: "Failed to Generate Summary",
          description: result.error,
        });
        return;
      }

      if (!result.data) {
        showAlert({
          type: "error",
          title: "Failed to Generate Summary",
          description: "No summary data received.",
        });
        return;
      }

      setSummary(result.data);
      showAlert({
        type: "success",
        title: "Summary Generated",
        description: `Summarized ${result.data.messageCount} message${result.data.messageCount !== 1 ? "s" : ""}.`,
      });
    } catch (error) {
      console.error("Error generating summary:", error);
      showAlert({
        type: "error",
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSummary(null);
  };

  return (
    <div className={className}>
      <Button
        onClick={handleSummarize}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="gap-1.5"
      >
        <Sparkles className="size-3.5" />
        {isLoading ? "Generating..." : "Summarize Chat"}
      </Button>

      {summary && (
        <Card
          size="sm"
          className="animate-in fade-in-50 slide-in-from-top-2 duration-300 mt-3"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Chat Summary
            </CardTitle>
            <CardDescription className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <MessageSquare className="size-3" />
                {summary.messageCount} message
                {summary.messageCount !== 1 ? "s" : ""}{" "}
                {summary.isNewSummary ? "summarized" : "updated"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {formatDistanceToNow(new Date(summary.updatedAt), {
                  addSuffix: true,
                })}
              </span>
            </CardDescription>
            <CardAction>
              <Button
                onClick={handleClose}
                variant="ghost"
                size="icon-xs"
                className="size-5"
                aria-label="Close summary"
              >
                <X className="size-3" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {summary.summary}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
