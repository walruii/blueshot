"use client";
import { useRouter, usePathname } from "next/navigation";
import Clock from "./Clock";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/app");

  return (
    <nav className="flex justify-between items-center p-5">
      <Link href="/">
        <h1 className="text-2xl md:text-4xl font-extrabold text-primary">
          Blueshot
        </h1>
      </Link>
      <div className="flex gap-5 items-center">
        {isDashboard && (
          <div className="hidden md:flex gap-5 items-center">
            <Link
              href="/app"
              className={`text-sm font-medium transition ${
                pathname === "/app"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/app/calendar"
              className={`text-sm font-medium transition ${
                pathname?.startsWith("/app/calendar")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Calendar
            </Link>
            <Link
              href="/app/groups/user"
              className={`text-sm font-medium transition ${
                pathname?.startsWith("/app/groups")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Groups
            </Link>
            <Link
              href="/app/settings"
              className={`text-sm font-medium transition ${
                pathname?.startsWith("/app/settings")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Settings
            </Link>
          </div>
        )}
        <Button
          variant="secondary"
          onClick={async () => {
            await authClient.signOut();
            router.push("/");
          }}
          className="hidden md:inline-flex"
        >
          Sign Out
        </Button>
        <Clock />
      </div>
    </nav>
  );
}
