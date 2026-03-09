"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  SummarizeRequest,
  SummarizeResponse,
  MessageWithSender,
} from "@/types/chatSummary";
import { headers } from "next/headers";
import { isValidUUID } from "@/lib/utils";
import { generateSummary } from "@/lib/gemini";

/**
 * Server action to generate or update a chat summary using AI
 * Supports both conversation-based and meeting-based summaries
 *
 * @param request - Discriminated union specifying conversation or meeting ID
 * @returns Result with summary data or error message
 */
export async function summarizeChatAction(
  request: SummarizeRequest,
): Promise<SummarizeResponse> {
  try {
    // 1. Authentication check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        success: false,
        error: "Unauthorized. Please sign in to summarize chats.",
      };
    }

    const userId = session.user.id;

    // 2. Input validation
    if (!request || !request.type || !request.id) {
      return {
        success: false,
        error:
          "Invalid request. Please provide a valid conversation or meeting ID.",
      };
    }

    // Validate UUID format using utility function
    if (!isValidUUID(request.id)) {
      return {
        success: false,
        error: "Invalid ID format. Please provide a valid UUID.",
      };
    }

    // Validate type
    if (request.type !== "conversation" && request.type !== "meeting") {
      return {
        success: false,
        error: "Invalid request type. Must be 'conversation' or 'meeting'.",
      };
    }

    // 3. Verify user has access to the conversation or meeting using SQL functions
    const hasAccess = await verifyAccess(request.type, request.id, userId);

    if (!hasAccess) {
      return {
        success: false,
        error: `You don't have access to this ${request.type}.`,
      };
    }

    // 4. Fetch existing summary from chat_summaries
    const existingSummaryData = await fetchExistingSummary(
      request.type,
      request.id,
      userId,
    );

    // Check if summary is very recent (within 60 seconds) - avoid rapid re-summarization
    if (existingSummaryData) {
      const lastUpdateTime = new Date(existingSummaryData.updated_at).getTime();
      const currentTime = new Date().getTime();
      const secondsSinceUpdate = (currentTime - lastUpdateTime) / 1000;

      // If summary was updated less than 60 seconds ago, return cached version
      if (secondsSinceUpdate < 60) {
        return {
          success: true,
          data: {
            summary: existingSummaryData.content,
            messageCount: 0,
            isNewSummary: false,
            updatedAt: existingSummaryData.updated_at,
          },
        };
      }
    }

    // 5. Fetch messages based on whether summary exists
    const messages = await fetchMessages(
      request.type,
      request.id,
      existingSummaryData?.last_message_id,
    );

    // Edge case: No new messages to summarize
    if (messages.length === 0) {
      if (existingSummaryData) {
        // Return existing summary
        return {
          success: true,
          data: {
            summary: existingSummaryData.content,
            messageCount: 0,
            isNewSummary: false,
            updatedAt: existingSummaryData.updated_at,
          },
        };
      } else {
        // No messages at all
        return {
          success: false,
          error: "No messages found to summarize.",
        };
      }
    }

    // 6. Call Gemini API to generate/update summary
    const summaryText = await generateSummary(
      existingSummaryData?.content || null,
      messages,
    );

    // 7. Update or insert summary to database
    const lastMessageId = messages[messages.length - 1].id;
    const updatedAt = new Date().toISOString();

    const summaryPayload = {
      content: summaryText,
      last_message_id: lastMessageId,
      updated_at: updatedAt,
    };

    let dbError;
    let isUpdate = false;

    if (existingSummaryData) {
      // Update existing summary
      const result = await supabaseAdmin
        .from("chat_summaries")
        .update(summaryPayload)
        .eq("id", existingSummaryData.id)
        .select();

      dbError = result.error;
      isUpdate = true;
    } else {
      // Insert new summary
      const result = await supabaseAdmin
        .from("chat_summaries")
        .insert({
          user_id: userId,
          conversation_id: request.type === "conversation" ? request.id : null,
          meeting_id: request.type === "meeting" ? request.id : null,
          ...summaryPayload,
        })
        .select();

      dbError = result.error;
    }

    if (dbError) {
      console.error("[summarizeChat] Database operation failed:", {
        error: dbError,
        code: dbError.code,
        message: dbError.message,
        operation: isUpdate ? "update" : "insert",
      });
      return {
        success: false,
        error: `Failed to save summary to database: ${dbError.message}`,
      };
    }

    // 8. Return success response
    return {
      success: true,
      data: {
        summary: summaryText,
        messageCount: messages.length,
        isNewSummary: !existingSummaryData,
        updatedAt,
      },
    };
  } catch (error) {
    console.error("Error in summarizeChatAction:", error);

    // Handle specific error types
    if (error instanceof Error) {
      return {
        success: false,
        error: `Failed to generate summary: ${error.message}`,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred while generating the summary.",
    };
  }
}

