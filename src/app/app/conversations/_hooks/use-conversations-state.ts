"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { InboxDirect, InboxGroup } from "@/types/chat";
import {
  getDirectConversationById,
  getDirectConversations,
  getGroupConversations,
} from "@/server-actions/conversations";

export type InboxTab = "conversations" | "groups";
export type SelectedConversationRef =
  | { kind: "direct"; id: string }
  | { kind: "group"; id: string }
  | null;

export function useConversationsState() {
  const [directConversations, setDirectConversations] = useState<InboxDirect[]>(
    [],
  );
  const [groupConversations, setGroupConversations] = useState<InboxGroup[]>(
    [],
  );
  const [selectedTab, setSelectedTab] = useState<InboxTab>("conversations");
  const [selectedRef, setSelectedRef] = useState<SelectedConversationRef>(null);

  const refreshDirect = useCallback(async () => {
    const direct = await getDirectConversations();
    setDirectConversations(direct ?? []);
    return direct ?? [];
  }, []);

  const refreshGroup = useCallback(async () => {
    const group = await getGroupConversations();
    setGroupConversations(group ?? []);
    return group ?? [];
  }, []);

  useEffect(() => {
    void refreshDirect();
    void refreshGroup();
  }, [refreshDirect, refreshGroup]);

  const selectDirect = useCallback((id: string | null) => {
    if (!id) return;
    setSelectedTab("conversations");
    setSelectedRef({ kind: "direct", id });
  }, []);

  const selectGroup = useCallback((id: string | null) => {
    if (!id) return;
    setSelectedTab("groups");
    setSelectedRef({ kind: "group", id });
  }, []);

  const selectedDirectConversation = useMemo(() => {
    if (!selectedRef || selectedRef.kind !== "direct") return null;
    return directConversations.find((c) => c.id === selectedRef.id) ?? null;
  }, [directConversations, selectedRef]);

  const selectedGroupConversation = useMemo(() => {
    if (!selectedRef || selectedRef.kind !== "group") return null;
    return groupConversations.find((c) => c.id === selectedRef.id) ?? null;
  }, [groupConversations, selectedRef]);

  const handleDirectConversationCreated = useCallback(
    async (newConversationId: string) => {
      // Try to fetch the conversation row directly (best UX even if it won't appear in top 20)
      const created = await getDirectConversationById(newConversationId);
      if (created?.id) {
        setDirectConversations((prev) => [
          created,
          ...prev.filter((c) => c.id !== created.id),
        ]);
        setSelectedTab("conversations");
        setSelectedRef({ kind: "direct", id: created.id });
        return;
      }

      // Fallback: refresh list and select by id.
      await refreshDirect();
      setSelectedTab("conversations");
      setSelectedRef({ kind: "direct", id: newConversationId });
    },
    [refreshDirect],
  );

  return {
    directConversations,
    groupConversations,
    refreshDirect,
    refreshGroup,
    selectedTab,
    setSelectedTab,
    selectedRef,
    selectedDirectConversation,
    selectedGroupConversation,
    selectDirect,
    selectGroup,
    handleDirectConversationCreated,
  };
}

