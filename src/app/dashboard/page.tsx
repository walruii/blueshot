import CalendarView from "./CalendarView";
import { Suspense } from "react";
import { getEvents } from "@/server-actions/event";
import LoadingGrid from "../(header-footer)/LoadingGrid";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getNotifications } from "@/server-actions/notification";
import { getUpcomingEvents } from "@/server-actions/upcoming";

export default function Home() {
  return (
    <Suspense fallback={<LoadingGrid />}>
      <CalendarViewEventWrapper />
    </Suspense>
  );
}

async function CalendarViewEventWrapper() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/auth/signin");
  const events = await getEvents();
  const notifications = [];
  const upcomingEvents = [];

  return (
    <CalendarView
      dbEvents={events}
      notifications={notifications}
      upcomingEvents={upcomingEvents}
      session={session}
    />
  );
}
