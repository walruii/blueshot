import "server-only";
import { GoogleGenAI } from "@google/genai";
import { MessageWithSender } from "@/types/chatSummary";

export interface MeetingSummaryChatMessage {
  senderName: string;
  content: string;
  at: string;
}

export interface MeetingSummaryTranscriptSegment {
  participantName: string;
  text: string;
  at: string;
}

/**
 * Initialize the Google Generative AI client
 * @throws Error if GEMINI_API_KEY is not configured
 */
export function initGemini() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured in environment variables",
    );
  }

  return new GoogleGenAI({ apiKey });
}

/**
 * Generate or update a chat summary using Google Gemini 3 Flash
 *
 * @param existingSummary - The current summary text, or null if creating the first summary
 * @param newMessages - Array of messages to incorporate into the summary
 * @returns The updated summary text
 * @throws Error if API call fails or content is blocked
 */
export async function generateSummary(
  existingSummary: string | null,
  newMessages: MessageWithSender[],
): Promise<string> {
  if (newMessages.length === 0) {
    throw new Error("Cannot generate summary: no messages provided");
  }

  const ai = initGemini();

  // Format messages for the prompt
  const messagesText = newMessages
    .map((msg) => {
      const senderName = msg.sender.name || msg.sender.email || "Unknown User";
      const content = msg.deleted_at
        ? "[Message deleted]"
        : msg.content || "[Empty message]";
      return `${senderName}: ${content}`;
    })
    .join("\n");

  // Construct the prompt
  const prompt = `You are summarizing a conversation to help users understand the key points and context.

${existingSummary ? `**Existing Summary:**\n${existingSummary}\n\n` : "**Existing Summary:** None (this is the first summary)\n\n"}**New Messages:**
${messagesText}

**Task:** ${existingSummary ? "Update the existing summary to incorporate the new messages." : "Create a comprehensive summary of the messages."} Focus on:
- Key topics and decisions discussed
- Important information shared
- Action items or next steps mentioned
- Overall sentiment and tone

Return ONLY the updated summary text. Do not include any preamble, explanation, or meta-commentary.`;

  try {
    const response = await ai.models.generateContent({
      model: "models/gemma-3-4b-it",
      contents: prompt,
    });

    // Check for content and validate
    if (!response.text || typeof response.text !== "string") {
      throw new Error("No valid response received from Gemini API");
    }

    const summaryText = response.text.trim();

    if (!summaryText) {
      throw new Error("Generated summary is empty");
    }

    return summaryText;
  } catch (error) {
    // Handle Gemini API errors
    if (error instanceof Error) {
      // Check for rate limiting
      if (error.message.includes("429") || error.message.includes("quota")) {
        throw new Error(
          "Rate limit exceeded. Please try again in a few moments.",
        );
      }

      // Check for network errors
      if (
        error.message.includes("fetch") ||
        error.message.includes("network")
      ) {
        throw new Error(
          "Network error while connecting to Gemini API. Please check your connection.",
        );
      }

      // Re-throw the error with context
      throw new Error(`Failed to generate summary: ${error.message}`);
    }

    throw new Error(
      "An unexpected error occurred while generating the summary",
    );
  }
}

/**
 * Generate a meeting summary from both typed chat and spoken transcript text.
 */
export async function generateMeetingSummary(
  chatMessages: MeetingSummaryChatMessage[],
  transcriptSegments: MeetingSummaryTranscriptSegment[],
): Promise<string> {
  if (chatMessages.length === 0 && transcriptSegments.length === 0) {
    throw new Error("No meeting content found to summarize");
  }

  const ai = initGemini();

  const formattedChat =
    chatMessages.length > 0
      ? chatMessages
          .map((message) => {
            return `[${message.at}] ${message.senderName}: ${message.content}`;
          })
          .join("\n")
      : "(No typed chat messages)";

  const formattedTranscript =
    transcriptSegments.length > 0
      ? transcriptSegments
          .map((segment) => {
            return `[${segment.at}] ${segment.participantName}: ${segment.text}`;
          })
          .join("\n")
      : "(No spoken transcript segments)";

  const prompt = `You are generating a concise but useful meeting summary.

The meeting has two sources of content:
- Typed Chat: text messages sent in meeting chat
- Spoken Transcript: speech-to-text transcript from participants

Typed Chat Messages:
${formattedChat}

Spoken Transcript Segments:
${formattedTranscript}

Write a summary that blends both sources into one coherent meeting narrative.
Include:
- Main topics discussed
- Decisions made
- Action items and owners if clear
- Open questions or blockers

Return only the summary text in plain Markdown. No preamble.`;

  try {
    const response = await ai.models.generateContent({
      model: "models/gemma-3-4b-it",
      contents: prompt,
    });

    if (!response.text || typeof response.text !== "string") {
      throw new Error("No valid response received from Gemini API");
    }

    const summaryText = response.text.trim();
    if (!summaryText) {
      throw new Error("Generated summary is empty");
    }

    return summaryText;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("429") || error.message.includes("quota")) {
        throw new Error(
          "Rate limit exceeded. Please try again in a few moments.",
        );
      }

      if (
        error.message.includes("fetch") ||
        error.message.includes("network")
      ) {
        throw new Error(
          "Network error while connecting to Gemini API. Please check your connection.",
        );
      }

      throw new Error(`Failed to generate meeting summary: ${error.message}`);
    }

    throw new Error(
      "An unexpected error occurred while generating the meeting summary",
    );
  }
}
