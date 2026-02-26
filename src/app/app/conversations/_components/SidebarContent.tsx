"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Session } from "@/types/sessionType";
import { InboxDirect, InboxGroup, InboxItem } from "@/types/chat";
import NewConversation from "./NewConversation";
import { DirectConversationList } from "./DirectConversationList";
import { GroupConversationList } from "./GroupConversationList";
import SidebarHeader from "./SidebarHeader";
import SidebarTabs, { ConversationTab } from "./SidebarTabs";

export interface SidebarContentProps {
  directConversations: InboxDirect[];
  groupConversations: InboxGroup[];
  session: Session;
  selectedTab: ConversationTab;
  setSelectedTab: (tab: ConversationTab) => void;
  selected: InboxItem | null;
  onSelectDirect: (id: string | null) => void;
  onSelectGroup: (id: string | null) => void;
  onGoBack: () => void;
  onClose?: () => void;
}

export default function SidebarContent({
  directConversations,
  groupConversations,
  session,
  selectedTab,
  setSelectedTab,
  selected,
  onSelectDirect,
  onSelectGroup,
  onGoBack,
  onClose,
}: SidebarContentProps) {
  return (
    <>
      <SidebarHeader session={session} onGoBack={onGoBack} onClose={onClose} />

      <SidebarTabs value={selectedTab} onChange={setSelectedTab} />
      <NewConversation />
      <ScrollArea className="flex-1">
        {selectedTab === "conversations" ? (
          <DirectConversationList
            conversations={directConversations}
            selectedId={selected?.type === "direct" ? selected.id : null}
            onSelect={onSelectDirect}
          />
        ) : (
          <GroupConversationList
            conversations={groupConversations}
            selectedId={
              selected && selected?.type !== "direct" ? selected.id : null
            }
            onSelect={onSelectGroup}
          />
        )}
      </ScrollArea>
      <footer className="p-4 text-center text-sm text-muted-foreground">
        Blueshot Conversations
      </footer>
    </>
  );
}
