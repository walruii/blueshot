"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { InboxGroup } from "@/types/chat";

export function GroupConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: InboxGroup[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const safe = conversations.filter((c) => typeof c.id === "string" && !!c.id);

  return (
    <ul>
      {safe.map((c) => {
        const displayName = c.name ?? "Group";
        const displayImage = c.avatar_url ?? undefined;
        return (
          <li
            key={c.id}
            className={cn(
              "flex items-center gap-3 p-4 cursor-pointer hover:bg-muted transition-colors",
              selectedId === c.id && "bg-muted",
            )}
            onClick={() => onSelect(c.id)}
          >
            <Avatar>
              <AvatarImage src={displayImage} alt={displayName} />
              <AvatarFallback>{displayName[0] ?? "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-semibold">{displayName}</span>
                <span className="text-xs text-muted-foreground">
                  {c.last_message_at
                    ? new Date(c.last_message_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

