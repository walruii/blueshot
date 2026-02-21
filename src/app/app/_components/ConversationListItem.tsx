"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ConversationWithMetadata } from "@/types/chat";

interface ConversationListItemProps {
  conversation: ConversationWithMetadata;
}

export function ConversationListItem({
  conversation,
}: ConversationListItemProps) {
  const route = `/app/chat/${conversation.type}/${
    conversation.type === "direct" && !conversation.name
      ? conversation.id
      : conversation.id
  }`;

  return (
    <Link href={route} className={cn("block p-4 hover:bg-muted rounded")}>
      <div className="flex justify-between items-center">
        <span className="font-medium">
          {conversation.name || "Direct Chat"}
        </span>
        {conversation.unread_count > 0 && (
          <span className="ml-2 text-xs bg-primary text-primary-foreground rounded-full px-2">
            {conversation.unread_count}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground truncate">
        {conversation.last_message_preview || "No messages yet"}
      </p>
    </Link>
  );
}
