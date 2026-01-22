import { useState } from "react";
import { useAlert } from "../alert/AlertProvider";
import { TEvent, TEventMap } from "../types/eventTypes";
import EventListFilter from "./EventListFilter";

export default function EventList({
  selectedDate,
  events,
  setEvents,
}: {
  selectedDate: Date;
  events: TEventMap;
  setEvents: React.Dispatch<React.SetStateAction<TEventMap>>;
}) {
  const { showAlert } = useAlert();
  const [statusFilter, setStatusFilter] =
    useState<TEvent["status"]>("Not Started");
  const handledelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5001/events/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        showAlert({
          title: "Something went wrong",
          type: "error",
          description: "",
        });
        return;
      }
      setEvents((prevMap) => {
        let newMap = new Map(prevMap);

        const dateString = selectedDate.toDateString();

        let events = newMap.get(dateString) || [];

        events = events.filter(
          (e) => String(e.id) !== String(id) && e.status === statusFilter,
        );
        newMap.set(dateString, events);
        console.log(newMap.get(dateString));
        return newMap;
      });
      showAlert({
        title: "Event Deleted Successfully",
        type: "info",
        description: "",
      });
    } catch (err) {
      console.error(err);
    }
  };
  const hasEvents = events.has(selectedDate.toDateString());
  const eves = events.get(selectedDate.toDateString()) || [];
  return (
    <div className="event-cluster">
      <p>{selectedDate.toDateString()}</p>
      <EventListFilter
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
      <div className="events-box">
        {hasEvents &&
          eves.map((e) => {
            return (
              <div key={e.id} className="event-listitem">
                <p>{e.title}</p>
                <p>{e.status}</p>
                <button
                  className="delete-event"
                  onClick={() => handledelete(e.id)}
                >
                  Delete
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}
