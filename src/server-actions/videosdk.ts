"use server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Result } from "@/types/returnType";
import jwt from "jsonwebtoken";
import { headers } from "next/headers";

export async function createJoinToken(roomId: string): Promise<Result<string>> {
  const apiKey = process.env.VIDEOSDK_API_KEY as string;
  const secretKey = process.env.VIDEOSDK_SECRET_KEY as string;

  if (!apiKey || !secretKey) {
    console.error("VideoSDK credentials are not set in environment variables");
    return { success: false, error: "VideoSDK credentials not configured" };
  }

  // All participants are authenticated users
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    console.error("No valid session found for VideoSDK token generation");
    return { success: false, error: "No valid session found" };
  }

  try {
    // 1. Map roomId to meeting_id
    // Step 1: Find meeting by room_id
    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from("meeting")
      .select("id")
      .eq("room_id", roomId)
      .maybeSingle();

    if (meetingError || !meeting) {
      console.error("Meeting not found for room_id", roomId, meetingError);
      return { success: false, error: "Meeting not found" };
    }

    // Get the session and verify access
    let permissions: string[] = [];
    let participantId: string;

    // Authenticated user - check access and set permissions based on role
    participantId = session.user.id;

    // Step 2: Find event by meeting_id
    const { data: event, error: eventError } = await supabaseAdmin
      .from("event")
      .select("id")
      .eq("meeting_id", meeting.id)
      .maybeSingle();

    if (eventError || !event) {
      console.error("Event not found for meeting_id", meeting.id, eventError);
      return { success: false, error: "Event not found" };
    }

    // Step 3: Use event.id for access check
    const { data: access, error: accessError } = await supabaseAdmin
      .from("view_all_event_access")
      .select("role")
      .eq("event_id", event.id)
      .eq("user_id", session.user.id)
      .maybeSingle();

    // Check if user is a participant in the meeting (for passcode joins)
    const { data: participant, error: participantError } = await supabaseAdmin
      .from("meeting_participant")
      .select("id")
      .eq("meeting_id", meeting.id)
      .eq("user_id", session.user.id)
      .maybeSingle();

    // Allow if user has event access OR is a meeting participant (passcode join)
    if (accessError && participantError) {
      console.error("Error checking access", accessError, participantError);
      return { success: false, error: "Failed to verify access" };
    }

    if (!access && !participant) {
      console.error(
        "User not authorized - not in event access and not a meeting participant",
      );
      return { success: false, error: "Unauthorized" };
    }

    // Map numeric roles to VideoSDK permissions
    // Everyone gets allow_join and allow_screen_share
    const role = access?.role ?? 0;
    permissions = ["allow_join", "allow_screen_share"];
    if (role >= 2) {
      // Editors and Admins can moderate
      permissions.push("allow_mod");
    }
    if (role >= 3) {
      // Only Admins can record
      permissions.push("allow_recording");
    }

    const options: jwt.SignOptions = {
      expiresIn: "2h",
      algorithm: "HS256" as const,
    };
    let payload = {
      apikey: apiKey,
      permissions: permissions,
      participantId: participantId,
      version: 2,
      customRoomId: roomId,
    };

    const token = jwt.sign(payload, secretKey, options);

    return { success: true, data: token };
  } catch (err) {
    console.error("Error generating VideoSDK token:", err);
    return { success: false, error: "Failed to generate VideoSDK token" };
  }
}

export async function createToken(): Promise<string | null> {
  const apiKey = process.env.VIDEOSDK_API_KEY as string;
  const secretKey = process.env.VIDEOSDK_SECRET_KEY as string;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    console.error("No valid session found for VideoSDK token generation");
    return null;
  }

  if (!apiKey || !secretKey) {
    console.error("VideoSDK credentials are not set in environment variables");
    return null;
  }
  try {
    const options: jwt.SignOptions = {
      expiresIn: "2h",
      algorithm: "HS256" as const,
    };
    let payload = {
      apikey: apiKey,
      permissions: ["allow_join", "allow_mod"],
      participantId: session.user.id,
      version: 2,
    };

    const token = jwt.sign(payload, secretKey, options);

    return token;
  } catch (err) {
    console.error("Error generating VideoSDK token:", err);
    return null;
  }
}

/**
 * Generate a VideoSDK token for a meeting
 * @param meetingId - The unique meeting ID
 * @returns Result with token string or error
 */
export async function createRoom(): Promise<Result<string>> {
  try {
    const token = await createToken();
    if (!token) {
      return {
        success: false,
        error: "VideoSDK credentials not configured",
      };
    }

    // Call VideoSDK API to generate token
    const response = await fetch("https://api.videosdk.live/v2/rooms", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        disabled: false,
        autoCloseConfig: {
          type: "session-ends",
          duration: 60,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || "Failed to generate VideoSDK token",
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.roomId, // returns the meeting ID which is used as token in the frontend
    };
  } catch (error) {
    console.error("Error generating VideoSDK token:", error);
    return {
      success: false,
      error: "Failed to generate VideoSDK token",
    };
  }
}
