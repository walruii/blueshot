"use client";
import { useState } from "react";
import Calendar from "react-calendar";
import { TEventMap } from "../../types/eventTypes";
import DotIcon from "../../svgs/DotIcon";
import { dotColor, sortEvents } from "../../utils/util";
import "./Calendar.css";
import EventList from "./EventList";

export default function CalendarView({ dbEvents }: { dbEvents: TEventMap }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<TEventMap>(dbEvents);

  const renderTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    if (!events.has(date.toDateString())) return <div className="h-12"></div>;

    const eves = events
      .get(date.toDateString())
      ?.sort((a, b) => sortEvents(a, b));

    if (!eves) return <div className="h-12">heloo</div>;

    return (
      <div className="h-12">
        {eves.slice(0, 3).map((e) => (
          <div key={e.id}>
            <DotIcon size={10} color={dotColor[e.status]} />
          </div>
        ))}

        {eves.length > 3 && <div className="">+{eves.length - 3}</div>}
      </div>
    );
  };

  const handleCalendarChange = (nextValue: Date | null) => {
    if (nextValue instanceof Date) {
      setSelectedDate(nextValue);
    }
  };
  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-col md:flex-row max-w-350 justify-between gap-2">
        <Calendar
          showFixedNumberOfWeeks={true}
          tileContent={renderTileContent}
          onChange={(e) => handleCalendarChange(e as Date | null)}
          value={selectedDate}
          className="flex-2/3 h-full"
        />

        <EventList selectedDate={selectedDate} events={events} />
      </div>
    </div>
  );
}
