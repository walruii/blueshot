import { isMeetingDebug } from "@/lib/debug";
import { getTranscriptionControlAccess } from "@/server-actions/meeting-transcriptions";
import { useEffect, useState } from "react";

export default function useTranscriptions({ roomId }: { roomId: string }) {
  const [transcriptionText, setTranscriptionText] = useState<string>("");
  const [isLiveTranscriptionEnabled, setIsLiveTranscriptionEnabled] =
    useState<boolean>(false);
  const [hasTranscriptionControl, setHasTranscriptionControl] = useState(false);
  const [isTranscriptionRecording, setIsTranscriptionRecording] =
    useState(false);
  const [isTranscriptionLive, setIsTranscriptionLive] = useState(false);

  useEffect(() => {
    const fetchTranscriptionControlAccess = async () => {
      if (!roomId || isMeetingDebug()) return;

      const result = await getTranscriptionControlAccess(roomId);
      if (!result.success) {
        console.error("Failed to check transcription access:", result.error);
        return;
      }

      setHasTranscriptionControl(Boolean(result.data?.canControl));
    };

    fetchTranscriptionControlAccess();
  }, [roomId]);

  const startRecordingTranscription = async () => {};
  const stopRecordingTranscription = async () => {};
  const startLiveTranscription = async () => {};
  const stopLiveTranscription = async () => {};

  return {
    transcriptionText,
    setTranscriptionText,
    isLiveTranscriptionEnabled,
    setIsLiveTranscriptionEnabled,
    hasTranscriptionControl,
    isTranscriptionRecording,
    setIsTranscriptionRecording,
    isTranscriptionLive,
    setIsTranscriptionLive,
    startRecordingTranscription,
    stopRecordingTranscription,
    startLiveTranscription,
    stopLiveTranscription,
  };
}
