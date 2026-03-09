import { Database } from "./database.types";
import { Result } from "./returnType";
import { MessageWithSender } from "./chat";

// Export MessageWithSender for convenience
export type { MessageWithSender };

/**
 * Chat summary database row type
 */
export type ChatSummary = Database["public"]["Tables"]["chat_summaries"]["Row"];

/**
 * Chat summary insert type (for creating new summaries)
 */
export type ChatSummaryInsert =
  Database["public"]["Tables"]["chat_summaries"]["Insert"];

/**
 * Chat summary update type (for updating existing summaries)
 */
export type ChatSummaryUpdate =
  Database["public"]["Tables"]["chat_summaries"]["Update"];

/**
 * Discriminated union for summarization requests
 * Supports both conversation-based and meeting-based summaries
 */
export type SummarizeRequest =
  | {
      type: "conversation";
      id: string; // conversation_id
    }
  | {
      type: "meeting";
      id: string; // meeting_id
    };

/**
 * Summary response data containing the generated summary and metadata
 */
export type SummaryData = {
  summary: string; // The generated/updated summary text
  messageCount: number; // Number of messages processed in this update
  isNewSummary: boolean; // True if this is the first summary, false if updating existing
  updatedAt: string; // ISO timestamp of when the summary was generated
};

/**
 * Summarization response following the Result pattern
 */
export type SummarizeResponse = Result<SummaryData>;
