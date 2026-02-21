"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { MessageWithSender } from "@/types/chat";

interface MessageItemProps {
  message: MessageWithSender;
  isGrouped?: boolean;
}

export function MessageItem({ message, isGrouped }: MessageItemProps) {
  const { user } = useAuth();
  const isOwn = message.sender_id === user?.id;

  return (
    <div
      className={cn(
        "flex gap-2",
        isOwn ? "flex-row-reverse" : "flex-row",
        isGrouped && "mt-1",
      )}
    >
      {!isOwn && !isGrouped && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.sender.image || ""} />
          <AvatarFallback>{message.sender.name[0]}</AvatarFallback>
        </Avatar>
      )}

      {!isOwn && isGrouped && <div className="w-8" />}

      <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
        {!isGrouped && !isOwn && (
          <span className="text-sm font-medium mb-1">
            {message.sender.name}
          </span>
        )}

        <div
          className={cn(
            "rounded-lg px-3 py-2 max-w-md",
            isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
          )}
        >
          {message.reply_to_message && (
            <div className="text-xs opacity-70 mb-1 border-l-2 pl-2">
              Reply to: {message.reply_to_message.content.slice(0, 50)}
            </div>
          )}

          <p className="whitespace-pre-wrap break-words">{message.content}</p>

          {message.edited_at && (
            <span className="text-xs opacity-70">(edited)</span>
          )}
        </div>

        <span className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(message.created_at), {
            addSuffix: true,
          })}
        </span>
      </div>
    </div>
  );
}
