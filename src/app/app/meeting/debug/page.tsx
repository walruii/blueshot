"use client";
// set global debug flag immediately when module loads
if (typeof window !== "undefined") {
  (window as any).__MEETING_DEBUG = true;
}
import MeetingContentWithDevices from "../[id]/_components/MeetingContentWithDevices";

export default function MeetingDebugPage() {
  return (
    <MeetingContentWithDevices
      deviceSettings={{ cameraOn: true, micOn: false }}
      meetingId="debug-meeting"
      userId="debug-user"
      meetingDbId="debug-meeting-db-id"
    />
  );
}
