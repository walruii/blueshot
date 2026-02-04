"use client";
import { useState } from "react";
import Calendar from "react-calendar";
import { TEventMap } from "../../types/eventTypes";
import DotIcon from "../../svgs/DotIcon";
import { dotColor, sortEvents } from "../../utils/util";
import "./Calendar.css";
import EventList from "./EventList";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";

export default function CalendarView({ dbEvents }: { dbEvents: TEventMap }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<TEventMap>(dbEvents);
  const {
    data: session,
    isPending, //loading state
    error, //error object
    refetch, //refetch the session
  } = authClient.useSession();

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
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-6 lg:grid-rows-4 h-auto lg:h-260 max-w-500 mx-auto">
      <div className="pb-7 pt-4 bg-zinc-900 rounded-xl h-full col-span-1 lg:col-span-3">
        <p className="font-bold pb-3 px-5 text-3xl">
          {session && `Welcome! ${session.user.name}`}
        </p>
        <div className="p-6 flex flex-col sm:flex-row">
          <div className="flex justify-center items-center rounded-full overflow-clip h-25 w-25">
            <Image src="/file.svg" width={100} height={100} alt="" />
          </div>
          <div className="px-2">
            <p>you have 0 upcoming events today</p>
            <button
              onClick={() => {
                authClient.signOut();
              }}
            >
              SIGNOUT
            </button>
          </div>
        </div>
      </div>
      <div className="py-7 bg-zinc-900 rounded-xl h-full col-span-1 lg:col-span-3">
        <div className="border-b border-zinc-600 flex justify-around">
          <p className="font-bold pb-3 px-5">Notifications</p>
          <p className="font-bold pb-3 px-5">Upcoming</p>
        </div>
        <div className="border-b flex py-3 px-7 border-zinc-600 w-full justify-between items-center">
          <p>
            some info askfh as;kf hsak fhaslk sahf askhf askl hf ahsgdofi has
            fhas
          </p>
          <button className="bg-zinc-800 p-2 rounded-lg px-5 hover:bg-zinc-700 active:bg-blue-700 justify-end">
            ACK
          </button>
        </div>
      </div>
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
    </div>
  );
}
