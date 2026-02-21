"use client";
import { ScrollArea } from "@/components/ui/scroll-area";

// Sample transcript entries (will be replaced with real data later)
const SAMPLE_TRANSCRIPT = [
  { time: "10:00", speaker: "You", text: "Hi everyone!" },
  { time: "10:01", speaker: "John", text: "Hello! Nice to see you all" },
  {
    time: "10:02",
    speaker: "Sarah",
    text: "Let's discuss the project details and timeline",
  },
  { time: "10:03", speaker: "You", text: "Sounds good! When should we start?" },
  { time: "10:04", speaker: "John", text: "We can begin next week" },
];

export default function TranscriptTab() {
  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4">
        {SAMPLE_TRANSCRIPT.map((entry, idx) => (
          <div key={idx} className="flex gap-3">
            <span className="text-xs font-mono text-muted-foreground min-w-12">
              {entry.time}
            </span>
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">
                {entry.speaker}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{entry.text}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
