"use client";
import { TEventMap } from "../../types/eventTypes";
import Event from "./Event";
import { sortEvents } from "../../utils/util";

export default function EventList({
  selectedDate,
  events,
}: {
  selectedDate: Date;
  events: TEventMap;
}) {
  const hasEvents = events.has(selectedDate.toDateString());
  const eves = (events.get(selectedDate.toDateString()) || []).sort((a, b) =>
    sortEvents(a, b),
  );
  return (
    <div className="flex-1/3 py-7 bg-zinc-900 rounded-xl">
      <p className="font-bold pb-3 px-5">{selectedDate.toDateString()}</p>
      <div className="overflow-scroll border-t md:max-h-[500px] border-zinc-600">
        {hasEvents &&
          eves.map((e) => {
            return <Event key={e.id} e={e} />;
          })}
      </div>
    </div>
  );
}
