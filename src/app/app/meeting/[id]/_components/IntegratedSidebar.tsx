"use client";
import { useState } from "react";
import {
  MessageSquare,
  FileText,
  Sparkles,
  Users,
  Send,
  Check,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

// Sample chat messages
const SAMPLE_MESSAGES = [
  { id: 1, sender: "You", message: "Hi everyone!", timestamp: "10:00" },
  {
    id: 2,
    sender: "John",
    message: "Hello! Nice to see you all",
    timestamp: "10:01",
  },
  {
    id: 3,
    sender: "Sarah",
    message: "Let's discuss the project",
    timestamp: "10:02",
  },
  { id: 4, sender: "You", message: "Sounds good!", timestamp: "10:03" },
];

// Sample transcript entries
const SAMPLE_TRANSCRIPT = [
  { time: "10:00", speaker: "You", text: "Hi everyone!" },
  { time: "10:01", speaker: "John", text: "Hello! Nice to see you all" },
  {
    time: "10:02",
    speaker: "Sarah",
    text: "Let's discuss the project details and timeline",
  },
  { time: "10:03", speaker: "You", text: "Sounds good! When should we start?" },
  { time: "10:04", speaker: "John", text: "We can begin next week" },
];

// Sample action items
const SAMPLE_ACTION_ITEMS = [
  { id: 1, text: "Follow up on project requirements", completed: false },
  { id: 2, text: "Schedule next meeting", completed: true },
  { id: 3, text: "Send project proposal draft", completed: false },
  { id: 4, text: "Review budget allocation", completed: false },
];

interface ActionItem {
  id: number;
  text: string;
  completed: boolean;
}

export default function IntegratedSidebar() {
  const [messages, setMessages] = useState(SAMPLE_MESSAGES);
  const [messageInput, setMessageInput] = useState("");
  const [actionItems, setActionItems] =
    useState<ActionItem[]>(SAMPLE_ACTION_ITEMS);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      sender: "You",
      message: messageInput,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, newMessage]);
    setMessageInput("");
  };

  const toggleActionItem = (id: number) => {
    setActionItems(
      actionItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  return (
    <div className="hidden lg:flex w-80 h-full border-l border-border bg-card flex-col">
      <Tabs defaultValue="chat" className="flex flex-col h-full">
        {/* Tabs Header */}
        <div className="border-b border-border p-2">
          <TabsList className="w-full grid grid-cols-4 h-9">
            <TabsTrigger value="chat" className="gap-1 text-xs" title="Chat">
              <MessageSquare className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger
              value="transcript"
              className="gap-1 text-xs"
              title="Transcript"
            >
              <FileText className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="gap-1 text-xs"
              title="Smart Notes"
            >
              <Sparkles className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger
              value="participants"
              className="gap-1 text-xs"
              title="Participants"
            >
              <Users className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{msg.sender}</span>
                    <span className="text-xs text-muted-foreground">
                      {msg.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-foreground bg-muted p-2 rounded">
                    {msg.message}
                  </p>
                </div>
              ))}
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
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        {/* Transcript Tab */}
        <TabsContent value="transcript" className="flex-1 m-0 p-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {SAMPLE_TRANSCRIPT.map((entry, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="text-xs font-mono text-muted-foreground min-w-12">
                    {entry.time}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">
                      {entry.speaker}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {entry.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Smart Notes Tab */}
        <TabsContent value="notes" className="flex-1 m-0 p-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold mb-3">Action Items</h3>
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleActionItem(item.id)}
                    className="mt-0.5"
                  />
                  <span
                    className={`text-sm flex-1 ${
                      item.completed
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {item.text}
                  </span>
                  {item.completed && (
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="flex-1 m-0 p-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold">
                  Y
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">You</p>
                  <p className="text-xs text-muted-foreground">Host</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold text-white">
                  J
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">John</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-sm font-bold text-white">
                  S
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sarah</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
