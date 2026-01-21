import { useState } from "react";
import { EventMap } from "./eventTypes";

export default function AddEvent({
  selectedDate,
  setSelectedDate,
  setEvents,
}: {
  selectedDate: Date;
  setSelectedDate: (value: any) => void;
  setEvents: React.Dispatch<React.SetStateAction<EventMap>>;
}) {
  const [title, setTitle] = useState("");

  const formatLocalDate = (dateObj: Date) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const uid = function () {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    const newEvent = {
      date: selectedDate.toDateString(),
      id: uid(),
      title,
      status: "Not Started",
    };

    const res = await fetch("http://localhost:5001/events", {
      method: "POST",
      body: JSON.stringify(newEvent),
    });

    if (res.ok) {
      setEvents((prevMap: EventMap) => {
        let newMap = new Map(prevMap);

        const dateKey = selectedDate.toDateString();

        const dayEvents = newMap.get(dateKey) || [];

        newMap.set(dateKey, [...dayEvents, newEvent]);
        return newMap;
      });
    }
  };

  const handleSelectDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(e.target.value));
  };
  return (
    <form className="add-event">
      <p>Add Event</p>
      <label>title</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)}></input>
      <label>date</label>
      <input
        type="date"
        value={formatLocalDate(selectedDate)}
        onChange={(e) => handleSelectDate(e)}
      ></input>
      <button onClick={(e) => handleAdd(e)}>Add</button>
    </form>
  );
}
