"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationList } from "./ConversationList";
import { useRouter } from "next/navigation";
import { Session } from "@/types/sessionType";
import { Button } from "@/components/ui/button";
import { UserIcon } from "lucide-react";
import Image from "next/image";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InboxDirect, InboxGroup } from "@/types/chat";
import { useState } from "react";

export default function Sidebar({
  directConversations,
  groupConversations,
  selectedId,
  onSelect,
  session,
}: {
  directConversations: InboxDirect[];
  groupConversations: InboxGroup[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  session: Session;
}) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("conversations");
  return (
    <aside className="w-80 bg-card border-r border-border flex flex-col">
      <header className="p-4 border-b border-border flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="flex justify-center items-center rounded-full overflow-clip h-10 w-10 bg-muted shrink-0">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name}
                width={100}
                height={100}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon />
            )}
          </div>
          <span className="font-bold text-lg text-blue-800">Blueshot</span>
        </div>
        <Button
          className="bg-muted hover:bg-accent text-sm font-medium border border-border transition-colors"
          onClick={() => router.push("/app")}
          type="button"
        >
          Go Back
        </Button>
      </header>
      <Tabs defaultValue={selectedTab} className="w-full">
        <TabsList className="bg-transparent border-b border-border w-full">
          <TabsTrigger
            value="conversations"
            className="data-[state=active]:border-blue-500 data-[state=active]:border-b-2 text-sm font-medium text-muted-foreground"
            onClick={() => setSelectedTab("conversations")}
          >
            Conversations
          </TabsTrigger>
          <TabsTrigger
            value="groups"
            className="data-[state=active]:border-blue-500 data-[state=active]:border-b-2 text-sm font-medium text-muted-foreground"
            onClick={() => setSelectedTab("groups")}
          >
            Groups
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Button
        className="w-full rounded-none bg-muted hover:bg-accent text-sm font-medium border-t border-border transition-colors h-10"
        onClick={() => router.push("/app/conversations/new")}
        type="button"
      >
        + New Conversation
      </Button>
      <ScrollArea className="flex-1">
        {selectedTab === "conversations" ? (
          <ConversationList
            conversations={directConversations}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ) : (
          <ConversationList
            conversations={groupConversations}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        )}
      </ScrollArea>
      <footer className="p-4 text-center text-sm text-muted-foreground">
        Blueshot Conversations
      </footer>
    </aside>
  );
}
