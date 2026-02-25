"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { InboxDirect, InboxGroup, InboxItem } from "@/types/chat";
import {
  getDirectConversationById,
  getDirectConversations,
  getGroupConversations,
} from "@/server-actions/conversations";
import { useChatStore } from "@/stores/chatStore";

export type InboxTab = "conversations" | "groups";

export function useConversationsState() {
  const directConversations = useChatStore((s) => s.directConversations);
  const groupConversations = useChatStore((s) => s.groupConversations);
  const setDirectConversations = useChatStore((s) => s.setDirectConversations);
  const setGroupConversations = useChatStore((s) => s.setGroupConversations);
  const addDirectConversation = useChatStore((s) => s.addDirectConversation);
  const addGroupConversation = useChatStore((s) => s.addGroupConversation);
  const [selectedTab, setSelectedTab] = useState<InboxTab>("conversations");
  const [selectedConversation, setSelectedConversation] =
    useState<InboxItem | null>(null);

  const refreshDirect = useCallback(async () => {
    const direct = await getDirectConversations();
    setDirectConversations(direct ?? []);
    return direct ?? [];
  }, [setDirectConversations]);

  const refreshGroup = useCallback(async () => {
    const group = await getGroupConversations();
    setGroupConversations(group ?? []);
    return group ?? [];
  }, [setGroupConversations]);

  useEffect(() => {
    void refreshDirect();
    void refreshGroup();
  }, [refreshDirect, refreshGroup]);

  const selectDirect = useCallback(
    (id: string | null) => {
      if (!id) return;
      setSelectedTab("conversations");
      setSelectedConversation(
        directConversations.find((c) => c.id === id) ?? null,
      );
    },
    [directConversations],
  );

  const selectGroup = useCallback(
    (id: string | null) => {
      if (!id) return;
      setSelectedTab("groups");
      setSelectedConversation(
        groupConversations.find((c) => c.id === id) ?? null,
      );
    },
    [groupConversations],
  );

  const handleDirectConversationCreated = useCallback(
    async (newConversationId: string) => {
      // Try to fetch the conversation row directly (best UX even if it won't appear in top 20)
      const created = await getDirectConversationById(newConversationId);
      if (created?.id) {
        // store, select, and update current conversation
        addDirectConversation(created);
        setSelectedConversation(created);
        setSelectedTab("conversations");
        return;
      }

      // Fallback: refresh list and select by id.
      await refreshDirect();
      setSelectedTab("conversations");
    },
    [refreshDirect, addDirectConversation],
  );

  return {
    directConversations,
    groupConversations,
    refreshDirect,
    refreshGroup,
    selectedTab,
    setSelectedTab,
    selectedConversation,
    selectDirect,
    selectGroup,
    handleDirectConversationCreated,
    addDirectConversation,
    addGroupConversation,
  };
}
