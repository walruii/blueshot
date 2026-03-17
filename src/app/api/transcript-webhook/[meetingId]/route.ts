import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

type WebhookPayload = Record<string, unknown>;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { meetingId } = await params;

  if (!meetingId) {
    return NextResponse.json(
      { error: "meetingId is required" },
      { status: 400 },
    );
  }

  const { data: meeting, error } = await supabaseAdmin
    .from("meeting")
    .select("id")
    .eq("id", meetingId)
    .maybeSingle();

  if (error) {
    console.error("[Transcript Webhook] meeting lookup failed:", error);
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
    return NextResponse.json(
      { error: "Invalid webhook payload" },
      { status: 400 },
    );
  }

  const status =
    (payload.status as string | undefined) ??
    (payload.event as string | undefined) ??
    (payload.eventType as string | undefined) ??
    "unknown";

  console.log("[Transcript Webhook] meeting:", meetingId, "status:", status);

  return NextResponse.json({ success: true });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { meetingId } = await params;

  if (!meetingId) {
    return NextResponse.json(
      { error: "meetingId is required" },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, meetingId });
}
