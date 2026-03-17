import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default async function Navbar({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/blueshot.svg" alt="Blueshot" width={50} height={50} />
          <h1 className="text-2xl font-bold text-blue-600">
            Blue<span className="text-white">shot</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Button asChild>
              <Link href="/app">Dashboard</Link>
            </Button>
          ) : (
            <>
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
