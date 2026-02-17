"use client";

import { useAlert } from "@/app/(alert)/AlertProvider";
import { deleteEvent } from "@/server-actions/deleteEvent";
import { Event } from "@/types/event";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
          title: res.error,
          description: "",
          type: "error",
        });
        setIsLoading(false);
        return;
      }

      showAlert({
        title: "Event Deleted",
        description: `${e.title}`,
        type: "success",
      });
      setConfirmWin(false);
      setIsLoading(false);
      router.push("/app");
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
      <Button
        variant="destructive"
        onClick={() => {
          if (isLoading) return;
          setConfirmWin(true);
        }}
        disabled={confirmWin || isLoading}
        className="mt-5 w-full"
      >
        {isLoading ? "Deleting" : "Delete"}
      </Button>
      {confirmWin && (
        <div className="absolute bg-card p-5 rounded-xl border">
          <p className="font-bold">Are you sure?</p>
          <p>This action can not be reversed!</p>
          <div className="flex gap-2 mt-3">
            <Button
              variant="destructive"
              onClick={() => handleDelete()}
              className="w-full"
            >
              Confirm
            </Button>
            <Button
              variant="secondary"
              onClick={() => setConfirmWin(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
