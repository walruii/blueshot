import { dateToTimeString } from "@/utils/dateUtil";
import Link from "next/link";
import UpcomingTag from "./UpcomingTag";
import { Event } from "@/types/event";

export default function UpcomingEventList({
  activeEvents,
}: {
  activeEvents: Event[];
}) {
  return (
    <div className="flex flex-col py-3 w-full justify-between items-center overflow-y-auto h-full min-h-0">
      {activeEvents.length === 0 && (
        <p className="text-muted-foreground p-4">No upcoming events</p>
      )}
      {activeEvents.map((e: Event) => (
        <div
          key={e.id}
          className="flex w-full border-b items-center justify-between py-2"
        >
          <div className="flex flex-col p-1 rounded px-7 py-2 gap-2">
            <Link
              href={`/app/event/${e.id}`}
              className="font-medium hover:text-primary transition-colors"
            >
              {e.title}
            </Link>
            <UpcomingTag from={e.from} />
          </div>
          <div className="flex flex-col w-40 border-l px-3 py-2 text-sm text-muted-foreground">
            <p>From: {dateToTimeString(e.from)}</p>
            {e.to && <p>To: {dateToTimeString(e.to)}</p>}
            <p title={e.eventUserEmail}>by: {e.eventUserName}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
