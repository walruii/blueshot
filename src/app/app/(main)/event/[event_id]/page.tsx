import { getEvent } from "@/server-actions/event";
import TimeDisplay from "@/components/TimeDisplay";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import DeleteEvent from "./_components/DeleteEvent";
import {
  getUserEventState,
  getUserEventStates,
} from "@/server-actions/userStateEvent";
import LoadingEventPage from "@/components/loading/LoadingEventPage";
import EventEditMode from "./_components/EventEditMode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import AcknowledgementBanner from "./_components/AcknowledgementBanner";
import MemberTable from "./_components/MemberTable";
import { MeetingLink } from "../../../_components/MeetingLink";
import PasscodeDisplay from "../../../_components/PasscodeDisplay";

export const getPermissionsFromRole = (
  role: number | undefined, // From vae.role (1, 2, or 3)
  userId: string,
  eventCreatorId: string,
) => {
  const isEventCreator = userId === eventCreatorId;
  const userRole = role ?? 0;

  // Level 3 is ADMIN, Level 2 is READ_WRITE
  const hasWriteAccess = userRole >= 2;
  const hasAdminAccess = userRole === 3;

  return {
    // canEdit: creator with Level 2+ OR any Admin
    canEdit: (isEventCreator && hasWriteAccess) || hasAdminAccess,

    // canDelete/Manage: creator OR any Admin
    canDelete: isEventCreator || hasAdminAccess,
    canManageAccess: isEventCreator || hasAdminAccess,

    // canChangeEventGroup: Strictly the creator, but they still need Level 2+
    canChangeEventGroup: isEventCreator && hasWriteAccess,

    // UI Helpers
    isOwner: hasAdminAccess, // Equivalent to your old group owner check
    isEventCreator,
  };
};

async function EventPage({ params }: { params: { event_id: string } }) {
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
  const permissions = getPermissionsFromRole(
    event.role,
    session.user.id,
    event.createdBy,
  );

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

        {canShowAck() && <AcknowledgementBanner id={ues?.id ?? null} />}

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
                  <p className="text-lg">
                    <TimeDisplay date={event.from} />
                  </p>
                </div>
                {event.type === "default" ? (
                  <div>
                    <label className="text-muted-foreground text-sm font-medium block mb-2">
                      To
                    </label>
                    <p className="text-lg">
                      {event.to ? <TimeDisplay date={event.to} /> : "N/A"}
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
              {/* Meeting Link */}
              {event.eventMeetingId && <MeetingLink event={event} />}
              {/* Passcode Display for admins/owners */}
              {event.eventMeetingPasscode && event.eventMeetingId && (
                <PasscodeDisplay
                  passcode={event.eventMeetingPasscode}
                  isAdmin={permissions.canManageAccess}
                  meetingId={event.eventMeetingId}
                />
              )}
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
            <MemberTable
              eventMembers={eventMembers}
              permissions={permissions}
              event={event}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function Page({
  params,
}: {
  params: { event_id: string };
}) {
  return (
    <Suspense fallback={<LoadingEventPage />}>
      <EventPage params={params} />
    </Suspense>
  );
}
