"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { headers } from "next/headers";
import { Result } from "@/types/returnType";
import { Meeting, MeetingParticipant, MeetingEvent } from "@/types/meeting";
import { createRoom } from "./videosdk";

/**
 * Add a participant to a meeting (creates new session record on rejoin)
 * @param meetingId - The meeting UUID
 * @param userId - The participant user ID (required - registered users only)
 * @param micEnabled - Whether microphone was enabled at join
 * @param cameraEnabled - Whether camera was enabled at join
 * @returns Result with participant record or error
 */
export const addParticipant = async (
  meetingId: string,
  userId: string,
  micEnabled: boolean = false,
  cameraEnabled: boolean = false,
): Promise<Result<MeetingParticipant>> => {
  try {
    // Check if participant is already in the meeting (NULL left_at means still active)
    const { data: activeParticipant } = await supabaseAdmin
      .from("meeting_participant")
      .select("*")
      .eq("meeting_id", meetingId)
      .eq("user_id", userId)
      .is("left_at", null)
      .maybeSingle();

    if (activeParticipant) {
      // Participant already in meeting, return existing record
      return {
        success: true,
        data: activeParticipant as MeetingParticipant,
      };
    }

    // Create new participant record (supports rejoins as separate sessions)
    const { data: newParticipant, error } = await supabaseAdmin
      .from("meeting_participant")
      .insert({
        meeting_id: meetingId,
        user_id: userId,
        mic_enabled_at_join: micEnabled,
        camera_enabled_at_join: cameraEnabled,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding participant:", error);
      return {
        success: false,
        error: error.message || "Failed to add participant",
      };
    }

    return {
      success: true,
      data: newParticipant as MeetingParticipant,
    };
  } catch (err) {
    console.error("Unexpected error in addParticipant:", err);
    return {
      success: false,
      error: "An unexpected error occurred while adding participant",
    };
  }
};

/**
 * Record participant leaving (updates left_at)
 * @param meetingId - The meeting UUID
 * @param userId - The participant user ID
 * @returns Result with updated participant record or error
 */
export const recordParticipantLeave = async (
  meetingId: string,
  userId: string,
): Promise<Result<MeetingParticipant>> => {
  try {
    // Find active participant session (NULL left_at)
    const { data: activeParticipant, error: fetchError } = await supabaseAdmin
      .from("meeting_participant")
      .select("*")
      .eq("meeting_id", meetingId)
      .eq("user_id", userId)
      .is("left_at", null)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching participant:", fetchError);
      return {
        success: false,
        error: fetchError.message || "Failed to fetch participant",
      };
    }

    if (!activeParticipant) {
      return {
        success: false,
        error: "Participant session not found",
      };
    }

    // Update participant record
    const { data: updatedParticipant, error: updateError } = await supabaseAdmin
      .from("meeting_participant")
      .update({
        left_at: new Date().toISOString(),
      })
      .eq("id", activeParticipant.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating participant leave:", updateError);
      return {
        success: false,
        error: updateError.message || "Failed to update participant leave",
      };
    }

    return {
      success: true,
      data: updatedParticipant as MeetingParticipant,
    };
  } catch (err) {
    console.error("Unexpected error in recordParticipantLeave:", err);
    return {
      success: false,
      error: "An unexpected error occurred while recording participant leave",
    };
  }
};

/**
 * Get a meeting by ID with basic information
 * @param meetingId - The meeting UUID
 * @returns Result with meeting record or error
 */
export const getMeetingById = async (
  meetingId: string,
): Promise<Result<Meeting>> => {
  try {
    const { data: meeting, error } = await supabaseAdmin
      .from("meeting")
      .select("*")
      .eq("id", meetingId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching meeting:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch meeting",
      };
    }

    if (!meeting) {
      return {
        success: false,
        error: "Meeting not found",
      };
    }

    return {
      success: true,
      data: meeting as Meeting,
    };
  } catch (err) {
    console.error("Unexpected error in getMeetingById:", err);
    return {
      success: false,
      error: "An unexpected error occurred while fetching meeting",
    };
  }
};