/**
 * Verify user has access to the conversation or meeting using SQL functions
 */
async function verifyAccess(
  type: "conversation" | "meeting",
  id: string,
  userId: string,
): Promise<boolean> {
  try {
    if (type === "conversation") {
      // Use check_conversation_access SQL function
      const { data, error } = await supabaseAdmin.rpc(
        "check_conversation_access",
        {
          p_user_id: userId,
          p_conversation_id: id,
        },
      );

      if (error) {
        console.error("Error checking conversation access:", error);
        return false;
      }

      return data === true;
    } else {
      // Use can_access_meeting SQL function
      const { data, error } = await supabaseAdmin.rpc("can_access_meeting", {
        p_meeting_id: id,
        p_user_id: userId,
      });

      if (error) {
        console.error("Error checking meeting access:", error);
        return false;
      }

      return data === true;
    }
  } catch (error) {
    console.error("Error in verifyAccess:", error);
    return false;
  }
}

/**
 * Fetch existing summary from chat_summaries table
 */
async function fetchExistingSummary(
  type: "conversation" | "meeting",
  id: string,
  userId: string,
): Promise<{
  id: string;
  content: string;
  last_message_id: string;
  updated_at: string;
} | null> {
  try {
    const query = supabaseAdmin
      .from("chat_summaries")
      .select("id, content, last_message_id, updated_at")
      .eq("user_id", userId);

    if (type === "conversation") {
      query.eq("conversation_id", id);
    } else {
      query.eq("meeting_id", id);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Error fetching existing summary:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in fetchExistingSummary:", error);
    return null;
  }
}

/**
 * Fetch messages for summarization
 * If lastMessageId is provided, fetch only messages after that ID using DB filtering
 * Otherwise, fetch all messages
 */
async function fetchMessages(
  type: "conversation" | "meeting",
  id: string,
  lastMessageId?: string,
): Promise<MessageWithSender[]> {
  try {
    let query = supabaseAdmin
      .from("message")
      .select("*, user!inner(id, name, email, image)")
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    // Filter by conversation or meeting
    if (type === "conversation") {
      query = query.eq("conversation_id", id);
    } else {
      query = query.eq("meeting_id", id);
    }

    // If we have a last message ID, try to fetch with created_at comparison
    // This ensures we get exactly the new messages without relying on client-side filtering
    const { data: messages, error } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }

    // Map to MessageWithSender format
    const allMessages = messages.map((msg) => ({
      id: msg.id,
      conversation_id: msg.conversation_id ?? null,
      content: msg.content,
      content_type:
        (msg.content_type as MessageWithSender["content_type"]) ?? "text",
      created_at: msg.created_at,
      reply_to_id: msg.reply_to_id,
      deleted_at: msg.deleted_at,
      meeting_id: msg.meeting_id,
      sender: {
        id: msg.user.id,
        name: msg.user.name,
        email: msg.user.email,
        image: msg.user.image,
      },
    }));

    // If we have a last message ID, filter to only messages after it
    if (lastMessageId) {
      // Case-insensitive UUID comparison (normalize to lowercase)
      const normalizedLastId = lastMessageId.toLowerCase();
      const lastMessageIndex = allMessages.findIndex(
        (msg) => msg.id.toLowerCase() === normalizedLastId,
      );

      if (lastMessageIndex !== -1) {
        const newMessages = allMessages.slice(lastMessageIndex + 1);
        return newMessages;
      } else {
        // If last message not found, return all messages as fallback
        // This shouldn't happen in normal operation
        console.warn(
          `[fetchMessages] Last message ID not found in current messages. Returning all {${allMessages.length}} messages.`,
        );
        return allMessages;
      }
    }

    return allMessages;
  } catch (error) {
    console.error("Error in fetchMessages:", error);
    return [];
  }
}
