"use server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  EventParticipant,
  EventParticipantWithUserDB,
} from "@/types/eventParticipantType";
import { Result } from "@/types/returnType";
import { formatEventParticipants } from "@/utils/transformers";
import { PostgrestSingleResponse } from "@supabase/supabase-js";

export const getEventMembers = async (
  eventId: string,
): Promise<Result<EventParticipant[]>> => {
  const {
    data: eventMembers,
    error: eventParticipantDBError,
  }: PostgrestSingleResponse<EventParticipantWithUserDB[]> = await supabaseAdmin
    .from("event_participant")
    .select(
      `id, user!inner ( id, email ), event_id, mail_sent, acknowledgement`,
    )
    .eq("event_id", eventId);

  if (eventParticipantDBError) {
    console.error(
      "Failed to fetch event Participants: ",
      eventParticipantDBError,
    );
    return { success: false, error: "DB Error fetcting participants" };
  }

  if (!eventMembers || !Array.isArray(eventMembers)) {
    console.warn("eventMembers is not an array:", eventMembers);
    return { success: true, data: [] };
  }

  if (eventMembers.length === 0) {
    return { success: true, data: [] };
  }

  const members: EventParticipant[] = formatEventParticipants(eventMembers);
  return { success: true, data: members };
};
