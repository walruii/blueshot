"use client";

import SidebarContent, { SidebarContentProps } from "./SidebarContent";

export default function DesktopSidebar(props: SidebarContentProps) {
  return (
    <aside className="w-80 bg-card border-r border-border flex flex-col">
      <SidebarContent {...props} />
    </aside>
  );
}
