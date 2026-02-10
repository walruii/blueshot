"use client";
import { acknowledgeEvent } from "@/server-actions/supa";

export default function AcknowledgementButton({
  eventParticipateId,
}: {
  eventParticipateId: string | null;
}) {
  if (!eventParticipateId) return null;
  const handleAck = async () => {
    const response = acknowledgeEvent(eventParticipateId);
    console.log(response);
  };
  return (
    <button
      onClick={() => handleAck()}
      className="bg-zinc-800 p-2 rounded-lg px-5 hover:bg-zinc-700 active:bg-blue-700 justify-end"
    >
      ACK
    </button>
  );
}
