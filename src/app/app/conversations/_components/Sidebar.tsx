"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { Session } from "@/types/sessionType";
import { Button } from "@/components/ui/button";
import { UserIcon } from "lucide-react";
import Image from "next/image";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InboxDirect, InboxGroup } from "@/types/chat";
import NewConversation from "./NewConversation";
import { DirectConversationList } from "./DirectConversationList";
import { GroupConversationList } from "./GroupConversationList";
import { InboxTab } from "../_hooks/use-conversations-state";

export default function Sidebar({
  directConversations,
  groupConversations,
  selected,
  onSelectDirect,
  onSelectGroup,
  onConversationCreated,
  session,
  setSelectedTab,
  selectedTab,
}: {
  directConversations: InboxDirect[];
  groupConversations: InboxGroup[];
  selected: { kind: "direct" | "group"; id: string } | null;
  onSelectDirect: (id: string) => void;
  onSelectGroup: (id: string | null) => void;
  onConversationCreated?: (conversationId: string) => void;
  session: Session;
  setSelectedTab: (tab: InboxTab) => void;
  selectedTab: InboxTab;
}) {
  const router = useRouter();
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
      <Tabs value={selectedTab} className="w-full">
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
      <NewConversation onConversationCreated={onConversationCreated} />
      <ScrollArea className="flex-1">
        {selectedTab === "conversations" ? (
          <DirectConversationList
            conversations={directConversations}
            selectedId={selected?.kind === "direct" ? selected.id : null}
            onSelect={onSelectDirect}
          />
        ) : (
          <GroupConversationList
            conversations={groupConversations}
            selectedId={selected?.kind === "group" ? selected.id : null}
            onSelect={onSelectGroup}
          />
        )}
      </ScrollArea>
      <footer className="p-4 text-center text-sm text-muted-foreground">
        Blueshot Conversations
      </footer>
    </aside>
  );
}
