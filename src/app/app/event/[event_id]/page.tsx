import { getEvent } from "@/server-actions/event";
import { dateToTimeString } from "@/utils/dateUtil";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import AcknowledgementButton from "@/app/app/AcknowledgementButton";
import DeleteEvent from "./DeleteEvent";
import {
  getUserEventState,
  getUserEventStates,
} from "@/server-actions/userStateEvent";
import { EventMember } from "@/types/userEventState";
import LoadingEventPage from "@/app/(loading)/LoadingEventPage";
import EventEditMode from "./EventEditMode";
import { getEventPermissions } from "@/server-actions/utils/permissionUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl">Event not found</div>
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
          <Button asChild variant="secondary">
            <Link href="/app">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {canShowAck() && (
          <Card className="mb-6">
            <CardContent className="flex justify-between items-center py-6">
              <p>You Haven&apos;t Acknowledged the Event!</p>
              <AcknowledgementButton eventParticipateId={ues?.id ?? null} />
            </CardContent>
          </Card>
        )}

        {/* Event Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-4xl">{event.title}</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Members Section */}
        <Card>
          <CardHeader>
            <CardTitle>Event Members</CardTitle>
          </CardHeader>
          <CardContent>
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
                            className="border-b hover:bg-muted/50 transition"
                          >
                            <td className="py-4 px-4">{m.userEmail}</td>
                            {m.userId !== event.createdBy && (
                              <>
                                <td className="text-center py-4 px-4">
                                  {m.eventSentAt ? (
                                    <Badge
                                      variant="secondary"
                                      className="bg-green-500/20 text-green-400"
                                    >
                                      ✓ Sent
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="secondary"
                                      className="bg-destructive/20 text-destructive"
                                    >
                                      ✗ Not Sent
                                    </Badge>
                                  )}
                                </td>
                                <td className="text-center py-4 px-4">
                                  {m.acknowledgedAt ? (
                                    <Badge
                                      variant="secondary"
                                      className="bg-primary/20 text-primary"
                                    >
                                      ✓ Acknowledged
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">Pending</Badge>
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
                      <Badge key={m.id} variant="secondary">
                        {m.userEmail}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
