"use server";

import { auth } from "@/lib/auth";
import {
  generateMeetingSummary,
  type MeetingSummaryChatMessage,
  type MeetingSummaryTranscriptSegment,
} from "@/lib/gemini";
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

interface PersistedTranscriptSegment {
  id: string;
  participantName: string;
  text: string;
  spokenAt: string;
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

const assertCanAccessMeeting = async (
  userId: string,
  meetingDbId: string,
): Promise<Result<true>> => {
  const { data, error } = await supabaseAdmin.rpc("can_access_meeting", {
    p_meeting_id: meetingDbId,
    p_user_id: userId,
  });

  if (error) {
    return {
      success: false,
      error: "Failed to verify meeting access",
    };
  }

  if (!data) {
    return {
      success: false,
      error: "You do not have access to this meeting",
    };
  }

  return {
    success: true,
    data: true,
  };
};

const fetchMeetingTranscriptSegmentsInternal = async (
  meetingDbId: string,
): Promise<Result<PersistedTranscriptSegment[]>> => {
  const { data, error } = await supabaseAdmin
    .from("meeting_transcript_segment")
    .select("id, participant_name, text, spoken_at")
    .eq("meeting_id", meetingDbId)
    .order("spoken_at", { ascending: true });

  if (error) {
    return {
      success: false,
      error: "Failed to load meeting transcript segments",
    };
  }

  return {
    success: true,
    data: data.map((segment) => ({
      id: segment.id,
      participantName: segment.participant_name,
      text: segment.text,
      spokenAt: segment.spoken_at,
    })),
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

export const saveTranscriptSegment = async (
  meetingDbId: string,
  participantName: string,
  text: string,
  spokenAt: string,
): Promise<Result<{ id: string }>> => {
  try {
    if (!meetingDbId || !participantName || !text || !spokenAt) {
      return {
        success: false,
        error: "meetingDbId, participantName, text, and spokenAt are required",
      };
    }

    const authResult = await getAuthUserId();
    if (!authResult.success || !authResult.data) {
      return {
        success: false,
        error: authResult.success ? "Unauthorized" : authResult.error,
      };
    }

    const accessResult = await assertCanAccessMeeting(
      authResult.data,
      meetingDbId,
    );
    if (!accessResult.success) {
      return accessResult;
    }

    const { data, error } = await supabaseAdmin
      .from("meeting_transcript_segment")
      .insert({
        meeting_id: meetingDbId,
        participant_name: participantName,
        text,
        spoken_at: spokenAt,
      })
      .select("id")
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "Failed to save transcript segment",
      };
    }

    return {
      success: true,
      data: {
        id: data.id,
      },
    };
  } catch (err) {
    console.error("Unexpected error in saveTranscriptSegment:", err);
    return {
      success: false,
      error: "Failed to save transcript segment",
    };
  }
};

export const getMeetingTranscripts = async (
  meetingDbId: string,
): Promise<Result<PersistedTranscriptSegment[]>> => {
  try {
    if (!meetingDbId) {
      return {
        success: false,
        error: "meetingDbId is required",
      };
    }

    const authResult = await getAuthUserId();
    if (!authResult.success || !authResult.data) {
      return {
        success: false,
        error: authResult.success ? "Unauthorized" : authResult.error,
      };
    }

    const accessResult = await assertCanAccessMeeting(
      authResult.data,
      meetingDbId,
    );
    if (!accessResult.success) {
      return accessResult;
    }

    return fetchMeetingTranscriptSegmentsInternal(meetingDbId);
  } catch (err) {
    console.error("Unexpected error in getMeetingTranscripts:", err);
    return {
      success: false,
      error: "Failed to fetch meeting transcripts",
    };
  }
};

export const summarizeMeetingContent = async (
  meetingDbId: string,
): Promise<Result<{ summary: string }>> => {
  try {
    if (!meetingDbId) {
      return {
        success: false,
        error: "meetingDbId is required",
      };
    }

    const authResult = await getAuthUserId();
    if (!authResult.success || !authResult.data) {
      return {
        success: false,
        error: authResult.success ? "Unauthorized" : authResult.error,
      };
    }

    const accessResult = await assertCanAccessMeeting(
      authResult.data,
      meetingDbId,
    );
    if (!accessResult.success) {
      return accessResult;
    }

    const { data: messages, error: messagesError } = await supabaseAdmin
      .from("message")
      .select("content, created_at, deleted_at, user!inner(name, email)")
      .eq("meeting_id", meetingDbId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      return {
        success: false,
        error: "Failed to fetch meeting chat",
      };
    }

    const transcriptResult =
      await fetchMeetingTranscriptSegmentsInternal(meetingDbId);
    if (!transcriptResult.success) {
      return {
        success: false,
        error: transcriptResult.error ?? "Failed to load transcript segments",
      };
    }

    const transcriptSegmentsData = transcriptResult.data ?? [];

    const chatMessages: MeetingSummaryChatMessage[] = messages.map(
      (message) => ({
        senderName: message.user.name ?? message.user.email ?? "Unknown User",
        content: message.deleted_at ? "[Message deleted]" : message.content,
        at: new Date(message.created_at).toLocaleTimeString(),
      }),
    );

    const transcriptSegments: MeetingSummaryTranscriptSegment[] =
      transcriptSegmentsData.map((segment) => ({
        participantName: segment.participantName,
        text: segment.text,
        at: new Date(segment.spokenAt).toLocaleTimeString(),
      }));

    const summary = await generateMeetingSummary(
      chatMessages,
      transcriptSegments,
    );

    return {
      success: true,
      data: {
        summary,
      },
    };
  } catch (err) {
    console.error("Unexpected error in summarizeMeetingContent:", err);
    return {
      success: false,
      error: "Failed to summarize meeting content",
    };
  }
};
