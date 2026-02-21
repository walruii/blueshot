"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageItem } from "./MessageItem";
import LoadingCircle from "@/svgs/LoadingCircle";
import type { MessageWithSender } from "@/types/chat";

interface MessageListProps {
  messages: MessageWithSender[];
  loading: boolean;
}

export function MessageList({ messages, loading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingCircle />
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          const isGrouped = prevMessage?.sender_id === message.sender_id;

          return (
            <MessageItem
              key={message.id}
              message={message}
              isGrouped={isGrouped}
            />
          );
        })}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
}
