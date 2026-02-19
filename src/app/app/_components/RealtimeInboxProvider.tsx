"use client";

import { useRealtimeInbox } from "@/app/app/_hooks/use-realtime-inbox";
import { authClient } from "@/lib/auth-client";

export default function RealtimeInboxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();
  useRealtimeInbox(session?.user?.id || "");
  if (isPending) return <>{children}</>;

  return <>{children}</>;
}
