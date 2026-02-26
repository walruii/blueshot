"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePubSub, useMeeting } from "@videosdk.live/react-sdk";
import {
  getMessagesFirstPage,
  sendMessage as persistMessage,
} from "@/server-actions/chat";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

export default function ChatTab() {
  // ...existing code...
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(new Set<string>());
  const { localParticipant, meetingId } = useMeeting();

  // Load persisted messages for this meeting on mount
  useEffect(() => {
    if (!meetingId) return;
    (async () => {
      const persisted = await getMessagesFirstPage(
        "meeting:" + meetingId,
        50,
        meetingId,
      );
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
  }, [meetingId]);

  // Subscribe to chat messages
  const { publish } = usePubSub("CHAT", {
    onMessageReceived: (data: any) => {
      try {
        const parsedData =
          typeof data.message === "string"
            ? JSON.parse(data.message)
            : data.message;

        // Use a composite key to prevent duplicates
        const messageKey = `${parsedData.senderId}-${parsedData.message}-${data.timestamp || Date.now()}`;

        // Skip if we've already seen this message
        if (messagesRef.current.has(messageKey)) {
          return;
        }

        messagesRef.current.add(messageKey);

        const newMessage: ChatMessage = {
          id: messageKey,
          senderId: parsedData.senderId,
          senderName: parsedData.senderName,
          message: parsedData.message,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setMessages((prev) => [...prev, newMessage]);

        // Persist received message if not already in DB
        if (meetingId && parsedData.senderId && parsedData.message) {
          persistMessage({
            conversationId: "meeting:" + meetingId,
            content: parsedData.message,
            id: messageKey,
            meetingId,
          });
        }
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = useCallback(() => {
    if (!messageInput.trim() || !localParticipant || !meetingId) return;

    const messageText = messageInput.trim();
    const messageData = {
      senderId: localParticipant.id,
      senderName: localParticipant.displayName,
      message: messageText,
    };

    try {
      // Publish message to all participants
      publish(JSON.stringify(messageData), { persist: true });

      // Persist message in DB
      const messageKey = `${localParticipant.id}-${messageText}-${Date.now()}`;
      persistMessage({
        conversationId: "meeting:" + meetingId,
        content: messageText,
        id: messageKey,
        meetingId,
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
  }, [messageInput, localParticipant, meetingId, publish]);

  const isOwnMessage = useCallback(
    (senderId: string) => {
      return senderId === localParticipant?.id;
    },
    [localParticipant?.id],
  );

  return (
    <div className="flex-1 flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-3">
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
      </ScrollArea>

      <div className="border-t border-border p-3 flex gap-2">
        <Input
          placeholder="Type message..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
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
