"use client";
import { acknowledgeEvent } from "@/server-actions/supa";
import { useState } from "react";
import { useAlert } from "../(alert)/AlertProvider";

export default function AcknowledgementButton({
  eventParticipateId,
}: {
  eventParticipateId: string | null;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useAlert();
  if (!eventParticipateId) return null;

  const handleAck = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      const response = await acknowledgeEvent(eventParticipateId);
      if (!response.success) {
        showAlert({
          title: "Failed to Acknowledge Event",
          description: "Try again Later.",
          type: "error",
        });
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    } catch (err) {
      console.log(err);
      showAlert({
        title: "Something went wrong",
        description: "Try again Later.",
        type: "error",
      });
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={() => handleAck()}
      disabled={isLoading}
      className={`p-2 rounded-lg px-5 justify-end ${isLoading ? "bg-zinc-800" : "bg-zinc-800 hover:bg-zinc-700 active:bg-blue-700"}`}
    >
      {isLoading ? "ACK..." : "ACK"}
    </button>
  );
}
