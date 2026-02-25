import { Database } from "./database.types";

export type ConversationType =
  | "direct"
  | "user_group"
  | "event_group"
  | "event"
  | "meeting";

export type MessageContentType = "text" | "image" | "file" | "system";

export type ConversationRole = "member" | "admin" | "owner";

export type InboxDirectDB =
  Database["public"]["Views"]["direct_messages_inbox"]["Row"];

export type InboxGroupDB =
  Database["public"]["Views"]["group_conversations_inbox"]["Row"];

export type InboxDirect = {
  id: string | null;
  partner_id: string | null;
  partner_name: string | null;
  partner_email: string | null;
  partner_image: string | null;
  last_message_at: string | null;
  updated_at: string | null;
};

export type InboxGroup = {
  id: string | null;
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  last_message_at: string | null;
  updated_at: string | null;
  user_group_id: string | null;
  event_id: string | null;
};

export const formatInboxDirect = (dbRow: InboxDirectDB): InboxDirect => ({
  id: dbRow.id,
  partner_id: dbRow.partner_id,
  partner_name: dbRow.partner_name,
  partner_email: dbRow.partner_email,
  partner_image: dbRow.partner_image,
  last_message_at: dbRow.last_message_at,
  updated_at: dbRow.updated_at,
});

export const formatInboxGroup = (dbRow: InboxGroupDB): InboxGroup => ({
  id: dbRow.id,
  name: dbRow.name,
  description: dbRow.description,
  avatar_url: dbRow.avatar_url,
  last_message_at: dbRow.last_message_at,
  updated_at: dbRow.updated_at,
  user_group_id: dbRow.user_group_id,
  event_id: dbRow.event_id,
});

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
  users: Record<string, MessageWithSender["sender"]>;
  initializeConversation: (convoId: string) => void;
  upsertUser: (user: MessageWithSender["sender"]) => void;
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
