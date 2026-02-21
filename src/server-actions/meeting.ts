"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { headers } from "next/headers";
import { Result } from "@/types/returnType";
import {
  Meeting,
  MeetingParticipant,
  MeetingEvent,
  ParticipantDisplayData,
} from "@/types/meeting";

/**
 * Create a new meeting record when first participant joins
 * @param videoSdkMeetingId - The VideoSDK meeting ID
 * @param creatorId - The user ID of the meeting creator
 * @returns Result with meeting record or error
 */
export const createMeeting = async (
  videoSdkMeetingId: string,
  creatorId?: string,
): Promise<Result<Meeting>> => {
  try {
    // Get session if creator ID not provided
    let userId = creatorId;
    if (!userId) {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (!session?.user?.id) {
        return {
          success: false,
          error: "Not authenticated",
        };
      }
      userId = session.user.id;
    }

    // Check if meeting already exists
    const { data: existingMeeting } = await supabaseAdmin
      .from("meetings")
      .select("*")
      .eq("video_sdk_meeting_id", videoSdkMeetingId)
      .maybeSingle();

    if (existingMeeting) {
      return {
        success: true,
        data: existingMeeting as Meeting,
      };
    }

    // Create new meeting
    const { data: newMeeting, error } = await supabaseAdmin
      .from("meetings")
      .insert({
        video_sdk_meeting_id: videoSdkMeetingId,
        creator_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating meeting:", error);
      return {
        success: false,
        error: error.message || "Failed to create meeting",
      };
    }

    return {
      success: true,
      data: newMeeting as Meeting,
    };
  } catch (err) {
    console.error("Unexpected error in createMeeting:", err);
    return {
      success: false,
      error: "An unexpected error occurred while creating the meeting",
    };
  }
};

/**
 * Add a participant to a meeting (creates new session record on rejoin)
 * @param meetingId - The meeting UUID
 * @param userId - The participant user ID
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
    // Check if user is already in the meeting (NULL left_at means still active)
    const { data: activeParticipant } = await supabaseAdmin
      .from("meeting_participants")
      .select("*")
      .eq("meeting_id", meetingId)
      .eq("user_id", userId)
      .is("left_at", null)
      .maybeSingle();

    if (activeParticipant) {
      // User already in meeting, return existing record
      return {
        success: true,
        data: activeParticipant as MeetingParticipant,
      };
    }

    // Create new participant record (supports rejoins as separate sessions)
    const { data: newParticipant, error } = await supabaseAdmin
      .from("meeting_participants")
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
      .from("meeting_participants")
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
      .from("meeting_participants")
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

export type MeetingEventType =
  | "join"
  | "leave"
  | "hand_raise"
  | "hand_lower"
  | "mic_on"
  | "mic_off"
  | "camera_on"
  | "camera_off";

/**
 * Record a meeting event (participant actions within meeting)
 * @param meetingId - The meeting UUID
 * @param userId - The user ID who triggered the event
 * @param eventType - Type of event
 * @param eventData - Optional JSON data for the event
 * @returns Result with event record or error
 */
export const recordMeetingEvent = async (
  meetingId: string,
  userId: string,
  eventType: MeetingEventType,
  eventData?: Record<string, any>,
): Promise<Result<MeetingEvent>> => {
  try {
    const { data: newEvent, error } = await supabaseAdmin
      .from("meeting_events")
      .insert({
        meeting_id: meetingId,
        user_id: userId,
        event_type: eventType,
        event_data: eventData || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error recording meeting event:", error);
      return {
        success: false,
        error: error.message || "Failed to record meeting event",
      };
    }

    return {
      success: true,
      data: newEvent as MeetingEvent,
    };
  } catch (err) {
    console.error("Unexpected error in recordMeetingEvent:", err);
    return {
      success: false,
      error: "An unexpected error occurred while recording event",
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
      .from("meetings")
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
 * @param videoSdkMeetingId - The VideoSDK meeting ID
 * @returns Result with meeting record or error
 */
export const getMeetingByVideoSdkId = async (
  videoSdkMeetingId: string,
): Promise<Result<Meeting>> => {
  try {
    const { data: meeting, error } = await supabaseAdmin
      .from("meetings")
      .select("*")
      .eq("video_sdk_meeting_id", videoSdkMeetingId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching meeting by VideoSDK ID:", error);
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
    console.error("Unexpected error in getMeetingByVideoSdkId:", err);
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
      .from("meeting_participants")
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
      .from("meeting_participants")
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
 * Get all events from a meeting
 * @param meetingId - The meeting UUID
 * @param userId - Optional: filter events for specific user
 * @returns Result with array of event records
 */
export const getMeetingEvents = async (
  meetingId: string,
  userId?: string,
): Promise<Result<MeetingEvent[]>> => {
  try {
    let query = supabaseAdmin
      .from("meeting_events")
      .select("*")
      .eq("meeting_id", meetingId);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: events, error } = await query.order("created_at", {
      ascending: true,
    });

    if (error) {
      console.error("Error fetching meeting events:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch meeting events",
      };
    }

    return {
      success: true,
      data: (events || []) as MeetingEvent[],
    };
  } catch (err) {
    console.error("Unexpected error in getMeetingEvents:", err);
    return {
      success: false,
      error: "An unexpected error occurred while fetching meeting events",
    };
  }
};

/**
 * Get events of specific type from a meeting
 * @param meetingId - The meeting UUID
 * @param eventType - Type of events to filter
 * @returns Result with array of event records
 */
export const getMeetingEventsByType = async (
  meetingId: string,
  eventType: MeetingEventType,
): Promise<Result<MeetingEvent[]>> => {
  try {
    const { data: events, error } = await supabaseAdmin
      .from("meeting_events")
      .select("*")
      .eq("meeting_id", meetingId)
      .eq("event_type", eventType)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching meeting events by type:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch meeting events",
      };
    }

    return {
      success: true,
      data: (events || []) as MeetingEvent[],
    };
  } catch (err) {
    console.error("Unexpected error in getMeetingEventsByType:", err);
    return {
      success: false,
      error: "An unexpected error occurred while fetching meeting events",
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
      .from("meetings")
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

/**
 * Get meeting statistics (total participants, events count)
 * @param meetingId - The meeting UUID
 * @returns Result with meeting stats
 */
export const getMeetingStats = async (
  meetingId: string,
): Promise<
  Result<{
    totalParticipants: number;
    uniqueParticipants: number;
    eventCount: number;
  }>
> => {
  try {
    // Get all participant sessions
    const { data: participants, error: participantError } = await supabaseAdmin
      .from("meeting_participants")
      .select("user_id")
      .eq("meeting_id", meetingId);

    if (participantError) {
      return {
        success: false,
        error: participantError.message || "Failed to fetch participants",
      };
    }

    // Get unique participant count
    const uniqueParticipants = new Set(
      (participants || []).map((p) => p.user_id),
    ).size;

    // Get event count
    const { count: eventCount, error: eventError } = await supabaseAdmin
      .from("meeting_events")
      .select("*", { count: "exact", head: true })
      .eq("meeting_id", meetingId);

    if (eventError) {
      return {
        success: false,
        error: eventError.message || "Failed to fetch event count",
      };
    }

    return {
      success: true,
      data: {
        totalParticipants: participants?.length || 0,
        uniqueParticipants,
        eventCount: eventCount || 0,
      },
    };
  } catch (err) {
    console.error("Unexpected error in getMeetingStats:", err);
    return {
      success: false,
      error: "An unexpected error occurred while fetching meeting stats",
    };
  }
};
