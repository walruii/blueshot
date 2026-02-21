import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { generateMeeting } from "@/server-actions/videosdk";
import MeetingContainer from "./_components/MeetingContainer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface MeetingPageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingPage({ params }: MeetingPageProps) {
  // Get session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Get meeting ID from params
  const { id: meetingId } = await params;

  // Generate VideoSDK token
  const tokenResult = await generateMeeting(meetingId);

  if (!tokenResult.success) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Failed to join meeting
          </h2>
          <p className="text-muted-foreground mb-6">{tokenResult.error}</p>
          <Button asChild>
            <Link href="/app">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!tokenResult.data) {
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
      token={tokenResult.data}
      participantName={session.user.name || "Anonymous"}
    />
  );
}
