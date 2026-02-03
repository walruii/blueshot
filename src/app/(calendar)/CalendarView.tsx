"use client";
import { useState } from "react";
import Calendar from "react-calendar";
import { TEventMap } from "../../types/eventTypes";
import DotIcon from "../../svgs/DotIcon";
import { dotColor, sortEvents } from "../../utils/util";
import "./Calendar.css";
import EventList from "./EventList";
import Image from "next/image";

export default function CalendarView({ dbEvents }: { dbEvents: TEventMap }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<TEventMap>(dbEvents);

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
              <DotIcon size={10} color={dotColor[e.status]} />
              <p className="truncate text-xs hidden sm:block">{e.title}</p>
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
    <div className="grid grid-cols-6 grid-rows-4 h-260 max-w-500 mx-auto gap-2">
      <div className="pb-7 pt-4 bg-zinc-900 rounded-xl h-full col-span-3">
        <p className="font-bold pb-3 px-5 text-3xl">Welcome! Grandpa324</p>
        <div className="p-6 flex">
          <div className="flex justify-center items-center rounded-full overflow-clip h-[100px] w-[100px]">
            <Image src="/file.svg" width={100} height={100} alt="" />
          </div>
          <div className="px-2">
            <p>you have 0 upcoming events today</p>
          </div>
        </div>
      </div>
      <div className="py-7 bg-zinc-900 rounded-xl h-full col-span-3">
        <div className="border-b border-zinc-600 flex justify-around">
          <p className="font-bold pb-3 px-5">Notifications</p>
          <p className="font-bold pb-3 px-5">Upcoming</p>
        </div>
        <div className="border-b flex py-3 px-7 border-zinc-600 w-full justify-between">
          <p>
            some info askfh as;kf hsak fhaslk sahf askhf askl hf ahsgdofi has
            fhas{" "}
          </p>
          <button className="justify-end">OK</button>
        </div>
      </div>
      <Calendar
        showFixedNumberOfWeeks={true}
        tileClassName={"h-25"}
        tileContent={renderTileContent}
        onChange={(e) => handleCalendarChange(e as Date | null)}
        value={selectedDate}
        className="h-full col-span-4 row-span-3"
      />
      <EventList
        selectedDate={selectedDate}
        events={events}
        className="row-span-3 col-span-2"
      />
    </div>
  );
}
