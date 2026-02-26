"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type ConversationTab = "conversations" | "groups";

interface SidebarTabsProps {
  value: ConversationTab;
  onChange: (val: ConversationTab) => void;
}

export default function SidebarTabs({ value, onChange }: SidebarTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(val) => onChange(val as ConversationTab)}
      className="w-full"
    >
      <TabsList className="bg-transparent border-b border-border w-full">
        <TabsTrigger
          value="conversations"
          className="data-[state=active]:border-blue-500 data-[state=active]:border-b-2 text-sm font-medium text-muted-foreground"
        >
          Conversations
        </TabsTrigger>
        <TabsTrigger
          value="groups"
          className="data-[state=active]:border-blue-500 data-[state=active]:border-b-2 text-sm font-medium text-muted-foreground"
        >
          Groups
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
