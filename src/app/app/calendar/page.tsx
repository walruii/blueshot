import CalendarView from "./_components/CalendarView";
import { Suspense } from "react";
import { getEvents } from "@/server-actions/event";
import LoadingGrid from "@/components/loading/LoadingGrid";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default function CalendarPage() {
  return (
    <Suspense fallback={<LoadingGrid />}>
      <CalendarPageWrapper />
    </Suspense>
  );
}

async function CalendarPageWrapper() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/auth/signin");
  const events = await getEvents();

  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-6 lg:grid-rows-3 h-auto max-w-500 mx-auto">
      <CalendarView dbEvents={events} />
    </div>
  );
}
