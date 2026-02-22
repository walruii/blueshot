import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: MessageWithSender[];
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  return (
    <div className="flex flex-col gap-2">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "flex",
            msg.sender_id === currentUserId ? "justify-end" : "justify-start",
          )}
        >
          <div
            className={cn(
              "px-4 py-2 rounded-lg max-w-xs",
              msg.sender_id === currentUserId
                ? "bg-green-600 text-white dark:bg-green-500"
                : "bg-card border border-border text-foreground",
            )}
          >
            <div className="text-sm">{msg.content}</div>
            <div className="text-xs text-muted-foreground mt-1">
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
