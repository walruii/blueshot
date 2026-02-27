import { isMeetingDebug } from "./debug";

// This wrapper decides at runtime whether to use the real VideoSDK
// or the local mock implementation. It is safe to import from in
// client components only.

let sdk: any;

function normalize(mod: any) {
  if (mod && mod.__esModule && mod.default) {
    return mod.default;
  }
  return mod;
}

function loadSdk() {
  if (typeof window === "undefined") {
    // running on server; provide minimal no-op hooks to avoid errors
    sdk = {
      useMeeting: () => ({
        participants: new Map(),
        meeting: { on: () => {}, off: () => {} },
        localParticipant: null,
        enableWebcam: () => {},
        unmuteMic: () => {},
        toggleMic: () => {},
        toggleWebcam: () => {},
        leave: () => {},
        localMicOn: false,
        localWebcamOn: false,
      }),
      usePubSub: () => ({ publish: () => {} }),
      useParticipant: () => ({
        webcamStream: null,
        micStream: null,
        webcamOn: false,
        micOn: false,
        isActiveSpeaker: false,
        displayName: "",
        isLocal: false,
      }),
    };
    return;
  }

  if (isMeetingDebug()) {
    // Use mock during debug UI
    const m = require("@/__mocks__/videosdk");
    sdk = normalize(m);
  } else {
    const m = require("@videosdk.live/react-sdk");
    sdk = normalize(m);
  }
}

// ensure sdk is loaded when functions are accessed
function ensureSdk() {
  if (!sdk) {
    loadSdk();
  }
  return sdk;
}

export function useMeeting(...args: any[]) {
  const s = ensureSdk();
  return s.useMeeting(...args);
}

export function usePubSub(...args: any[]) {
  const s = ensureSdk();
  return s.usePubSub(...args);
}

export function useParticipant(...args: any[]) {
  const s = ensureSdk();
  return s.useParticipant(...args);
}
