import { Suspense } from "react";
import Sidebar from "./_components/Sidebar";
import { auth } from "@/lib/auth";
import LoadingConvoSidebar from "@/components/loading/LoadingConvoSidebar";
import {
  getDirectConversations,
  getGroupConversations,
} from "@/server-actions/conversations";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingConvoSidebar />}>
      <AsyncLayout>{children}</AsyncLayout>
    </Suspense>
  );
}

async function AsyncLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const directConversations = await getDirectConversations();
  const groupConversations = await getGroupConversations();

  if (!session) redirect("/auth/login");

  return (
    <div className="flex h-screen w-screen bg-background text-foreground dark">
      <Sidebar
        directConversations={directConversations}
        groupConversations={groupConversations}
        session={session}
      />
      <main className="flex-1 flex flex-col min-h-0">{children}</main>
    </div>
  );
}
