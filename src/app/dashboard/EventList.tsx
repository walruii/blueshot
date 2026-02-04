"use client";
import { TEventMap } from "../../types/eventTypes";
import Event from "./Event";
import { formatLocalDate, sortEvents } from "../../utils/util";
import Link from "next/link";

export default function EventList({
  selectedDate,
  events,
  className,
}: {
  selectedDate: Date;
  className?: string;
  events: TEventMap;
}) {
  const hasEvents = events.has(selectedDate.toDateString());
  const eves = (events.get(selectedDate.toDateString()) || []).sort((a, b) =>
    sortEvents(a, b),
  );
  return (
    <div className={`py-7 bg-zinc-900 rounded-xl h-full ${className}`}>
      <div className="font-bold pb-3 px-5 flex justify-between items-center">
        <p>{selectedDate.toDateString()}</p>
        <Link
          href={`/dashboard/add-event?prefillDate=${formatLocalDate(selectedDate)}`}
          className="bg-zinc-800 p-2 rounded-lg px-5 hover:bg-zinc-700 active:bg-blue-700"
        >
          Add Event
        </Link>
      </div>
      <div className="overflow-scroll border-t md:max-h-200 border-zinc-600">
        {hasEvents &&
          eves.map((e) => {
            return <Event key={e.id} e={e} />;
          })}
      </div>
    </div>
  );
}
