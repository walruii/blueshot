import { TEvent } from "../types/eventTypes";

export default function Event({
  e,
  handleDelete,
  handleStatusChange,
}: {
  e: TEvent;
  handleDelete: (id: string) => void;
  handleStatusChange: (
    e: React.ChangeEvent<HTMLSelectElement>,
    id: string,
  ) => void;
}) {
  return (
    <div key={e.id} className="event-listitem">
      <p>{e.title}</p>
      <select
        name="status"
        id="status"
        value={e.status}
        onChange={(eve) => handleStatusChange(eve, e.id)}
      >
        <option value="Not Started">Not Started</option>
        <option value="On Going">On Going</option>
        <option value="Done">Done</option>
      </select>
      <p>{e.status}</p>
      <button className="delete-event" onClick={() => handleDelete(e.id)}>
        Delete
      </button>
    </div>
  );
}
