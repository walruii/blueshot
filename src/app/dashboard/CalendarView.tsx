"use client";
import { useState } from "react";
import Calendar from "react-calendar";
import { EventMap } from "../../types/event";
import DotIcon from "../../svgs/DotIcon";
import { sortEvents } from "../../utils/dateUtil";
import "./Calendar.css";
import EventList from "./EventList";
import Link from "next/link";

export default function CalendarView({
  dbEvents: events,
}: {
  dbEvents: EventMap;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const renderTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    if (!events.has(date.toDateString())) return <div className=""></div>;

    const eves = events
      .get(date.toDateString())
      ?.sort((a, b) => sortEvents(a, b));

    if (!eves) return <div className=""></div>;

    return (
      <div className="">
        <div className="flex sm:flex-col items-start my-2">
          {eves.slice(0, 3).map((e) => (
            <div key={e.id} className="flex items-center gap-1">
              <DotIcon size={10} color={"yellow"} />
              <Link
                href={`/dashboard/events/${e.id}`}
                className="hover:underline"
              >
                <p className="truncate text-xs hidden sm:block">{e.title}</p>
              </Link>
            </div>
          ))}
        </div>
        {eves.length > 3 && (
          <div className="text-xs block">+{eves.length - 3}</div>
        )}
      </div>
    );
  };

  const handleCalendarChange = (nextValue: Date | null) => {
    if (nextValue instanceof Date) {
      setSelectedDate(nextValue);
    }
  };

  return (
    <>
      <Calendar
        showFixedNumberOfWeeks={true}
        tileClassName={"h-25 flex flex-col sm:items-start p-0"}
        tileContent={renderTileContent}
        onChange={(e) => handleCalendarChange(e as Date | null)}
        value={selectedDate}
        className="h-full lg:col-span-4 lg:row-span-3"
      />
      <EventList
        selectedDate={selectedDate}
        events={events}
        className="lg:row-span-3 lg:col-span-2"
      />
    </>
  );
}
