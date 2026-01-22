import { TEvent } from "../types/eventTypes";

export default function EventListFilter({
  statusFilter,
  setStatusFilter,
}: {
  statusFilter: string;
  setStatusFilter: React.Dispatch<React.SetStateAction<TEvent["status"]>>;
}) {
  return (
    <div className="event-filter">
      <button
        className={`filter-button ${statusFilter === "Not Started" && "active-filter"}`}
        onClick={() => setStatusFilter("Not Started")}
      >
        Not Started
      </button>
      <button
        className={`filter-button ${statusFilter === "On Going" && "active-filter"}`}
        onClick={() => setStatusFilter("On Going")}
      >
        On Going
      </button>
      <button
        className={`filter-button ${statusFilter === "Done" && "active-filter"}`}
        onClick={() => setStatusFilter("Done")}
      >
        Done
      </button>
    </div>
  );
}
