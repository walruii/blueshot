"use server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Result } from "@/types/returnType";
import jwt from "jsonwebtoken";
import { headers } from "next/headers";

export async function createJoinToken(roomId: string): Promise<string | null> {
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
    // // 1. Fetch the numeric role from our unified view
    // const { data: access } = await supabaseAdmin
    //   .from("view_all_event_access")
    //   .select("role")
    //   .eq("event_id", roomId)
    //   .eq("user_id", session.user.id)
    //   .maybeSingle();

    // if (!access) throw new Error("Unauthorized");

    // // 2. Map numeric roles to VideoSDK strings
    const permissions: string[] = ["allow_join"]; // Everyone in this view can join

    // if (access.role && access.role >= 2) {
    //   // Editors and Admins can share screen and moderate
    //   permissions.push("allow_mod", "allow_screen_share");
    // }

    // if (access.role && access.role >= 3) {
    //   // Only Admins can record
    //   permissions.push("allow_recording");
    // }

    const options: jwt.SignOptions = {
      expiresIn: "2h",
      algorithm: "HS256" as const,
    };
    let payload = {
      apikey: apiKey,
      permissions: permissions,
      participantId: session.user.id,
      version: 2,
      customRoomId: roomId,
    };

    const token = jwt.sign(payload, secretKey, options);

    return token;
  } catch (err) {
    console.error("Error generating VideoSDK token:", err);
    return null;
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
