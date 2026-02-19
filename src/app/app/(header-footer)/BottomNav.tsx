"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Calendar, Users, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      href: "/app",
      label: "Dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/app",
    },
    {
      href: "/app/calendar",
      label: "Calendar",
      icon: Calendar,
      isActive: pathname?.startsWith("/app/calendar"),
    },
    {
      href: "/app/groups/user",
      label: "Groups",
      icon: Users,
      isActive: pathname?.startsWith("/app/groups"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                item.isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={async () => {
            await authClient.signOut();
            router.push("/");
          }}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="size-5" />
          <span className="text-xs font-medium">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
