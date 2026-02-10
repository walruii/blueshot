"use client";

import { useRealtimeInbox } from "@/hooks/useRealtimeIndox";
import { authClient } from "@/lib/auth-client";
import Loading from "../(header-footer)/Loading";

export default function RealtimeInboxWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();
  useRealtimeInbox(session?.user?.id || "");
  if (isPending) return <Loading />;

  return <>{children}</>;
}
