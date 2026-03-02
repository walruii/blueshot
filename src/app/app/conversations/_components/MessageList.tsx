import { cn } from "@/lib/utils";
import { MessageWithSender } from "@/types/chat";

interface MessageListProps {
  messages: MessageWithSender[];
  currentUserId: string;
  isLoadingOlder?: boolean;
  hasMoreBefore?: boolean;
  isInitialized?: boolean;
}

export function MessageList({
  messages,
  currentUserId,
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
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "flex",
            msg.sender.id === currentUserId ? "justify-end" : "justify-start",
          )}
        >
          <div
            className={cn(
              "px-4 py-2 rounded-lg max-w-xs",
              msg.sender.id === currentUserId
                ? "bg-green-600 text-white dark:bg-green-500"
                : "bg-card border border-border text-foreground",
            )}
          >
            <div className="text-sm">{msg.content}</div>
            <div
              className={cn(
                "text-xs mt-1",
                msg.sender.id === currentUserId
                  ? "text-white/70"
                  : "text-muted-foreground",
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
      ))}
    </div>
  );
}
