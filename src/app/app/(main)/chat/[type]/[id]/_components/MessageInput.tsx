"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendMessage } from "@/server-actions/chat";
import { Send } from "lucide-react";
import type { MessageWithSender } from "@/types/chat";

interface MessageInputProps {
  conversationId: string;
  replyToMessage?: MessageWithSender | null;
  onCancelReply?: () => void;
}

export function MessageInput({
  conversationId,
  replyToMessage,
  onCancelReply,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSend() {
    if (!content.trim() || sending) return;

    setSending(true);
    const result = await sendMessage(conversationId, content.trim(), {
      replyToId: replyToMessage?.id,
    });

    if (result.success) {
      setContent("");
      onCancelReply?.();
      textareaRef.current?.focus();
    } else {
      alert("Failed to send: " + result.error);
    }

    setSending(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t p-4">
      {replyToMessage && (
        <div className="mb-2 text-sm bg-muted rounded p-2 flex justify-between">
          <span>Replying to: {replyToMessage.content.slice(0, 50)}</span>
          <Button variant="ghost" size="sm" onClick={onCancelReply}>
            ✕
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[40px] max-h-[120px] resize-none"
          disabled={sending}
        />

        <Button
          onClick={handleSend}
          disabled={!content.trim() || sending}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
