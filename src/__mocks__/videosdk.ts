// runtime mock for VideoSDK hooks used in debug mode
// This file is intentionally minimal and only provides the properties
// required by the UI components. Nothing here communicates with the
// real SDK or backend.

import { useState } from "react";

export function useMeeting() {
  // simple static participants map
  const [participants] = useState(() => {
    const m = new Map();
    m.set("user-1", { id: "user-1", displayName: "Alice" });
    m.set("user-2", { id: "user-2", displayName: "Bob" });
    return m;
  });

  const [micOn, setMicOn] = useState(false);
  const [webcamOn, setWebcamOn] = useState(false);

  return {
    participants,
    meeting: {
      on: () => {},
      off: () => {},
    },
    localParticipant: { id: "user-1", displayName: "Alice" },
    enableWebcam: () => setWebcamOn(true),
    unmuteMic: () => setMicOn(true),
    toggleMic: () => setMicOn((v) => !v),
    toggleWebcam: () => setWebcamOn((v) => !v),
    leave: () => {},
    localMicOn: micOn,
    localWebcamOn: webcamOn,
  } as any;
}

export function usePubSub() {
  return {
    publish: () => {},
  };
}

export function useParticipant(id: string) {
  // return minimal data used by ParticipantView
  return {
    webcamStream: null,
    micStream: null,
    webcamOn: false,
    micOn: false,
    isActiveSpeaker: id === "user-1",
    displayName: id === "user-1" ? "Alice" : "Bob",
    isLocal: id === "user-1",
  } as any;
}
