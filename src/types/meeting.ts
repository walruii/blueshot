/**
 * Meeting and Participant types
 */

export interface Meeting {
  id: string;
  video_sdk_meeting_id: string;
  creator_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  is_moderator: boolean;
  mic_enabled_at_join: boolean;
  camera_enabled_at_join: boolean;
  duration_seconds: number | null;
  created_at: string;
  user?: {
    name: string;
    email: string;
    image: string | null;
  };
}

export interface MeetingEvent {
  id: string;
  meeting_id: string;
  user_id: string;
  event_type:
    | "join"
    | "leave"
    | "hand_raise"
    | "hand_lower"
    | "mic_on"
    | "mic_off"
    | "camera_on"
    | "camera_off";
  event_data: Record<string, any> | null;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

export interface ParticipantDisplayData {
  participantId: string;
  name: string;
  email?: string;
  image?: string | null;
  isModerator: boolean;
  joinedAt: Date;
  isActiveSpeaker: boolean;
  micEnabled: boolean;
  cameraEnabled: boolean;
  micEnabledAtJoin: boolean;
  cameraEnabledAtJoin: boolean;
}

export interface MeetingContextType {
  meetingId: string;
  videoSdkMeetingId: string;
  participants: ParticipantDisplayData[];
  activeParticipantCount: number;
  isLoading: boolean;
  error: string | null;
}
