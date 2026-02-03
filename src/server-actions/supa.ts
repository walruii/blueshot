"use server";
import { TEventDB, TEventMap } from "@/types/eventTypes";
import supabase from "@/supabase";
import { PostgrestSingleResponse } from "@supabase/supabase-js";

export const getEvents = async (): Promise<TEventMap> => {
  const { data: events }: PostgrestSingleResponse<TEventDB[]> = await supabase
    .from("events")
    .select();
  if (!events) {
    return new Map();
  }
  const eveMap = eventsToMap(events);
  return eveMap;
};

const eventsToMap = (events: TEventDB[]): TEventMap => {
  const newMap: TEventMap = new Map();
  events.forEach((item: TEventDB) => {
    const existing = newMap.get(item.date) || [];
    newMap.set(item.date, [
      ...existing,
      {
        id: item.id,
        title: item.title,
        status: item.status,
        startTime: item.start_time ? new Date(item.start_time) : null,
        endTime: item.end_time ? new Date(item.end_time) : null,
      },
    ]);
  });
  return newMap;
};

export const changeStatus = async (
  id: string,
  status: TEventDB["status"],
): Promise<ResultObject<TEventDB>> => {
  try {
    const { data, error }: PostgrestSingleResponse<TEventDB | null> =
      await supabase
        .from("events")
        .update({ status })
        .eq("id", id)
        .select()
        .maybeSingle();

    if (error) {
      console.error(error);
      return { success: false, error: "Failed to get data from the server" };
    }
    if (!data) {
      return { success: false, error: "Could not find the event" };
    }
    return { success: true, data };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Internal Server Error" };
  }
};

export const deleteEvent = async (
  id: string,
): Promise<ResultObject<TEventDB>> => {
  try {
    const { data, error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return { success: false, error: "Failed to get data from the server" };
    }
    return { success: true, data };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Internal Server Error" };
  }
};
