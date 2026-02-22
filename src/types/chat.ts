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
  sender_id: string;
  content: string;
  content_type: MessageContentType;
  created_at: string;
  sender: {
    id: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
};
