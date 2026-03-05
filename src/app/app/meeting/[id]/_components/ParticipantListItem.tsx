"use client";
import { isMeetingDebug } from "@/lib/debug";
import { useParticipant } from "@/lib/videosdkWrapper";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

interface ParticipantListItemProps {
  participantId: string;
  isExternal?: boolean;
}

export default function ParticipantListItem({
  participantId,
  isExternal = false,
}: ParticipantListItemProps) {
  const { displayName, isLocal, micOn, webcamOn, isActiveSpeaker } =
    useParticipant(participantId);

  // Generate consistent color from participantId
  const getAvatarColor = (id: string) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-cyan-500",
    ];
    const hash = id
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const initial = displayName?.charAt(0)?.toUpperCase() || "?";
  const avatarColor = isLocal ? "bg-primary" : getAvatarColor(participantId);

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded transition-colors ${
        isLocal ? "bg-muted/50" : "hover:bg-muted/50"
      } ${isActiveSpeaker ? "ring-2 ring-blue-500 bg-blue-500/10" : ""}`}
    >
      <div
        className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-sm font-bold text-white`}
      >
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">
            {displayName || "Unknown"} {isLocal && "(You)"}
          </p>
          {isExternal && !isLocal && (
            <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-700 rounded whitespace-nowrap">
              (external)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {micOn ? (
              <Mic className="h-3 w-3 text-green-500" />
            ) : (
              <MicOff className="h-3 w-3 text-red-500" />
            )}
            {webcamOn ? (
              <Video className="h-3 w-3 text-green-500" />
            ) : (
              <VideoOff className="h-3 w-3 text-red-500" />
            )}
          </div>
          {isActiveSpeaker && (
            <span className="text-blue-500 font-medium">Speaking</span>
          )}
        </div>
      </div>
    </div>
  );
}