/**
 * Get meeting by VideoSDK meeting ID
 * @param roomId - The VideoSDK meeting ID
 * @returns Result with meeting record or error
 */
export const getMeetingByRoomId = async (
  roomId: string,
): Promise<Result<Meeting>> => {
  try {
    const { data: meeting, error } = await supabaseAdmin
      .from("meeting")
      .select("*")
      .eq("room_id", roomId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching meeting by room ID:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch meeting",
      };
    }

    if (!meeting) {
      return {
        success: false,
        error: "Meeting not found",
      };
    }

    return {
      success: true,
      data: meeting as Meeting,
    };
  } catch (err) {
    console.error("Unexpected error in getMeetingByRoomId:", err);
    return {
      success: false,
      error: "An unexpected error occurred while fetching meeting",
    };
  }
};

/**
 * Get all participants in a meeting (includes past sessions for rejoins)
 * @param meetingId - The meeting UUID
 * @returns Result with array of participant records
 */
export const getParticipants = async (
  meetingId: string,
): Promise<Result<MeetingParticipant[]>> => {
  try {
    const { data: participants, error } = await supabaseAdmin
      .from("meeting_participant")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Error fetching participants:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch participants",
      };
    }

    return {
      success: true,
      data: (participants || []) as MeetingParticipant[],
    };
  } catch (err) {
    console.error("Unexpected error in getParticipants:", err);
    return {
      success: false,
      error: "An unexpected error occurred while fetching participants",
    };
  }
};

/**
 * Get active participants in a meeting (still in meeting, NULL left_at)
 * @param meetingId - The meeting UUID
 * @returns Result with array of active participant records
 */
export const getActiveParticipants = async (
  meetingId: string,
): Promise<Result<MeetingParticipant[]>> => {
  try {
    const { data: participants, error } = await supabaseAdmin
      .from("meeting_participant")
      .select("*")
      .eq("meeting_id", meetingId)
      .is("left_at", null)
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Error fetching active participants:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch active participants",
      };
    }

    return {
      success: true,
      data: (participants || []) as MeetingParticipant[],
    };
  } catch (err) {
    console.error("Unexpected error in getActiveParticipants:", err);
    return {
      success: false,
      error: "An unexpected error occurred while fetching active participants",
    };
  }
};

/**
 * End a meeting (set ended_at)
 * @param meetingId - The meeting UUID
 * @returns Result with updated meeting record
 */
export const endMeeting = async (
  meetingId: string,
): Promise<Result<Meeting>> => {
  try {
    // Update meeting with end time
    const { data: updatedMeeting, error: updateError } = await supabaseAdmin
      .from("meeting")
      .update({
        ended_at: new Date().toISOString(),
      })
      .eq("id", meetingId)
      .select()
      .single();

    if (updateError) {
      console.error("Error ending meeting:", updateError);
      return {
        success: false,
        error: updateError.message || "Failed to end meeting",
      };
    }

    return {
      success: true,
      data: updatedMeeting as Meeting,
    };
  } catch (err) {
    console.error("Unexpected error in endMeeting:", err);
    return {
      success: false,
      error: "An unexpected error occurred while ending the meeting",
    };
  }
};

export const provisionMeeting = async (): Promise<Result<Meeting>> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return { success: false, error: "Invalid session" };

    const result = await createRoom();
    if (!result.success) {
      return result;
    }
    if (!result.data) {
      return {
        success: false,
        error: "Failed to generate meeting token",
      };
    }

    // Create new meeting
    const { data: newMeeting, error } = await supabaseAdmin
      .from("meeting")
      .insert({
        room_id: result.data, // roomId returned from createRoom is used as room_id in meeting table
        creator_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating meeting for event:", error);
      return {
        success: false,
        error: error.message || "Failed to create meeting for event",
      };
    }

    return {
      success: true,
      data: newMeeting as Meeting,
    };
  } catch (err) {
    console.error("Unexpected error in createMeetingForEvent:", err);
    return {
      success: false,
      error: "An unexpected error occurred while creating meeting for event",
    };
  }
};

