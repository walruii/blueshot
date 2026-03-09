import { cn } from "@/lib/utils";
import { MessageWithSender } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MessageListProps {
  messages: MessageWithSender[];
  currentUserId: string;
  isGroupChat?: boolean;
  isLoadingOlder?: boolean;
  hasMoreBefore?: boolean;
  isInitialized?: boolean;
}

export function MessageList({
  messages,
  currentUserId,
  isGroupChat = false,
  isLoadingOlder = false,
  hasMoreBefore = false,
}: MessageListProps) {
  return (
    <div className="flex flex-col gap-2">
      {hasMoreBefore && (
        <div className="py-2 text-center text-sm text-muted-foreground">
          {isLoadingOlder ? "Loading older messages…" : "\u00a0"}
        </div>
      )}
      {messages.map((msg) => {
        const isOwnMessage = msg.sender.id === currentUserId;
        const showSenderInfo = isGroupChat && !isOwnMessage;

        return (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2",
              isOwnMessage ? "justify-end" : "justify-start",
            )}
          >
            {showSenderInfo && (
              <Avatar className="h-8 w-8 mt-1 shrink-0">
                {msg.sender.image && (
                  <AvatarImage
                    src={msg.sender.image}
                    alt={msg.sender.name || "User"}
                  />
                )}
                <AvatarFallback>
                  {(msg.sender.name ||
                    msg.sender.email ||
                    "?")[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex flex-col gap-1 max-w-xs">
              {showSenderInfo && (
                <span className="text-xs font-medium text-muted-foreground px-1">
                  {msg.sender.name || msg.sender.email || "Unknown"}
                </span>
              )}
              <div
                className={cn(
                  "px-4 py-2 rounded-lg",
                  isOwnMessage
                    ? "bg-green-600 text-white dark:bg-green-500"
                    : "bg-card border border-border text-foreground",
                )}
              >
                <div className="text-sm">{msg.content}</div>
                <div
                  className={cn(
                    "text-xs mt-1",
                    isOwnMessage ? "text-white/70" : "text-muted-foreground",
                  )}
                >
                  {msg.created_at
                    ? new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
