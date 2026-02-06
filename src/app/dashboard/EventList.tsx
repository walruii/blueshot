"use client";
import { EventMap } from "../../types/eventTypes";
import Event from "./Event";
import { compareDates, formatLocalDate, sortEvents } from "../../utils/util";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAlert } from "../(alert)/AlertProvider";

export default function EventList({
  selectedDate,
  events,
  className,
}: {
  selectedDate: Date;
  className?: string;
  events: EventMap;
}) {
  const hasEvents = events.has(selectedDate.toDateString());
  const eves = (events.get(selectedDate.toDateString()) || []).sort((a, b) =>
    sortEvents(a, b),
  );
  const router = useRouter();
  const { showAlert } = useAlert();

  const handleLink = () => {
    if (compareDates(selectedDate, new Date()) >= 0) {
      router.push(
        `/dashboard/add-event?prefillDate=${formatLocalDate(selectedDate)}`,
      );
    } else {
      showAlert({
        title: "Can not Add Event in the past!",
        type: "warning",
        description: "",
      });
    }
  };
  return (
    <div className={`py-7 bg-zinc-900 rounded-xl h-full ${className}`}>
      <div className="font-bold pb-3 px-5 flex justify-between items-center">
        <p>{selectedDate.toDateString()}</p>
        <div
          onClick={() => handleLink()}
          className="bg-zinc-800 p-2 rounded-lg px-5 hover:bg-zinc-700 active:bg-blue-700"
        >
          Add Event
        </div>
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
