import { Database } from "./database.types";

export type ConversationType =
  | "direct"
  | "user_group"
  | "event_group"
  | "event"
  | "meeting";

export type MessageContentType = "text" | "image" | "file" | "system";

export type ConversationRole = "member" | "admin" | "owner";

export type InboxDirect =
  Database["public"]["Views"]["direct_messages_inbox"]["Row"];

export type InboxGroup =
  Database["public"]["Views"]["group_conversations_inbox"]["Row"];

export type MessageWithSender = {
  id: string;
  conversation_id: string;
  content: string;
  content_type: MessageContentType;
  created_at: string;
  reply_to_id: string | null;
  deleted_at: string | null;
  meeting_id: string | null;
  sender: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

// --- Chat store (conversation messages + paging) ---

export type ConversationData = {
  messages: MessageWithSender[];
  hasMoreBefore: boolean;
  isLoadingOlder: boolean;
  isInitialized: boolean;
};

export type ChatStoreState = {
  conversations: Record<string, ConversationData>;
  initializeConversation: (convoId: string) => void;
  setConversationData: (
    convoId: string,
    data:
      | Partial<ConversationData>
      | ((prev: ConversationData) => Partial<ConversationData>),
  ) => void;
  prependMessages: (convoId: string, messages: MessageWithSender[]) => void;
  appendMessage: (convoId: string, message: MessageWithSender) => void;
  upsertMessage: (convoId: string, message: MessageWithSender) => void;
  setMessages: (convoId: string, messages: MessageWithSender[]) => void;
  setLoadingOlder: (convoId: string, value: boolean) => void;
  setHasMoreBefore: (convoId: string, value: boolean) => void;
};
