"use client";

import { useAlert } from "@/app/(alert)/AlertProvider";
import { deleteEvent } from "@/server-actions/deleteEvent";
import { Event } from "@/types/event";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";

export default function DeleteEvent({ event: e }: { event: Event }) {
  const { showAlert } = useAlert();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
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
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className="w-full mt-5"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Deleting
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be reversed! The event &quot;{e.title}&quot; will
            be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Confirm Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
