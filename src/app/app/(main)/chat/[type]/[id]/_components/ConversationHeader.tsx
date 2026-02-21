"use client";

import type { ConversationWithMetadata } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MeetingModeBadge } from "./MeetingModeBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface ConversationHeaderProps {
  conversation: ConversationWithMetadata;
}

export function ConversationHeader({ conversation }: ConversationHeaderProps) {
  return (
    <div className="flex items-center gap-3 p-4 border-b">
      <Avatar>
        <AvatarImage src={conversation.avatar_url || ""} />
        <AvatarFallback>{conversation.name?.[0] || "?"}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <h2 className="font-semibold">{conversation.name || "Chat"}</h2>
        <p className="text-sm text-muted-foreground">
          {conversation.participant_count} members
        </p>
      </div>

      {conversation.type === "event" && (
        <MeetingModeBadge eventId={conversation.event_id!} />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>View participants</DropdownMenuItem>
          <DropdownMenuItem>
            {conversation.is_muted ? "Unmute" : "Mute"} notifications
          </DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          {conversation.type === "direct" && (
            <DropdownMenuItem className="text-destructive">
              Delete conversation
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
