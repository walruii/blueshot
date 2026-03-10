"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Result } from "@/types/returnType";
import { headers } from "next/headers";
import { createToken } from "./videosdk";

interface TranscriptionStartResponse {
  id?: string;
  status?: string;
  extension?: {
    extensionConfig?: {
      roomId?: string;
      sessionId?: string;
    };
  };
  start?: string;
}

interface TranscriptionListResponse {
  pageInfo?: {
    currentPage: number;
    perPage: number;
    lastPage: number;
    total: number;
  };
  transcriptions?: Array<{
    id?: string;
    status?: string;
    extension?: {
      extensionConfig?: {
        roomId?: string;
        sessionId?: string;
      };
    };
    transcriptionFilePaths?: {
      txt?: string;
    };
    summarizedFilePaths?: {
      txt?: string;
    };
    start?: string;
    end?: string;
  }>;
}

const assertCanManageTranscriptions = async (
  userId: string,
  roomId: string,
): Promise<Result<{ meetingDbId: string }>> => {
  const { data: meeting, error: meetingError } = await supabaseAdmin
    .from("meeting")
    .select("id")
    .eq("room_id", roomId)
    .maybeSingle();

  if (meetingError || !meeting) {
    return {
      success: false,
      error: "Meeting not found",
    };
  }

  const { data: event, error: eventError } = await supabaseAdmin
    .from("event")
    .select("id")
    .eq("meeting_id", meeting.id)
    .maybeSingle();

  if (eventError || !event) {
    return {
      success: false,
      error: "Event not found for this meeting",
    };
  }

  const { data: access, error: accessError } = await supabaseAdmin
    .from("view_all_event_access")
    .select("role")
    .eq("event_id", event.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (accessError) {
    return {
      success: false,
      error: "Failed to verify event permissions",
    };
  }

  // READ_WRITE(2) and ADMIN(3) are allowed to control transcription.
  if (!access || access.role === null || access.role < 2) {
    return {
      success: false,
      error: "You do not have permission to control transcriptions",
    };
  }

  return {
    success: true,
    data: {
      meetingDbId: meeting.id,
    },
  };
};

const getAuthUserId = async (): Promise<Result<string>> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  return {
    success: true,
    data: session.user.id,
  };
};

export const getTranscriptionControlAccess = async (
  roomId: string,
): Promise<Result<{ canControl: boolean }>> => {
  try {
    if (!roomId) {
      return {
        success: false,
        error: "roomId is required",
      };
    }

    const authResult = await getAuthUserId();
    if (!authResult.success || !authResult.data) {
      return {
        success: false,
        error: authResult.success ? "Unauthorized" : authResult.error,
      };
    }

    const accessResult = await assertCanManageTranscriptions(
      authResult.data,
      roomId,
    );
    if (!accessResult.success) {
      return {
        success: true,
        data: {
          canControl: false,
        },
      };
    }

    return {
      success: true,
      data: {
        canControl: true,
      },
    };
  } catch (err) {
    console.error("Unexpected error in getTranscriptionControlAccess:", err);
    return {
      success: false,
      error: "Failed to check transcription permissions",
    };
  }
};

export const startTranscription = async (
  roomId: string,
): Promise<Result<TranscriptionStartResponse>> => {
  try {
    if (!roomId) {
      return {
        success: false,
        error: "roomId is required",
      };
    }

    const authResult = await getAuthUserId();
    if (!authResult.success || !authResult.data) {
      return {
        success: false,
        error: authResult.success ? "Unauthorized" : authResult.error,
      };
    }

    const accessResult = await assertCanManageTranscriptions(
      authResult.data,
      roomId,
    );
    if (!accessResult.success) {
      return accessResult;
    }

    const token = await createToken();
    if (!token) {
      return {
        success: false,
        error: "Failed to generate VideoSDK token",
      };
    }

    const response = await fetch(
      "https://api.videosdk.live/ai/v1/realtime-transcriptions/start",
      {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
        }),
      },
    );

    const data = (await response
      .json()
      .catch(() => ({}))) as TranscriptionStartResponse;

    if (!response.ok) {
      return {
        success: false,
        error: data?.status || "Failed to start transcription",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error("Unexpected error in startTranscription:", err);
    return {
      success: false,
      error: "Failed to start transcription",
    };
  }
};

