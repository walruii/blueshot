"use client";

import { useRealtimeInbox } from "@/hooks/useRealtimeInbox";
import { authClient } from "@/lib/auth-client";

export default function RealtimeInboxWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();
  useRealtimeInbox(session?.user?.id || "");
  if (isPending) return <>{children}</>;

  return <>{children}</>;
}
