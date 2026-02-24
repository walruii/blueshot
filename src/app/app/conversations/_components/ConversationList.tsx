import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { InboxDirect, InboxGroup } from "@/types/chat";

interface ConversationListProps {
  conversations: InboxDirect[] | InboxGroup[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  variant: "direct" | "group";
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
              src={
                // For direct conversations, show the partner's avatar; for groups, the conversation avatar.
                ("partner_image" in c ? c.partner_image : c.avatar_url) ||
                undefined
              }
              alt={
                ("partner_name" in c ? c.partner_name : c.name) || undefined
              }
            />
            <AvatarFallback>
              {("partner_name" in c ? c.partner_name : c.name)?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between">
              <span className="font-semibold">
                {"partner_name" in c ? c.partner_name : c.name}
              </span>
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
      ))}
    </ul>
  );
}
