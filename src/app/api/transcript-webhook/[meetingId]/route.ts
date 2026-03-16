import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Json } from "@/types/database.types";

type TranscriptWebhookPayload = {
  event?: string;
  eventType?: string;
  status?: string;
  roomId?: string;
  sessionId?: string;
  transcript?: unknown;
  transcription?: unknown;
  summary?: unknown;
  text?: unknown;
  data?: unknown;
  [key: string]: unknown;
};

const toPreviewText = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value.trim().slice(0, 500) || null;
  }

  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value).slice(0, 500);
    } catch {
      return "[unserializable-payload]";
    }
  }

  return null;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  try {
    const { meetingId } = await params;

    if (!meetingId) {
      return NextResponse.json(
        { success: false, error: "meetingId is required" },
        { status: 400 },
      );
    }

    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from("meeting")
      .select("id, creator_id")
      .eq("id", meetingId)
      .maybeSingle();

    if (meetingError) {
      console.error("Transcript webhook meeting lookup error:", meetingError);
      return NextResponse.json(
        { success: false, error: "Failed to validate meeting" },
        { status: 500 },
      );
    }

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: "Meeting not found" },
        { status: 404 },
      );
    }

    const payload = (await req
      .json()
      .catch(() => null)) as TranscriptWebhookPayload | null;

    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    const eventType = payload.eventType || payload.event || payload.status;
    const safeRawPayload = JSON.parse(JSON.stringify(payload)) as Json;

    const summaryPreview = toPreviewText(payload.summary);
    const transcriptPreview =
      toPreviewText(payload.transcript) ||
      toPreviewText(payload.transcription) ||
      toPreviewText(payload.text);

    // Store the webhook as a system notification for meeting owner.
    const { error: notificationError } = await supabaseAdmin
      .from("notification")
      .insert({
        user_id: meeting.creator_id,
        title: "Transcript webhook received",
        type: "info",
        priority: 5,
        payload: {
          source: "videosdk-transcript-webhook",
          meeting_id: meeting.id,
          event_type: eventType ?? null,
          room_id: payload.roomId ?? null,
          session_id: payload.sessionId ?? null,
          summary_preview: summaryPreview,
          transcript_preview: transcriptPreview,
          raw: safeRawPayload,
        },
      });

    if (notificationError) {
      console.error("Transcript webhook persistence error:", notificationError);
      return NextResponse.json(
        { success: false, error: "Failed to persist webhook payload" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      meetingId: meeting.id,
      receivedEvent: eventType ?? null,
    });
  } catch (error) {
    console.error("Unexpected error in transcript webhook endpoint:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
