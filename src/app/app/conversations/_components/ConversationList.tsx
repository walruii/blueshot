import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ConversationWithMetadata } from "@/types/chat";

interface ConversationListProps {
  conversations: ConversationWithMetadata[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  return (
    <ul>
      {conversations.map((c) => (
        <li
          key={c.id}
          className={cn(
            "flex items-center gap-3 p-4 cursor-pointer hover:bg-muted transition-colors",
            selectedId === c.id && "bg-muted",
          )}
          onClick={() => onSelect(c.id)}
        >
          <Avatar>
            <AvatarImage
              src={c.avatar_url || undefined}
              alt={c.name || undefined}
            />
            <AvatarFallback>{c.name?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between">
              <span className="font-semibold">{c.name}</span>
              <span className="text-xs text-muted-foreground">
                {c.last_message_at
                  ? new Date(c.last_message_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </span>
            </div>
            <span className="text-muted-foreground text-sm truncate block">
              {c.last_message_preview}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
