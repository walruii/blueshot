"use client";
import { TEventMap } from "../../types/eventTypes";
import Event from "./Event";
import { sortEvents } from "../../utils/util";

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
      <p className="font-bold pb-3 px-5">{selectedDate.toDateString()}</p>
      <div className="overflow-scroll border-t md:max-h-200 border-zinc-600">
        {hasEvents &&
          eves.map((e) => {
            return <Event key={e.id} e={e} />;
          })}
      </div>
    </div>
  );
}
