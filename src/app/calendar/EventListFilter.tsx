import { TEvent } from "../types/eventTypes";

export default function EventListFilter({
  statusFilter,
  setStatusFilter,
}: {
  statusFilter: string;
  setStatusFilter: React.Dispatch<React.SetStateAction<TEvent["status"]>>;
}) {
  return null;
}
