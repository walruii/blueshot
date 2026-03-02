import { create } from "zustand";
import type {
  ChatStoreState,
  ConversationData,
  MessageWithSender,
} from "@/types/chat";

const DEFAULT_CONVERSATION: ConversationData = {
  messages: [],
  hasMoreBefore: true,
  isLoadingOlder: false,
  isInitialized: false,
};

function sortByCreatedAtAsc(
  messages: MessageWithSender[],
): MessageWithSender[] {
  return [...messages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

function mergeByIdPreferLater(
  messages: MessageWithSender[],
): MessageWithSender[] {
  const map = new Map<string, MessageWithSender>();
  for (const m of messages) map.set(m.id, m);
  return Array.from(map.values());
}

export const useChatStore = create<ChatStoreState>((set) => ({
  conversations: {},
  users: {},
  directConversations: [],
  groupConversations: [],
  setDirectConversations: (convs) => set({ directConversations: convs }),
  setGroupConversations: (convs) => set({ groupConversations: convs }),
  addDirectConversation: (convo) =>
    set((state) => ({
      directConversations: [
        convo,
        ...state.directConversations.filter((c) => c.id !== convo.id),
      ],
    })),
  addGroupConversation: (convo) =>
    set((state) => ({
      groupConversations: [
        convo,
        ...state.groupConversations.filter((c) => c.id !== convo.id),
      ],
    })),

  initializeConversation(convoId) {
    set((state) => {
      if (state.conversations[convoId]) return state;
      return {
        conversations: {
          ...state.conversations,
          [convoId]: { ...DEFAULT_CONVERSATION },
        },
      };
    });
  },

  upsertUser(user) {
    set((state) => ({
      users: { ...state.users, [user.id]: user },
    }));
  },

  setConversationData(convoId, data) {
    set((state) => {
      const prev = state.conversations[convoId] ?? { ...DEFAULT_CONVERSATION };
      const next = typeof data === "function" ? data(prev) : data;
      return {
        conversations: {
          ...state.conversations,
          [convoId]: { ...prev, ...next },
        },
      };
    });
  },

  prependMessages(convoId, newMessages) {
    set((state) => {
      const conv = state.conversations[convoId];
      const current = conv?.messages ?? [];
      const existingIds = new Set(current.map((m) => m.id));
      const toPrepend = newMessages.filter((m) => !existingIds.has(m.id));
      if (toPrepend.length === 0) return state;
      const merged = sortByCreatedAtAsc([...toPrepend, ...current]);
      return {
        conversations: {
          ...state.conversations,
          [convoId]: {
            ...(conv ?? DEFAULT_CONVERSATION),
            messages: merged,
          },
        },
      };
    });
  },

  appendMessage(convoId, message) {
    set((state) => {
      const conv = state.conversations[convoId];
      const current = conv?.messages ?? [];
      if (current.some((m) => m.id === message.id)) return state;
      const merged = sortByCreatedAtAsc([...current, message]);
      return {
        conversations: {
          ...state.conversations,
          [convoId]: {
            ...(conv ?? DEFAULT_CONVERSATION),
            messages: merged,
          },
        },
      };
    });
  },
  upsertMessage(convoId, message) {
    set((state) => {
      const conv = state.conversations[convoId];
      const current = conv?.messages ?? [];

      // Automatically cache the sender whenever a message arrives
      const updatedUsers = {
        ...state.users,
        [message.sender.id]: message.sender,
      };

      // Deduplication: Remove optimistic message if real-time message matches
      let filtered = current;
      // Only deduplicate for sender
      if (message.sender && state.users[message.sender.id]) {
        filtered = current.filter((m) => {
          // Remove optimistic message if:
          // - Sender matches
          // - Content matches
          // - Created_at is within 5s of real-time message
          // - ID is not the real one (likely temp)
          const isTemp =
            m.id !== message.id &&
            m.sender.id === message.sender.id &&
            m.content === message.content;
          const timeDiff = Math.abs(
            new Date(m.created_at).getTime() -
              new Date(message.created_at).getTime(),
          );
          return !(isTemp && timeDiff < 5000);
        });
      }

      const idx = filtered.findIndex((m) => m.id === message.id);
      const next =
        idx >= 0
          ? filtered.map((m, i) => (i === idx ? message : m))
          : [...filtered, message];

      const merged = sortByCreatedAtAsc(next);
      return {
        users: updatedUsers,
        conversations: {
          ...state.conversations,
          [convoId]: {
            ...(conv ?? DEFAULT_CONVERSATION),
            messages: merged,
          },
        },
      };
    });
  },

  setMessages(convoId, messages) {
    set((state) => {
      const prev = state.conversations[convoId] ?? DEFAULT_CONVERSATION;
      const merged = sortByCreatedAtAsc(
        mergeByIdPreferLater([...prev.messages, ...messages]),
      );
      return {
        conversations: {
          ...state.conversations,
          [convoId]: {
            ...prev,
            messages: merged,
            isInitialized: true,
          },
        },
      };
    });
  },

  setLoadingOlder(convoId, value) {
    set((state) => {
      const conv = state.conversations[convoId];
      if (!conv) return state;
      return {
        conversations: {
          ...state.conversations,
          [convoId]: { ...conv, isLoadingOlder: value },
        },
      };
    });
  },

  setHasMoreBefore(convoId, value) {
    set((state) => {
      const conv = state.conversations[convoId];
      if (!conv) return state;
      return {
        conversations: {
          ...state.conversations,
          [convoId]: { ...conv, hasMoreBefore: value },
        },
      };
    });
  },
}));
