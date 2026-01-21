import { Event, EventMap } from "./eventTypes";

export default function EventList({
  selectedDate,
  events,
  setEvents,
}: {
  selectedDate: Date;
  events: EventMap;
  setEvents: React.Dispatch<React.SetStateAction<EventMap>>;
}) {
  const handledelete = async (id: string) => {
    const response = await fetch(`http://localhost:5001/events/${id}`, {
      method: "DELETE",
    });

    if (response.ok)
      setEvents((prevMap) => {
        let newMap = new Map(prevMap);

        const dateString = selectedDate.toDateString();

        let events = newMap.get(dateString) || [];

        events = events.filter((e) => String(e.id) !== String(id));
        newMap.set(dateString, events);
        console.log(newMap.get(dateString));
        return newMap;
      });
  };
  const hasEvents = events.has(selectedDate.toDateString());
  const eves = events.get(selectedDate.toDateString()) || [];
  return (
    <div className="event-cluster">
      <p>{selectedDate.toDateString()}</p>
      <hr />
      <div className="events-box">
        {hasEvents &&
          eves.map((e) => {
            return (
              <div key={e.id} className="event-listitem">
                <p>{e.title}</p>
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
