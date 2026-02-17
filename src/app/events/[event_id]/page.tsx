import { getEvent } from "@/server-actions/event";
import { dateToTimeString } from "@/utils/dateUtil";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import AcknowledgementButton from "../../app/AcknowledgementButton";
import DeleteEvent from "./DeleteEvent";
import {
  getUserEventState,
  getUserEventStates,
} from "@/server-actions/userStateEvent";
import { EventMember } from "@/types/userEventState";
import LoadingEventPage from "@/app/(loading)/LoadingEventPage";
import EventEditMode from "./EventEditMode";
import { getEventPermissions } from "@/server-actions/utils/permissionUtils";

export default async function Page({
  params,
}: {
  params: { event_id: string };
}) {
  return (
    <Suspense fallback={<LoadingEventPage />}>
      <PageAsync params={params} />
    </Suspense>
  );
}

async function PageAsync({ params }: { params: { event_id: string } }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/auth/signin");

  const { event_id } = await params;
  const event = await getEvent(event_id);

  if (!event) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white text-xl">Event not found</div>
      </div>
    );
  }

  // Get user's permissions for this event
  const permissions = event
    ? await getEventPermissions(session.user.id, event_id)
    : {
        canEdit: false,
        canDelete: false,
        canManageAccess: false,
        isOwner: false,
        isEventCreator: false,
      };

  const ues = await getUserEventState(event_id);

  const eventMembers = await getUserEventStates(event_id);

  const canShowAck = (): boolean => {
    if (session?.user.id === event.createdBy) return false;
    if (!ues) return false;
    if (ues.acknowledgedAt) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/app"
            className="inline-block bg-muted hover:bg-muted/80 font-semibold py-2 px-6 rounded-lg transition"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {canShowAck() && (
          <div className="bg-card rounded-xl p-8 border mb-6 flex justify-between items-center">
            <p>You Haven&apos;t Acknowledged the Event!</p>
            <AcknowledgementButton eventParticipateId={ues?.id ?? null} />
          </div>
        )}

        {/* Event Details Card */}
        <div className="bg-card rounded-xl p-8 border mb-6">
          <h1 className="text-4xl font-bold mb-6">{event.title}</h1>
          {/* Event Info Grid */}
          <div className="space-y-4">
            {/* Description */}
            <div>
              <label className="text-muted-foreground text-sm font-medium block mb-2">
                Description
              </label>
              <p className="text-lg">{event.description}</p>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-muted-foreground text-sm font-medium block mb-2">
                  From
                </label>
                <p className="text-lg">{dateToTimeString(event.from)}</p>
              </div>
              {event.type === "default" ? (
                <div>
                  <label className="text-muted-foreground text-sm font-medium block mb-2">
                    To
                  </label>
                  <p className="text-lg">
                    {event.to ? dateToTimeString(event.to) : "N/A"}
                  </p>
                </div>
              ) : (
                <div>All Day Event</div>
              )}
              <div>
                <label className="text-muted-foreground text-sm font-medium block mb-2">
                  Created by:
                </label>
                <p className="text-lg" title={event.eventUserEmail}>
                  {event.eventUserName}
                </p>
              </div>
            </div>
          </div>
          {permissions.canDelete && <DeleteEvent event={event} />}
          {/* Edit Permissions (Users with canManageAccess) */}
          {permissions.canManageAccess && <EventEditMode event={event} />}
        </div>

        {/* Members Section */}
        <div className="bg-card rounded-xl p-8 border">
          <h2 className="text-2xl font-bold mb-6">Event Members</h2>

          {permissions.canManageAccess ? (
            /* Creator View - Shows mail status and acknowledgment */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-muted-foreground font-medium py-3 px-4">
                      Member Email
                    </th>
                    <th className="text-center text-muted-foreground font-medium py-3 px-4">
                      Notification Sent
                    </th>
                    <th className="text-center text-muted-foreground font-medium py-3 px-4">
                      Acknowledged
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {eventMembers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-center text-muted-foreground py-8"
                      >
                        No members yet
                      </td>
                    </tr>
                  ) : (
                    eventMembers.map((m: EventMember) => {
                      return (
                        <tr
                          key={m.id}
                          className="border-b border-border hover:bg-muted/50 transition"
                        >
                          <td className="py-4 px-4">{m.userEmail}</td>
                          {m.userId !== event.createdBy && (
                            <>
                              <td className="text-center py-4 px-4">
                                {m.eventSentAt ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-900/30 text-green-400">
                                    ✓ Sent
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-900/30 text-red-400">
                                    ✗ Not Sent
                                  </span>
                                )}
                              </td>
                              <td className="text-center py-4 px-4">
                                {m.acknowledgedAt ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-900/30 text-blue-400">
                                    ✓ Acknowledged
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-muted text-muted-foreground">
                                    Pending
                                  </span>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Regular Member View - Simple list */
            <div className="space-y-2">
              {eventMembers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No members in this event
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {eventMembers.map((m: EventMember) => (
                    <div
                      key={m.id}
                      className="bg-muted px-4 py-2 rounded-full text-sm"
                    >
                      {m.userEmail}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
