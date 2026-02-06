import CalendarView from "./CalendarView";
import { Suspense } from "react";
import { getEvents, getNotifications } from "@/server-actions/supa";
import LoadingGrid from "../(header-footer)/LoadingGrid";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
  const notifications = await getNotifications();
  return (
    <CalendarView
      dbEvents={events}
      notifications={notifications}
      session={session}
    />
  );
}
