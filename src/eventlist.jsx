export default function EventList({ value, events, setEvents }) {
  const handledelete = (id) => {
    setEvents((prevMap) => {
      let newMap = new Map(prevMap);

      const dateString = value.toDateString();
      let events = newMap.get(dateString);

      events = events.filter((e) => String(e.id) !== String(id));
      newMap.set(dateString, events);
      console.log(newMap.get(dateString));
      return newMap;
    });
  };
  return (
    <div className="event-cluster">
      <p>{value.toDateString()}</p>
      <hr />
      <div className="events-box">
        {events.has(value.toDateString()) &&
          events.get(value.toDateString()).map((e) => {
            return (
              <div key={e.id} className="event-listitem">
                <p>{e.str}</p>
                <button
                  className="delete-event"
                  onClick={() => handledelete(e.id)}
                >
                  delete
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}