export const validateMeetingPasscode = async (
  meetingId: string,
  passcode: string,
  userId: string,
  ipAddress: string,
): Promise<Result<{ valid: boolean }>> => {
  try {
    // Get client IP for rate limiting
    const headerList = await headers();
    const ip =
      ipAddress ||
      headerList.get("x-forwarded-for")?.split(",")[0].trim() ||
      "unknown";

    // Check rate limiting: 5 attempts per IP per 15 minutes
    const fifteenMinutesAgo = new Date(
      Date.now() - 15 * 60 * 1000,
    ).toISOString();
    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from("passcode_attempt")
      .select("id", { count: "exact" })
      .eq("meeting_id", meetingId)
      .eq("ip_address", ip)
      .gte("attempted_at", fifteenMinutesAgo);

    if (attemptsError) {
      console.error("Error checking rate limit:", attemptsError);
      return {
        success: false,
        error: "Failed to validate attempt",
      };
    }

    if ((attempts?.length || 0) >= 5) {
      return {
        success: false,
        error: "Too many failed attempts. Please try again in 15 minutes.",
      };
    }

    // Fetch meeting and validate passcode
    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from("meeting")
      .select("id, passcode")
      .eq("id", meetingId)
      .maybeSingle();

    if (meetingError) {
      console.error(
        "Error fetching meeting for passcode validation:",
        meetingError,
      );
      return {
        success: false,
        error: meetingError.message || "Failed to validate passcode",
      };
    }

    if (!meeting) {
      return {
        success: false,
        error: "Meeting not found",
      };
    }

    // Validate passcode
    if (meeting.passcode !== passcode) {
      // Record failed attempt
      const { error: recordError } = await supabaseAdmin
        .from("passcode_attempt")
        .insert({
          meeting_id: meetingId,
          ip_address: ip,
        });

      if (recordError) {
        console.error("Error recording passcode attempt:", recordError);
      }

      return {
        success: false,
        error: "Invalid passcode",
      };
    }

    // Passcode is valid - registered user can join
    return {
      success: true,
      data: {
        valid: true,
      },
    };
  } catch (err) {
    console.error("Unexpected error in validateMeetingPasscode:", err);
    return {
      success: false,
      error: "An unexpected error occurred while validating passcode",
    };
  }
};

/**
 * Get external participant status for meeting participants
 * Determines which participants don't have access to the event
 * @param meetingDbId - The meeting UUID
 * @param participantIds - Array of participant user IDs
 * @returns Map of userId to isExternal boolean
 */
export const getExternalParticipantStatus = async (
  meetingDbId: string,
  participantIds: string[],
): Promise<Result<{ [userId: string]: boolean }>> => {
  try {
    // Get the event for this meeting
    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from("meeting")
      .select("id")
      .eq("id", meetingDbId)
      .maybeSingle();

    if (meetingError || !meeting) {
      console.error("Failed to get meeting:", meetingError);
      return {
        success: false,
        error: "Meeting not found",
      };
    }

    // Get the event associated with this meeting
    const { data: event, error: eventError } = await supabaseAdmin
      .from("event")
      .select("id")
      .eq("meeting_id", meeting.id)
      .maybeSingle();

    if (eventError || !event) {
      console.error("Failed to get event:", eventError);
      return {
        success: false,
        error: "Event not found",
      };
    }

    // Get all users with access to this event
    const { data: accessList, error: accessError } = await supabaseAdmin
      .from("view_all_event_access")
      .select("user_id")
      .eq("event_id", event.id);

    if (accessError) {
      console.error("Failed to get access list:", accessError);
      return {
        success: false,
        error: "Failed to fetch access list",
      };
    }

    // Create a set of user IDs with access
    const usersWithAccess = new Set(accessList?.map((a) => a.user_id) || []);

    // Mark participants as external if they don't have access
    const externalStatus: { [userId: string]: boolean } = {};
    participantIds.forEach((participantId) => {
      // Skip local user indicator
      if (!participantId.includes("(")) {
        externalStatus[participantId] = !usersWithAccess.has(participantId);
      }
    });

    return {
      success: true,
      data: externalStatus,
    };
  } catch (err) {
    console.error("Error fetching external participant status:", err);
    return {
      success: false,
      error: "An unexpected error occurred while fetching participant status",
    };
  }
};
