export type ConversationType = "direct" | "user_group" | "event";

export type MessageContentType = "text" | "image" | "file" | "system";

export type ConversationRole = "member" | "admin" | "owner";

export interface Conversation {
  id: string;
  type: ConversationType;
  user_group_id: string | null;
  event_id: string | null;
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  content_type: MessageContentType | null;
  reply_to_id: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  meeting_id: string | null;
  sent_during_meeting: boolean | null;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ConversationRole | null;
  can_send_messages: boolean | null;
  can_add_participants: boolean | null;
  joined_at: string;
  last_seen_at: string | null;
  last_read_message_id: string | null;
  notifications_enabled: boolean | null;
  muted_until: string | null;
}

export interface ConversationWithMetadata extends Conversation {
  unread_count: number;
  message_count: number;
  last_message_preview?: string;
  participant_count: number;
  is_muted: boolean;
}

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    name: string;
    image: string | null;
  };
  reply_to_message?: {
    content: string;
    sender_name: string;
  };
}

export interface ConversationParticipantWithUser extends ConversationParticipant {
  user: {
    id: string;
    name: string;
    image: string | null;
    email: string;
  };
}
