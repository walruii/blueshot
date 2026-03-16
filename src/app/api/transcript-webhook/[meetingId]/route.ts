import { supabaseAdmin } from "@/lib/supabase-admin";
import { Json } from "@/types/database.types";
import { NextRequest, NextResponse } from "next/server";

// ─── Types ───────────────────────────────────────────────────────────────────

type WebhookPayload = Record<string, unknown>;

interface StoredStatus {
  ready: boolean;
  status: string | null;
  transcriptText: string | null;
  summaryText: string | null;
  error: string | null;
  updatedAt: string;
  raw: WebhookPayload;
}

// ─── In-memory cache (per-process; sufficient for polling use case) ───────────
// Map<meetingId, StoredStatus>
const cache = new Map<string, StoredStatus>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const extractText = async (
  payload: WebhookPayload,
  key: "transcriptionFilePaths" | "summarizedFilePaths",
): Promise<string | null> => {
  const paths = payload[key] as Record<string, string> | undefined;
  const url = paths?.txt;
  if (!url) return null;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
};

const resolveStatus = (payload: WebhookPayload): string | null =>
  (payload.status ?? payload.event ?? payload.eventType ?? null) as
    | string
    | null;

// ─── POST – receive VideoSDK webhook ─────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { meetingId } = await params;

  if (!meetingId) {
    return NextResponse.json({ error: "meetingId required" }, { status: 400 });
  }

  // Validate meeting exists.
  const { data: meeting, error: meetingError } = await supabaseAdmin
    .from("meeting")
    .select("id, creator_id")
    .eq("id", meetingId)
    .maybeSingle();

  if (meetingError) {
    console.error("[Transcript Webhook] Meeting lookup error:", meetingError);
    return NextResponse.json(
      { error: "Failed to validate meeting" },
      { status: 500 },
    );
  }
  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const payload = (await req.json().catch(() => null)) as WebhookPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const status = resolveStatus(payload);
  const isReady =
    status === "COMPLETED" ||
    status === "READY" ||
    status === "completed" ||
    status === "ready";
  const isFailed =
    status === "FAILED" ||
    status === "failed" ||
    status === "ERROR" ||
    status === "error";

  console.log(
    `[Transcript Webhook] Received for meeting ${meetingId}: status=${status}`,
  );

  // Eagerly fetch transcript / summary text from CDN if provided.
  const [transcriptText, summaryText] = await Promise.all([
    extractText(payload, "transcriptionFilePaths"),
    extractText(payload, "summarizedFilePaths"),
  ]);

  if (transcriptText) {
    console.log(
      "[Transcript Webhook] Transcript text received:\n",
      transcriptText,
    );
  }
  if (summaryText) {
    console.log("[Transcript Webhook] Summary text received:\n", summaryText);
  }

  const stored: StoredStatus = {
    ready: isReady,
    status,
    transcriptText,
    summaryText,
    error: isFailed ? String(payload.error ?? "Transcription failed") : null,
    updatedAt: new Date().toISOString(),
    raw: payload,
  };

  cache.set(meetingId, stored);

  // Persist as a notification for the meeting creator so data survives process
  // restarts (best-effort; non-blocking).
  supabaseAdmin
    .from("notification")
    .insert({
      user_id: meeting.creator_id,
      title: "Meeting transcript webhook received",
      type: "info",
      priority: 5,
      payload: JSON.parse(JSON.stringify(stored)) as Json,
    })
    .then(({ error }) => {
      if (error) {
        console.error(
          "[Transcript Webhook] Notification persist error:",
          error,
        );
      }
    });

  return NextResponse.json({
    success: true,
    meetingId,
    status,
    ready: isReady,
  });
}

// ─── GET – poll for readiness (called by the hook every ~4 s) ────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { meetingId } = await params;

  if (!meetingId) {
    return NextResponse.json({ error: "meetingId required" }, { status: 400 });
  }

  const stored = cache.get(meetingId) ?? null;

  if (!stored) {
    // No webhook received yet.
    return NextResponse.json({
      ready: false,
      status: null,
      transcriptText: null,
      summaryText: null,
      error: null,
    });
  }

  return NextResponse.json({
    ready: stored.ready,
    status: stored.status,
    transcriptText: stored.transcriptText,
    summaryText: stored.summaryText,
    error: stored.error,
    updatedAt: stored.updatedAt,
  });
}
