"use client";

import { useAlert } from "@/app/(alert)/AlertProvider";
import { deleteEvent } from "@/server-actions/supa";
import { Event } from "@/types/eventTypes";
import { compareDates } from "@/utils/util";
import { useRouter } from "next/navigation";

export default function DeleteEvent({ event: e }: { event: Event }) {
  const { showAlert } = useAlert();
  const router = useRouter();
  const handleDelete = async () => {
    if (compareDates(e.date, new Date()) <= 0) {
      showAlert({
        title: "Can not delete past Event",
        description: "",
        type: "warning",
      });
      return;
    }
    const res = await deleteEvent(e.id);
    if (!res.success) {
      showAlert({
        title: res.error,
        description: "",
        type: "error",
      });
      return;
    }
    router.push("/dashboard");
    console.log(e.id);
  };

  return (
    <button
      onClick={() => handleDelete()}
      className="bg-red-950 p-2 rounded-lg px-5 hover:bg-red-900 active:bg-red-800 mt-5 w-full"
    >
      Delete
    </button>
  );
}
