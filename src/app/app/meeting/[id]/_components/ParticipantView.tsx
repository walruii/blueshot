"use client";
import { useParticipant } from "@videosdk.live/react-sdk";
import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParticipantViewProps {
  participantId: string;
}

export default function ParticipantView({
  participantId,
}: ParticipantViewProps) {
  const micRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    webcamStream,
    micStream,
    webcamOn,
    micOn,
    isActiveSpeaker,
    displayName,
    isLocal,
  } = useParticipant(participantId);

  // Attach video stream to video element
  useEffect(() => {
    if (videoRef.current && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [webcamStream]);

  // Attach audio stream to audio element
  useEffect(() => {
    if (micRef.current && micStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(micStream.track);
      micRef.current.srcObject = mediaStream;
      micRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }

    return () => {
      if (micRef.current) {
        micRef.current.srcObject = null;
      }
    };
  }, [micStream]);

  return (
    <Card
      className={cn(
        "relative overflow-hidden bg-gray-900 p-0 aspect-video transition-all duration-300",
        isActiveSpeaker &&
          "ring-2 ring-blue-500 ring-offset-2 ring-offset-black",
      )}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn("w-full h-full object-cover", !webcamOn && "hidden")}
      />

      {/* Audio element (hidden, just for playback) */}
      {/* Mute audio for local participant to prevent echo */}
      <audio ref={micRef} autoPlay playsInline muted={isLocal} />

      {/* Placeholder when camera is off */}
      {!webcamOn && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-2 mx-auto">
              <span className="text-2xl font-bold text-gray-300">
                {displayName?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            <p className="text-sm text-gray-400">{displayName}</p>
          </div>
        </div>
      )}

      {/* Overlay with participant info */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top overlay with name */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
          <Badge
            variant="secondary"
            className="bg-black/60 backdrop-blur-sm text-white border-0"
          >
            {displayName || "Unknown"}
          </Badge>
        </div>

        {/* Bottom overlay with status icons */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          {/* Mic status */}
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm",
              micOn ? "bg-gray-800/60" : "bg-red-600/80",
            )}
          >
            {micOn ? (
              <Mic className="w-4 h-4 text-white" />
            ) : (
              <MicOff className="w-4 h-4 text-white" />
            )}
          </div>

          {/* Camera status */}
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm",
              webcamOn ? "bg-gray-800/60" : "bg-red-600/80",
            )}
          >
            {webcamOn ? (
              <Video className="w-4 h-4 text-white" />
            ) : (
              <VideoOff className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
