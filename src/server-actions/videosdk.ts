"use server";
import { auth } from "@/lib/auth";
import { Result } from "@/types/returnType";
import jwt from "jsonwebtoken";
import { headers } from "next/headers";
let cachedToken: string | null = null;
let expiryTime: number = 0;

export async function getVideoSDKToken(): Promise<string | null> {
  const apiKey = process.env.VIDEOSDK_API_KEY as string;
  const secretKey = process.env.VIDEOSDK_SECRET_KEY as string;
  const now = Math.floor(Date.now() / 1000);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    console.error("No valid session found for VideoSDK token generation");
    return null;
  }

  // Reuse the token if it's still valid for at least 10 more minutes
  if (cachedToken && expiryTime > now + 600) {
    return cachedToken;
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

    cachedToken = token;
    expiryTime = now + 2 * 60 * 60;

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
export async function generateMeeting(
  meetingId: string,
): Promise<Result<string>> {
  try {
    const token = await getVideoSDKToken();
    if (!token) {
      return {
        success: false,
        error: "VideoSDK credentials not configured",
      };
    }

    if (!meetingId || meetingId.trim() === "") {
      return {
        success: false,
        error: "Meeting ID is required",
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
        customRoomId: meetingId,
        autoCloseConfig: {
          type: "session-ends",
          duration: 60,
        },
      }),
    });
    console.log(response);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || "Failed to generate VideoSDK token",
      };
    }

    const data = await response.json();
    console.log("VideoSDK token response:", data);

    // Return the token
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
