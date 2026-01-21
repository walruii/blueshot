import { useState } from "react";

export default function AddEvent({ setEvents }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toLocaleDateString());

  const uid = function () {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const dateObj = new Date(date);

    const newEvent = {
      id: uid(),
      str: title,
    };

    setEvents((prevMap) => {
      let newMap = new Map(prevMap);

      const dateKey = dateObj.toDateString();

      const dayEvents = newMap.get(dateKey) || [];

      newMap.set(dateKey, [...dayEvents, newEvent]);
      return newMap;
    });
  };
  return (
    <form className="add-event">
      <p>Add Event</p>
      <label>title</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)}></input>
      <label>date</label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      ></input>
      <button onClick={(e) => handleAdd(e)}>Add</button>
    </form>
  );
}
