"use client";
import { useRouter, usePathname } from "next/navigation";
import { Session } from "@/types/sessionType";
import { InboxDirect, InboxGroup, InboxItem } from "@/types/chat";
import { useEffect, useState } from "react";

import useMediaQuery from "@/hooks/useMediaQuery";
import DesktopSidebar from "./DesktopSidebar";
import MobileSidebar from "./MobileSidebar";

export default function Sidebar({
  directConversations,
  groupConversations,
  session,
}: {
  directConversations: InboxDirect[];
  groupConversations: InboxGroup[];
  session: Session;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // avoid hydration mismatches by deferring any layout that depends on client
  // media queries until after hydration.  the server will always render the
  // desktop sidebar, and we switch to mobile only once `mounted` is true.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // tab state is UI-only; user can switch tabs, but we also update when the
  // route changes so the active tab matches the type of conversation in the
  // URL.  This effect only runs on pathname updates, avoiding an override when
  // the user merely clicks the tab without navigating.
  const [selectedTab, setSelectedTab] = useState<"conversations" | "groups">(
    "conversations",
  );

  // compute selected item from the URL for highlighting the current convo
  let selected: InboxItem | null = null;

  if (pathname) {
    const m = pathname.match(/\/app\/conversations\/(d|g)\/([^\/]+)/);
    if (m) {
      const [, type, id] = m;
      if (type === "d") {
        selected = directConversations.find((c) => c.id === id) ?? selected;
      } else if (type === "g") {
        selected = groupConversations.find((c) => c.id === id) ?? selected;
      }
    }
  }

  // keep the tab state aligned with the path whenever it changes
  useEffect(() => {
    if (!pathname) return;
    const m = pathname.match(/\/app\/conversations\/(d|g)\/([^\/]+)/);
    if (m) {
      const type = m[1];
      setSelectedTab(type === "d" ? "conversations" : "groups");
    }
  }, [pathname]);

  const onGoBack = () => router.push("/app");

  const onSelectDirect = (id: string | null) => {
    if (!id) return;
    const conversation = directConversations.find((c) => c.id === id);
    if (conversation) {
      router.push(`/app/conversations/d/${conversation.id}`);
    }
  };

  const onSelectGroup = (id: string | null) => {
    if (!id) return;
    const conversation = groupConversations.find((c) => c.id === id);
    if (conversation) {
      router.push(`/app/conversations/g/${conversation.id}`);
    }
  };

  const sharedProps = {
    directConversations,
    groupConversations,
    session,
    selectedTab,
    setSelectedTab,
    selected,
    onSelectDirect,
    onSelectGroup,
    onGoBack,
  };

  const isWide = useMediaQuery("(min-width: 640px)");

  // before the client has mounted we render the desktop layout which is
  // identical to what the server produced; once mounted we can switch to
  // mobile if necessary.
  if (!mounted) {
    return <DesktopSidebar {...sharedProps} />;
  }

  return isWide ? (
    <DesktopSidebar {...sharedProps} />
  ) : (
    <MobileSidebar {...sharedProps} />
  );
}
