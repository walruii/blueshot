"use server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  EventMember,
  formatEventMembers,
  formatUserEventState,
  UserEventState,
} from "@/types/userEventState";
import { headers } from "next/headers";

export const getUserEventState = async (
  eventId: string,
): Promise<UserEventState | null> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) return null;
    const { data: ack, error } = await supabaseAdmin
      .rpc("get_user_event_state", {
        requesting_user_id: session.user.id,
        target_event_id: eventId,
      })
      .maybeSingle();
    if (error) {
      console.error("getAckt DB Error", error);
      return null;
    }
    if (!ack) {
      return null;
    }
    return formatUserEventState(ack);
  } catch (err) {
    console.error("getAcknowledgement failed with", err);
    return null;
  }
};

export const getUserEventStates = async (
  eventId: string,
): Promise<EventMember[]> => {
  try {
    const { data: acks, error } = await supabaseAdmin.rpc("get_event_members", {
      target_event_id: eventId,
    });
    if (error) {
      console.error("getAckts DB Error", error);
      return [];
    }
    if (!acks) {
      return [];
    }
    return formatEventMembers(acks);
  } catch (err) {
    console.error("getAcknowledgements failed with", err);
    return [];
  }
};
