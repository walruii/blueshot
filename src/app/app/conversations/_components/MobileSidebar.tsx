"use client";

import { useState } from "react";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import SidebarContent, { SidebarContentProps } from "./SidebarContent";

export default function MobileSidebar(props: SidebarContentProps) {
  const [open, setOpen] = useState(false);

  const handleSelectDirect = (id: string | null) => {
    props.onSelectDirect(id);
    setOpen(false);
  };
  const handleSelectGroup = (id: string | null) => {
    props.onSelectGroup(id);
    setOpen(false);
  };

  return (
    <>
      {/* Mobile header bar with hamburger menu - only visible on mobile */}
      <Sheet open={open} onOpenChange={setOpen}>
        <div className="sm:hidden bg-card border-b border-border shadow-sm">
          <div className="flex items-center h-14 px-4 gap-3">
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-lg hover:bg-accent transition-colors"
                title="Open conversations menu"
              >
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Open sidebar</span>
              </Button>
            </SheetTrigger>
            <div className="text-sm font-semibold text-foreground">
              Conversations
            </div>
          </div>
        </div>
        {open && (
          <div className="fixed bg-black w-full h-full p-0 z-50">
            {/* ensure dialog has accessible title */}
            <SheetTitle className="sr-only">Conversations sidebar</SheetTitle>
            <SidebarContent
              {...props}
              onSelectDirect={handleSelectDirect}
              onSelectGroup={handleSelectGroup}
              onClose={() => setOpen(false)}
            />
          </div>
        )}
      </Sheet>
    </>
  );
}
