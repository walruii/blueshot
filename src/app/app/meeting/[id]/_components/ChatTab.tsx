"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { isMeetingDebug } from "@/lib/debug";
import { usePubSub, useMeeting } from "@/lib/videosdkWrapper";
import { getMessagesMeeting, sendMessageMeeting } from "@/server-actions/chat";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// using native div for scrollable area instead of shadcn component

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

export default function ChatTab({ meetingDbId }: { meetingDbId: string }) {
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(new Set<string>());
  const { localParticipant } = useMeeting();

  // Load persisted messages for this meeting on mount
  useEffect(() => {
    if (isMeetingDebug()) {
      const mockMsgs: ChatMessage[] = [
        {
          id: "1",
          senderId: "user-1",
          senderName: "Alice",
          message: "Welcome to debug chat",
          timestamp: "10:00 AM",
        },
        {
          id: "2",
          senderId: "user-2",
          senderName: "Bob",
          message: "Looks good!",
          timestamp: "10:01 AM",
        },
        {
          id: "2",
          senderId: "user-2",
          senderName: "Bob",
          message: "Looks good!",
          timestamp: "10:01 AM",
        },
        {
          id: "2",
          senderId: "user-2",
          senderName: "Bob",
          message: "Looks good!",
          timestamp: "10:01 AM",
        },
        {
          id: "2",
          senderId: "user-2",
          senderName: "Bob",
          message: "Looks good!",
          timestamp: "10:01 AM",
        },
        {
          id: "2",
          senderId: "user-2",
          senderName: "Bob",
          message: "Looks good!",
          timestamp: "10:01 AM",
        },
        {
          id: "2",
          senderId: "user-2",
          senderName: "Bob",
          message: "Looks good!",
          timestamp: "10:01 AM",
        },
        {
          id: "2",
          senderId: "user-2",
          senderName: "Bob",
          message: "Looks good!",
          timestamp: "10:01 AM",
        },
        {
          id: "2",
          senderId: "user-2",
          senderName: "Bob",
          message: "Looks good!",
          timestamp: "10:01 AM",
        },
        {
          id: "2",
          senderId: "user-2",
          senderName: "Bob",
          message: "Looks good!",
          timestamp: "10:01 AM",
        },
        {
          id: "2",
          senderId: "user-2",
          senderName: "Bob",
          message: "Looks good!",
          timestamp: "10:01 AM",
        },
        {
          id: "2",
          senderId: "user-2",
          senderName: "Bob",
          message: "Looks good!",
          timestamp: "10:01 AM",
        },
        {
          id: "2",
          senderId: "user-2",
          senderName: "Bob",
          message: "Looks good!",
          timestamp: "10:01 AM",
        },
        {
          id: "2",
          senderId: "user-2",
          senderName: "Bob",
          message: "Looks good!",
          timestamp: "10:01 AM",
        },
        {
          id: "2",
          senderId: "user-2",
          senderName: "Bob",
          message: "Looks good!",
          timestamp: "10:01 AM",
        },
        {
          id: "2",
          senderId: "user-2",
          senderName: "Bob",
          message: "Looks good!",
          timestamp: "10:01 AM",
        },
      ];
      setMessages(mockMsgs);
      mockMsgs.forEach((m) => messagesRef.current.add(m.id));
      return;
    }
    (async () => {
      const persisted = await getMessagesMeeting(meetingDbId, 50);
      // Map persisted messages to ChatMessage format
      const mapped = persisted.map((msg) => ({
        id: msg.id,
        senderId: msg.sender.id,
        senderName: msg.sender.name || msg.sender.email || "Unknown",
        message: msg.content,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
      setMessages(mapped);
      mapped.forEach((m) => messagesRef.current.add(m.id));
    })();
  }, []);

  // Subscribe to chat messages
  const { publish } = usePubSub("CHAT", {
    onMessageReceived: isMeetingDebug()
      ? undefined
      : (data: any) => {
          const parsedData =
            typeof data.message === "string" ? JSON.parse(data.message) : data;
          if (messagesRef.current.has(parsedData.id)) return;
          try {
            messagesRef.current.add(parsedData.id);
            const newMessage: ChatMessage = {
              id: parsedData.id,
              senderId: parsedData.senderId,
              senderName: parsedData.senderName,
              message: parsedData.message,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };
            setMessages((prev) => [...prev, newMessage]);
          } catch (error) {
            console.error("Failed to parse message:", error);
          }
        },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = useCallback(() => {
    if (isMeetingDebug()) return;
    if (!messageInput.trim() || !localParticipant || !meetingDbId) return;

    const messageKey = crypto.randomUUID();
    const messageText = messageInput.trim();
    const messageData = {
      id: messageKey,
      senderId: localParticipant.id,
      senderName: localParticipant.displayName,
      message: messageText,
    };

    try {
      // Publish message to all participants
      publish(JSON.stringify(messageData), { persist: true });

      // Persist message in DB
      sendMessageMeeting({
        meetingId: meetingDbId,
        content: messageText,
        id: messageKey,
      });

      // Immediately add our own message to avoid waiting for echo
      if (!messagesRef.current.has(messageKey)) {
        messagesRef.current.add(messageKey);

        setMessages((prev) => [
          ...prev,
          {
            id: messageKey,
            senderId: localParticipant.id,
            senderName: localParticipant.displayName,
            message: messageText,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      }

      // Clear input
      setMessageInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }, [messageInput, localParticipant, publish]);

  const isOwnMessage = useCallback(
    (senderId: string) => {
      return senderId === localParticipant?.id;
    },
    [localParticipant?.id],
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div
        ref={scrollAreaRef}
        className="flex-1 p-4 w-full overflow-y-auto overflow-x-hidden"
      >
        <div className="space-y-3 w-full">
          {messages.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {isOwnMessage(msg.senderId) ? "You" : msg.senderName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {msg.timestamp}
                  </span>
                </div>
                <p
                  className={`text-sm p-2 rounded ${
                    isOwnMessage(msg.senderId)
                      ? "bg-primary/10 text-foreground ml-auto max-w-[80%]"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.message}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-t border-border p-3 flex gap-2 shrink-0">
        <Input
          placeholder="Type message..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyUp={(e) => e.key === "Enter" && handleSendMessage()}
          className="h-8 text-sm"
        />
        <Button
          size="sm"
          onClick={handleSendMessage}
          className="h-8 w-8 p-0"
          disabled={!messageInput.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
