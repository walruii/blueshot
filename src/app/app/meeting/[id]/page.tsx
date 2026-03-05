"use client";
import { createJoinToken } from "@/server-actions/videosdk";
import { addParticipant } from "@/server-actions/meeting";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getMeetingById } from "@/server-actions/meeting";
import PasscodeEntryScreen from "./_components/PasscodeEntryScreen";
import { useAlert } from "@/components/AlertProvider";

const LoadingScreen = ({ message }: { message: string }) => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="text-center max-w-md px-4">
      <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
      <h2 className="text-2xl font-bold text-foreground mb-2">{message}</h2>
      <p className="text-muted-foreground">
        Please wait while we set things up for you.
      </p>
    </div>
  </div>
);

// Dynamically import MeetingContainer to prevent SSR issues with VideoSDK
const MeetingContainer = dynamic(
  () => import("./_components/MeetingContainer"),
  {
    ssr: false,
    loading: () => <LoadingScreen message="Loading meeting..." />,
  },
);

interface MeetingPageProps {
  params: Promise<{ id: string }>;
}

export default function MeetingPage({ params }: MeetingPageProps) {
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [username, setUsername] = useState<string>("Anonymous");
  const [userId, setUserId] = useState<string>("");
  const [meetingId, setMeetingId] = useState<string>("");
  const [meetingDbId, setMeetingDbId] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const { showAlert } = useAlert();

  useEffect(() => {
    const fetchSession = async () => {
      const session = await authClient.getSession();
      if (session && session.data && session.data.user) {
        setUsername(session.data.user.name || "Anonymous");
        setUserId(session.data.user.id);
      }
      const { id: meetingId } = await params;
      setMeetingDbId(meetingId);
      const meetingResult = await getMeetingById(meetingId);
      console.log("Meeting result:", meetingResult);

      if (!meetingResult.success || !meetingResult.data) {
        setLoading(false);
        return;
      }
      setMeetingId(meetingResult.data.room_id);
      const token = await createJoinToken(meetingResult.data.room_id);
      if (!token.success) {
        if (token.error === "Unauthorized") {
          setUnauthorized(true);
          setLoading(false);
        }
        return;
      }
      if (!token.data) {
        return;
      }
      setToken(token.data);
      setLoading(false);
    };
    fetchSession();
  }, []);

  const onSuccess = async (userId: string) => {
    setUserId(userId);
    setUnauthorized(false);
    
    // First, add participant to meeting (for passcode join tracking)
    const participantResult = await addParticipant(
      meetingDbId,
      userId,
      false,
      false,
    );
    
    if (!participantResult.success) {
      console.error("Failed to add participant:", participantResult.error);
      showAlert({
        title: "Failed to join meeting",
        type: "error",
      });
      return;
    }
    
    // Then fetch token for authenticated user
    const tokenResult = await createJoinToken(meetingId);
    if (!tokenResult.success) {
      console.error("Failed to fetch token for user:", tokenResult.error);
      showAlert({
        title: "Failed to fetch token",
        type: "error",
      });
      return;
    }
    if (!tokenResult.data) {
      console.error("No token received");
      return;
    }
    setToken(tokenResult.data);
  };

  const onError = async (message: string) => {
    showAlert({
      title: message,
      type: "error",
    });
  };

  if (loading) {
    return <LoadingScreen message="Joining meeting..." />;
  }
  if (unauthorized) {
    return (
      <PasscodeEntryScreen
        meetingId={meetingDbId}
        onSuccess={onSuccess}
        onError={onError}
      />
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
      userId={userId}
      meetingDbId={meetingDbId}
    />
  );
}
