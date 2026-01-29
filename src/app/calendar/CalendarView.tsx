import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import { TEventDB, TEventMap } from "../types/eventTypes";
import AddEvent from "./AddEvent";
import EventList from "./EventList";
import DotIcon from "../svgs/DotIcon";
import { dotColor, sortEvents } from "../utils/util";
import supabase from "../../utils/supabase";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import Loading from "../header-footer/Loading";
import CalendarToolTip from "./CalendarToolTip";
import { useCalendarTooltip } from "../../hooks/useCalendarToolTip";

export default function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<TEventMap | null>(null);
  const { hoverData, handleMouseEnter, handleMouseLeave } =
    useCalendarTooltip();

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const { data: events }: PostgrestSingleResponse<TEventDB[]> =
          await supabase.from("events").select();

        if (!events) {
          setEvents(new Map());
          return;
        }

        const newMap: TEventMap = new Map();

        events.forEach((item: TEventDB) => {
          const existing = newMap.get(item.date) || [];
          newMap.set(item.date, [
            ...existing,
            {
              id: item.id,
              title: item.title,
              status: item.status,
              startTime: item.start_time ? new Date(item.start_time) : null,
              endTime: item.end_time ? new Date(item.end_time) : null,
            },
          ]);
        });

        setEvents(newMap);
      } catch (err) {
        console.error(err);
      }
    };

    loadEvents();
  }, []);

  if (!events) return <Loading />;

  const renderTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    if (!events.has(date.toDateString()))
      return <div className="cal-tilecontent"></div>;

    const eves = events
      .get(date.toDateString())
      ?.sort((a, b) => sortEvents(a, b));

    if (!eves) return <div className="cal-tilecontent"></div>;

    return (
      <div>
        <div
          className="cal-tilecontent"
          onMouseEnter={(e) => handleMouseEnter(e, eves)}
          onMouseLeave={() => handleMouseLeave()}
        >
          {eves.slice(0, 3).map((e) => (
            <div key={e.id}>
              <DotIcon size={10} color={dotColor[e.status]} />
            </div>
          ))}

          {eves.length > 3 && (
            <div className="cal-more-count">+{eves.length - 3}</div>
          )}
        </div>
      </div>
    );
  };

  const handleCalendarChange = (nextValue: any) => {
    if (nextValue instanceof Date) {
      setSelectedDate(nextValue);
    }
  };
  return (
    <div className="main">
      <div className="main-calendar-cluster">
        {hoverData && (
          <CalendarToolTip
            events={hoverData.events}
            mouseLocation={hoverData.mouse}
          />
        )}
        <Calendar
          tileContent={renderTileContent}
          className="cal"
          onChange={handleCalendarChange}
          value={selectedDate}
        />
        <AddEvent
          selectedDate={selectedDate}
          setSelectedDate={handleCalendarChange}
          setEvents={setEvents}
        />
      </div>
      <EventList
        selectedDate={selectedDate}
        events={events}
        setEvents={setEvents}
      />
    </div>
  );
}
