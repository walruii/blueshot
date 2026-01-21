import { useState } from "react";
import Calendar from "react-calendar";
import "./cal.css";
import AddEvent from "./addEvent";
import eventsStarter from "./events";
import EventList from "./eventlist";

export default function Cal() {
  const [value, onChange] = useState(new Date());
  const [events, setEvents] = useState(eventsStarter);

  const renderTileContent = ({ date, view }) => {
    if (view === "month") {
      const hasEvents = events.has(date.toDateString());
      if (!hasEvents) {
        return null;
      }
      const eves = events.get(date.toDateString());
      return (
        <div className="cal-tilecontent">
          {eves.length <= 3 ? (
            eves.map((e) => <div key={e.id}>.</div>)
          ) : (
            <div>...+{eves.length - 3}</div>
          )}
        </div>
      );
    }
  };
  return (
    <div className="main">
      <div>
        <Calendar
          tileContent={renderTileContent}
          className="cal"
          onChange={onChange}
          value={value}
        />
        <AddEvent setEvents={setEvents} />
      </div>
      <EventList value={value} events={events} setEvents={setEvents} />
    </div>
  );
}
