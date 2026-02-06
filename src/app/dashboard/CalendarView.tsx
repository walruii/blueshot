"use client";
import { useState } from "react";
import Calendar from "react-calendar";
import { EventMap } from "../../types/eventTypes";
import DotIcon from "../../svgs/DotIcon";
import { sortEvents } from "../../utils/util";
import "./Calendar.css";
import EventList from "./EventList";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import NotificationList from "./NotificationList";
import { EventParticipant } from "@/types/eventParticipantType";
import { Session } from "@/types/sessionType";
import { EventNotification } from "@/types/notificationType";

export default function CalendarView({
  dbEvents,
  notifications,
  session,
}: {
  dbEvents: EventMap;
  notifications: EventNotification[];
  session: Session;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<EventMap>(dbEvents);

  const renderTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    if (!events.has(date.toDateString())) return <div className=""></div>;

    console.log(events);
    const eves = events
      .get(date.toDateString())
      ?.sort((a, b) => sortEvents(a, b));

    console.log(eves);

    if (!eves) return <div className=""></div>;

    return (
      <div className="">
        <div className="flex sm:flex-col items-start my-2">
          {eves.slice(0, 3).map((e) => (
            <div key={e.id} className="flex items-center gap-1">
              <DotIcon size={10} color={"yellow"} />
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
          Welcome! {session.user.name}
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
        <NotificationList notifications={notifications} />
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
