"use server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Database } from "@/types/database.types";
import { formatNotification } from "@/types/notification";
import { PermissionEntry } from "@/types/permission";
import { headers } from "next/headers";
import { Result } from "@/types/returnType";

export const getNotifications = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) return [];

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id!)
      .is("archived", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting notifications", error);
      return [];
    }

    return data.map(formatNotification);
  } catch (err) {
    console.error(err);
    return [];
  }
};

export async function getAffectedUserIds(
  eventDb: Database["public"]["Tables"]["event"]["Row"],
  permissions?: PermissionEntry[],
): Promise<Set<string>> {
  const userIds = new Set<string>();
  const queries: Promise<void>[] = [];

  const emails =
    permissions?.filter((p) => p.type === "email").map((e) => e.identifier) ||
    [];
  if (emails.length > 0) {
    queries.push(
      (async () => {
        const { data } = await supabaseAdmin
          .from("user")
          .select("id")
          .in("email", emails);
        data?.forEach((u) => userIds.add(u.id));
      })(),
    );
  }

  queries.push(
    (async () => {
      const { data } = await supabaseAdmin
        .from("view_all_event_access")
        .select("user_id")
        .eq("event_id", eventDb.id);

      data?.forEach((row) => {
        if (row.user_id) userIds.add(row.user_id);
      });
    })(),
  );

  await Promise.all(queries);
  return userIds;
}

export async function notifyAffectedUsers(
  eventDb: Database["public"]["Tables"]["event"]["Row"],
  notifyType: "NEW_EVENT" | "DELETE_EVENT",
  permissions?: PermissionEntry[],
): Promise<void> {
  try {
    const userIdsSet = await getAffectedUserIds(eventDb, permissions);

    // Remove the creator so they don't notify themselves
    userIdsSet.delete(eventDb.created_by);

    const userIds = Array.from(userIdsSet);

    // Parallel broadcast
    await Promise.all(
      userIds.map((userId) =>
        supabaseAdmin.channel(`user_inbox_${userId}`).send({
          type: "broadcast",
          event: notifyType,
          payload: { title: eventDb.title, from: eventDb.from },
        }),
      ),
    );

    console.log(`Successfully notified ${userIds.length} users.`);
  } catch (err) {
    console.error("Error in notifyAffectedUsers:", err);
  }
}

export const archiveNotification = async (
  id: string,
): Promise<Result<null>> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session)
      return { success: false, error: "Invalid session. Try again later." };

    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ archived: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error archiving notification:", error);
      return { success: false, error: "Failed to archive notification" };
    }

    return { success: true };
  } catch (err) {
    console.error("Error in archiveNotification:", err);
    return {
      success: false,
      error: "Internal server error archiving notification",
    };
  }
};
