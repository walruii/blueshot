import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "./calendar.css";
import { TEventDB, TEventMap } from "./eventTypes";
import AddEvent from "./addEvent";
import EventList from "./eventlist";

export default function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<TEventMap>(new Map());

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch("http://localhost:5001/events");
        const data: TEventDB[] = await response.json();

        const newMap: TEventMap = new Map();

        data.forEach((item: TEventDB) => {
          const existing = newMap.get(item.date) || [];
          newMap.set(item.date, [
            ...existing,
            { id: item.id, title: item.title, status: item.status },
          ]);
        });

        setEvents(newMap);
      } catch (err) {
        console.error(err);
      }
    };

    loadEvents();
  }, []);

  const renderTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    if (!events.has(date.toDateString())) return null;

    const eves = events.get(date.toDateString());

    if (!eves) return null;

    return (
      <div className="cal-tilecontent">
        {eves.length <= 3 ? (
          eves.map((e) => <div key={e.id}>.</div>)
        ) : (
          <div>...+{eves.length - 3}</div>
        )}
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
      <div>
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
