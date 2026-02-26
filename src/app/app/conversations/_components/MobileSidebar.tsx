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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="fixed top-4 left-4 z-50 sm:hidden"
          size="icon"
        >
          <MenuIcon className="h-6 w-6" />
          <span className="sr-only">Open sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-full h-full p-0"
        showCloseButton={false}
      >
        {/* ensure dialog has accessible title */}
        <SheetTitle className="sr-only">Conversations sidebar</SheetTitle>
        <SidebarContent
          {...props}
          onSelectDirect={handleSelectDirect}
          onSelectGroup={handleSelectGroup}
          onClose={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
