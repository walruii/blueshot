"use client";
import { generateMeeting, getVideoSDKToken } from "@/server-actions/videosdk";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

// Dynamically import MeetingContainer to prevent SSR issues with VideoSDK
const MeetingContainer = dynamic(
  () => import("./_components/MeetingContainer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Loading meeting...
          </h2>
        </div>
      </div>
    ),
  },
);
interface MeetingPageProps {
  params: Promise<{ id: string }>;
}

export default function MeetingPage({ params }: MeetingPageProps) {
  // Get session
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>("Anonymous");
  const [meetingId, setMeetingId] = useState<string>("");
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const fetchSession = async () => {
      const session = await authClient.getSession();
      if (session && session.data && session.data.user) {
        setUsername(session.data.user.name || "Anonymous");
      }
      const { id: meetingId } = await params;
      const meetingResult = await generateMeeting(meetingId);
      if (meetingResult.success && meetingResult.data) {
        setMeetingId(meetingResult.data);
      }
      // Generate VideoSDK token
      const token = await getVideoSDKToken();
      if (token) setToken(token);
      setLoading(false);
    };
    fetchSession();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Joining meeting...
          </h2>
          <p className="text-muted-foreground mb-6">
            Please wait while we set things up for you.
          </p>
        </div>
      </div>
    );
  }

  if (!meetingId) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Failed to join meeting
          </h2>
          <p className="text-muted-foreground mb-6">Meeting ID not available</p>
          <Button asChild>
            <Link href="/app">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Failed to join meeting
          </h2>
          <p className="text-muted-foreground mb-6">No token received</p>
          <Button asChild>
            <Link href="/app">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <MeetingContainer
      meetingId={meetingId}
      token={token}
      participantName={username}
    />
  );
}