export const stopTranscription = async (
  roomId: string,
  sessionId: string,
): Promise<Result<TranscriptionStartResponse>> => {
  try {
    if (!roomId || !sessionId) {
      return {
        success: false,
        error: "roomId and sessionId are required",
      };
    }

    const authResult = await getAuthUserId();
    if (!authResult.success || !authResult.data) {
      return {
        success: false,
        error: authResult.success ? "Unauthorized" : authResult.error,
      };
    }

    const accessResult = await assertCanManageTranscriptions(
      authResult.data,
      roomId,
    );
    if (!accessResult.success) {
      return accessResult;
    }

    const token = await createToken();
    if (!token) {
      return {
        success: false,
        error: "Failed to generate VideoSDK token",
      };
    }

    const response = await fetch(
      "https://api.videosdk.live/ai/v1/realtime-transcriptions/end",
      {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          sessionId,
        }),
      },
    );

    const data = (await response
      .json()
      .catch(() => ({}))) as TranscriptionStartResponse;

    if (!response.ok) {
      return {
        success: false,
        error: data?.status || "Failed to stop transcription",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error("Unexpected error in stopTranscription:", err);
    return {
      success: false,
      error: "Failed to stop transcription",
    };
  }
};

export const getTranscription = async (
  roomId: string,
  sessionId: string,
  page: number = 1,
  perPage: number = 20,
): Promise<Result<TranscriptionListResponse>> => {
  try {
    if (!roomId || !sessionId) {
      return {
        success: false,
        error: "roomId and sessionId are required",
      };
    }

    const authResult = await getAuthUserId();
    if (!authResult.success || !authResult.data) {
      return {
        success: false,
        error: authResult.success ? "Unauthorized" : authResult.error,
      };
    }

    const accessResult = await assertCanManageTranscriptions(
      authResult.data,
      roomId,
    );
    if (!accessResult.success) {
      return accessResult;
    }

    const token = await createToken();
    if (!token) {
      return {
        success: false,
        error: "Failed to generate VideoSDK token",
      };
    }

    const url = `https://api.videosdk.live/ai/v1/realtime-transcriptions/?roomId=${encodeURIComponent(
      roomId,
    )}&sessionId=${encodeURIComponent(sessionId)}&page=${page}&perPage=${perPage}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
    });

    const data = (await response
      .json()
      .catch(() => ({}))) as TranscriptionListResponse;

    if (!response.ok) {
      return {
        success: false,
        error: "Failed to fetch transcription",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error("Unexpected error in getTranscription:", err);
    return {
      success: false,
      error: "Failed to fetch transcription",
    };
  }
};

export const getTranscriptionAndSummary = async (
  roomId: string,
  sessionId: string,
  page: number = 1,
  perPage: number = 20,
): Promise<Result<TranscriptionListResponse>> => {
  try {
    if (!roomId || !sessionId) {
      return {
        success: false,
        error: "roomId and sessionId are required",
      };
    }

    const authResult = await getAuthUserId();
    if (!authResult.success || !authResult.data) {
      return {
        success: false,
        error: authResult.success ? "Unauthorized" : authResult.error,
      };
    }

    const accessResult = await assertCanManageTranscriptions(
      authResult.data,
      roomId,
    );
    if (!accessResult.success) {
      return accessResult;
    }

    const token = await createToken();
    if (!token) {
      return {
        success: false,
        error: "Failed to generate VideoSDK token",
      };
    }

    const url = `https://api.videosdk.live/ai/v1/post-transcriptions/?roomId=${encodeURIComponent(
      roomId,
    )}&sessionId=${encodeURIComponent(sessionId)}&page=${page}&perPage=${perPage}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
    });

    const data = (await response
      .json()
      .catch(() => ({}))) as TranscriptionListResponse;

    if (!response.ok) {
      return {
        success: false,
        error: "Failed to fetch transcription summary",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error("Unexpected error in getTranscriptionAndSummary:", err);
    return {
      success: false,
      error: "Failed to fetch transcription summary",
    };
  }
};

export const fetchTranscriptionText = async (
  cdnUrl: string,
): Promise<Result<string>> => {
  try {
    if (!cdnUrl) {
      return {
        success: false,
        error: "CDN URL is required",
      };
    }

    const response = await fetch(cdnUrl);

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch transcription text: ${response.status}`,
      };
    }

    const text = await response.text();

    return {
      success: true,
      data: text,
    };
  } catch (err) {
    console.error("Unexpected error in fetchTranscriptionText:", err);
    return {
      success: false,
      error: "Failed to fetch transcription text from CDN",
    };
  }
};
