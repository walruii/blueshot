import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "./calendar.css";
import { TEventDB, TEventMap } from "../types/eventTypes";
import AddEvent from "./AddEvent";
import EventList from "./EventList";
import DotIcon from "../svgs/DotIcon";

// const dotColor = {
//   "Not Started": "#ef4444", // Soft Red (implies "waiting to start")
//   "On Going": "#eab308", // Yellow (implies "caution/active")
//   Done: "#22c55e", // Green (implies "go/finished")
// };

const dotColor = {
  "Not Started": "#ff6b6b", // Soft Coral Red (visible but not an "alert" error)
  "On Going": "#ffd93d", // Golden Yellow (bright and distinct)
  Done: "#6bc17d", // Pastel Mint Green (clean and soothing)
};
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

    if (!events.has(date.toDateString()))
      return <div className="cal-tilecontent"></div>;

    const eves = events.get(date.toDateString());

    if (!eves) return;
    <div className="cal-tilecontent"></div>;

    return (
      <div className="cal-tilecontent">
        {eves.slice(0, 3).map((e) => (
          <div key={e.id}>
            <DotIcon size={10} color={dotColor[e.status]} />
          </div>
        ))}

        {eves.length > 3 && (
          <div className="cal-more-count">+{eves.length - 3}</div>
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
      <div className="main-calendar-cluster">
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
