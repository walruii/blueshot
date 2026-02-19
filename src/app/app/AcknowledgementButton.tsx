"use client";
import { useState } from "react";
import { useAlert } from "@/components/AlertProvider";
import { acknowledgeEvent } from "@/server-actions/acknowledge";
import { Button } from "@/components/ui/button";

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
    <Button
      onClick={() => handleAck()}
      disabled={isLoading}
      variant="secondary"
      size="sm"
    >
      {isLoading ? "ACK..." : "ACK"}
    </Button>
  );
}
