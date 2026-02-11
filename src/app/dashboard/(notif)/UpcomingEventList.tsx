import { Upcoming } from "@/types/upcomingType";
import { dateToTimeString } from "@/utils/dateUtil";
import Link from "next/link";
import UpcomingTag from "./UpcomingTag";

export default function UpcomingEventList({
  upcomingEvents,
}: {
  upcomingEvents: Upcoming[];
}) {
  return (
    <div className="flex flex-col py-3 border-zinc-600 w-full justify-between items-center overflow-y-auto h-full min-h-0">
      {upcomingEvents.map((e: Upcoming) => (
        <div
          key={e.id}
          className="flex w-full border-b border-zinc-600 items-center justify-between py-2"
        >
          <p className="p-1 rounded px-7 py-2">
            <Link href={`/dashboard/events/${e.eventId}`}>{e.eventTitle}</Link>
            <UpcomingTag from={e.eventFrom} />
          </p>
          <div className="flex flex-col w-40 border-l px-3 py-2 border-zinc-600">
            <p className="">{e.eventDate.toDateString().slice(0, -5)}</p>
            <p className="">From: {dateToTimeString(e.eventFrom)}</p>
            {e.eventTo && <p className="">To: {dateToTimeString(e.eventTo)}</p>}
            <p className="" title={e.eventUserEmail}>
              by: {e.eventUserName}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
