"use client";

import { useAlert } from "@/app/(alert)/AlertProvider";
import { deleteEvent } from "@/server-actions/deleteEvent";
import { Event } from "@/types/event";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteEvent({ event: e }: { event: Event }) {
  const { showAlert } = useAlert();
  const router = useRouter();
  const [confirmWin, setConfirmWin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const handleDelete = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      setConfirmWin(false);
      const res = await deleteEvent(e.id);
      if (!res.success) {
        showAlert({
          title: res.err,
          description: "",
          type: "error",
        });
        setIsLoading(false);
        return;
      }
      setConfirmWin(false);
      setIsLoading(false);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      showAlert({
        title: "Something went wrong",
        description: "Please Try Again Later.",
        type: "error",
      });
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          if (isLoading) return;
          setConfirmWin(true);
        }}
        disabled={confirmWin || isLoading}
        className={`bg-red-950 p-2 rounded-lg px-5 mt-5 w-full ${confirmWin ? "" : "hover:bg-red-900 active:bg-red-800"}`}
      >
        {isLoading ? "Deleting" : "Delete"}
      </button>
      {confirmWin && (
        <div className="absolute bg-zinc-900 p-5 rounded-xl border border-zinc-700">
          <p className="font-bold">Are you sure?</p>
          <p>This action can not be reversed!</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleDelete()}
              className="bg-red-950 p-2 rounded-lg px-5 hover:bg-red-900 active:bg-red-800 w-full"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmWin(false)}
              className="bg-zinc-950 p-2 rounded-lg px-5 hover:bg-zinc-800 active:bg-zinc-700 w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
