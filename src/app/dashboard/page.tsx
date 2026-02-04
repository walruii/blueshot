import CalendarView from "./CalendarView";
import { Suspense } from "react";
import { getEvents } from "@/server-actions/supa";
import LoadingGrid from "../(header-footer)/LoadingGrid";

export default function Home() {
  return (
    <Suspense fallback={<LoadingGrid />}>
      <CalendarViewEventWrapper />
    </Suspense>
  );
}

async function CalendarViewEventWrapper() {
  const events = await getEvents();
  return <CalendarView dbEvents={events} />;
}
