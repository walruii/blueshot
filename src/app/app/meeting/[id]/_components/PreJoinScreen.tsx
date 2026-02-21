"use client";
import { useMeeting, useMediaDevice } from "@videosdk.live/react-sdk";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Video, VideoOff, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface PreJoinScreenProps {
  participantName: string;
  onJoin: (settings: { cameraOn: boolean; micOn: boolean }) => void;
}

export default function PreJoinScreen({
  participantName,
  onJoin,
}: PreJoinScreenProps) {
  const { join, enableWebcam, unmuteMic } = useMeeting();
  const { getCameras, getMicrophones } = useMediaDevice();
  const [devices, setDevices] = useState<{
    video: any[];
    audio: any[];
  }>({ video: [], audio: [] });

  // Local state for prejoin settings (before joining meeting)
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Get available devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const videoDevices = await getCameras();
        const audioDevices = await getMicrophones();
        setDevices({
          video: videoDevices || [],
          audio: audioDevices || [],
        });
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
    };
    fetchDevices();
  }, []);

  // Setup camera preview based on isCameraOn state
  useEffect(() => {
    let localStream: MediaStream | null = null;
    let isMounted = true;

    const setupPreview = async () => {
      if (isCameraOn) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });

          // Only proceed if component is still mounted
          if (!isMounted) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          localStream = stream;
          setPreviewStream(stream);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch((err) => {
              console.error("Error playing video:", err);
            });
          }
        } catch (error) {
          console.error("Error accessing camera:", error);
          if (isMounted) {
            setIsCameraOn(false);
          }
        }
      } else {
        // Stop preview stream when camera is turned off
        // Clean up any existing stream
        if (previewStream) {
          previewStream.getTracks().forEach((track) => track.stop());
        }
        if (isMounted) {
          setPreviewStream(null);
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        }
      }
    };

    setupPreview();

    // Cleanup on unmount or when effect re-runs
    return () => {
      isMounted = false;
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraOn]); // Remove previewStream from dependencies

  const handleToggleCamera = () => {
    setIsCameraOn((prev) => !prev);
  };

  const handleToggleMic = () => {
    setIsMicOn((prev) => !prev);
  };

  const handleJoin = () => {
    setIsJoining(true);

    // Stop preview stream
    if (previewStream) {
      previewStream.getTracks().forEach((track) => track.stop());
      setPreviewStream(null);
    }

    // Join the meeting and pass the device settings
    join();
    onJoin({ cameraOn: isCameraOn, micOn: isMicOn });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <Card className="w-full max-w-3xl bg-background/95 backdrop-blur-sm border-border shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Ready to join?
            </h1>
            <p className="text-muted-foreground">
              Setup your audio and video before joining
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Joining as{" "}
              <span className="font-semibold">{participantName}</span>
            </p>
          </div>

          {/* Video Preview */}
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6 shadow-inner">
            {isCameraOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ transform: "scaleX(-1)" }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                    <VideoOff className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-lg font-medium">
                    Camera is off
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Device Info */}
          <div className="mb-6 space-y-2 text-sm text-muted-foreground">
            {devices.video.length > 0 && (
              <p>📹 {devices.video.length} camera(s) detected</p>
            )}
            {devices.audio.length > 0 && (
              <p>🎤 {devices.audio.length} microphone(s) detected</p>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {/* Mic Toggle */}
            <Button
              variant={isMicOn ? "default" : "destructive"}
              size="icon-lg"
              onClick={handleToggleMic}
              className="rounded-full w-14 h-14"
              title={isMicOn ? "Mute microphone" : "Unmute microphone"}
            >
              {isMicOn ? (
                <Mic className="h-6 w-6" />
              ) : (
                <MicOff className="h-6 w-6" />
              )}
            </Button>

            {/* Camera Toggle */}
            <Button
              variant={isCameraOn ? "default" : "destructive"}
              size="icon-lg"
              onClick={handleToggleCamera}
              className="rounded-full w-14 h-14"
              title={isCameraOn ? "Turn off camera" : "Turn on camera"}
            >
              {isCameraOn ? (
                <Video className="h-6 w-6" />
              ) : (
                <VideoOff className="h-6 w-6" />
              )}
            </Button>
          </div>

          {/* Join Button */}
          <Button
            onClick={handleJoin}
            disabled={isJoining}
            size="lg"
            className="w-full text-lg py-6"
          >
            {isJoining ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Joining...
              </>
            ) : (
              "Join Meeting"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            You can change these settings anytime during the meeting
          </p>
        </div>
      </Card>
    </div>
  );
}
