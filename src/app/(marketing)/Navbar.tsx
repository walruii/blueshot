import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Navbar({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="size-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Blueshot</span>
        </div>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Button asChild>
              <Link href="/app">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
