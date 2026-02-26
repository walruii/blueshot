"use client";

import { Session } from "@/types/sessionType";
import { Button } from "@/components/ui/button";
import { UserIcon, XIcon } from "lucide-react";
import Image from "next/image";

interface SidebarHeaderProps {
  session: Session;
  onGoBack: () => void;
  onClose?: () => void;
}

export default function SidebarHeader({
  session,
  onGoBack,
  onClose,
}: SidebarHeaderProps) {
  return (
    <header className="p-4 border-b border-border flex items-center gap-3 justify-between">
      <div className="flex items-center gap-3">
        {onClose && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="sm:hidden"
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        )}
        <div className="flex justify-center items-center rounded-full overflow-clip h-10 w-10 bg-muted shrink-0">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name}
              width={100}
              height={100}
              className="w-full h-full object-cover"
            />
          ) : (
            <UserIcon />
          )}
        </div>
        <span className="font-bold text-lg text-blue-800">Blueshot</span>
      </div>
      <Button
        className="bg-muted hover:bg-accent text-sm font-medium border border-border transition-colors"
        onClick={onGoBack}
        type="button"
      >
        Dashboard
      </Button>
    </header>
  );
}
