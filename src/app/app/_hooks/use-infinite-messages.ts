"use client";

import { useLayoutEffect, useRef, useEffect, useCallback } from "react";
import { useChatStore } from "@/stores/chatStore";
import { getMessagesBefore, getMessagesFirstPage } from "@/server-actions/chat";

const DEFAULT_PAGE_SIZE = 20;

type ScrollCompensation = {
  prevHeight: number;
  prevScrollTop: number;
};

export function useInfiniteMessages(
  conversationId: string,
  options?: {
    pageSize?: number;
    /** Ref for the scrollable element; required for scroll compensation when prepending. */
    scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  },
) {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const scrollContainerRef = options?.scrollContainerRef;

  const scrollCompensationRef = useRef<ScrollCompensation | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const conversations = useChatStore((s) => s.conversations);
  const conv = conversationId ? conversations[conversationId] : undefined;
  const messages = conv?.messages ?? [];
  const hasMoreBefore = conv?.hasMoreBefore ?? true;
  const isLoadingOlder = conv?.isLoadingOlder ?? false;
  const isInitialized = conv?.isInitialized ?? false;

  const initializeConversation = useChatStore((s) => s.initializeConversation);
  const setMessages = useChatStore((s) => s.setMessages);
  const setHasMoreBefore = useChatStore((s) => s.setHasMoreBefore);
  const prependMessages = useChatStore((s) => s.prependMessages);
  const setLoadingOlder = useChatStore((s) => s.setLoadingOlder);

  // Initial load
  useEffect(() => {
    if (!conversationId) return;
    initializeConversation(conversationId);
  }, [conversationId, initializeConversation]);

  useEffect(() => {
    if (!conversationId || isInitialized) return;

    let cancelled = false;
    (async () => {
      let meetingId: string | undefined;
      if (conversationId.startsWith("meeting:")) {
        meetingId = conversationId.replace("meeting:", "");
      }
      const firstPage = await getMessagesFirstPage(
        conversationId,
        pageSize,
        meetingId,
      );
      if (cancelled) return;
      setMessages(conversationId, firstPage);
      setHasMoreBefore(conversationId, firstPage.length >= pageSize);
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, isInitialized, pageSize, setMessages, setHasMoreBefore]);

  const loadOlder = useCallback(async () => {
    if (!conversationId) return;
    const conv = useChatStore.getState().conversations[conversationId];
    if (!conv?.hasMoreBefore || conv.isLoadingOlder) return;

    const oldest = conv.messages[0];
    if (!oldest) return;

    const el = scrollContainerRef?.current;
    if (el) {
      scrollCompensationRef.current = {
        prevHeight: el.scrollHeight,
        prevScrollTop: el.scrollTop,
      };
    }

    setLoadingOlder(conversationId, true);
    let meetingId: string | undefined;
    if (conversationId.startsWith("meeting:")) {
      meetingId = conversationId.replace("meeting:", "");
    }
    const older = await getMessagesBefore(
      conversationId,
      oldest.created_at,
      pageSize,
      meetingId,
    );
    prependMessages(conversationId, older);
    setHasMoreBefore(conversationId, older.length >= pageSize);
    setLoadingOlder(conversationId, false);
  }, [
    conversationId,
    pageSize,
    scrollContainerRef,
    prependMessages,
    setHasMoreBefore,
    setLoadingOlder,
  ]);

  // IntersectionObserver: when sentinel at top becomes visible, load older
  useEffect(() => {
    if (!conversationId) return;
    const sentinel = loadMoreRef.current;
    const root = scrollContainerRef?.current ?? null;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) loadOlder();
      },
      { root, rootMargin: "0px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [conversationId, loadOlder, scrollContainerRef]);

  // Scroll compensation after prepend: run in useLayoutEffect after messages have been rendered
  useLayoutEffect(() => {
    const comp = scrollCompensationRef.current;
    if (!comp || !scrollContainerRef?.current) return;

    const el = scrollContainerRef.current;
    const delta = el.scrollHeight - comp.prevHeight;
    el.scrollTop = comp.prevScrollTop + delta;
    scrollCompensationRef.current = null;
  });

  return {
    messages,
    isLoadingOlder,
    hasMoreBefore,
    isInitialized,
    loadMoreRef,
    loadOlder,
  };
}
