"use client";
import { useRouter, usePathname } from "next/navigation";
import Clock from "./Clock";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/app");

  return (
    <nav className="flex justify-between items-center p-5 ">
      <Link href="/">
        <h1 className="text-4xl font-extrabold text-blue-500">Blueshot</h1>
      </Link>
      <div className="flex gap-5 items-center">
        {isDashboard && (
          <>
            <Link
              href="/app"
              className={`text-sm font-medium transition ${
                pathname === "/app"
                  ? "text-blue-400"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/app/calendar"
              className={`text-sm font-medium transition ${
                pathname?.startsWith("/app/calendar")
                  ? "text-blue-400"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Calendar
            </Link>
            <Link
              href="/app/groups/user"
              className={`text-sm font-medium transition ${
                pathname?.startsWith("/app/groups")
                  ? "text-blue-400"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Groups
            </Link>
          </>
        )}
        <button
          onClick={async () => {
            await authClient.signOut();
            router.push("/");
          }}
          className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          Sign Out
        </button>
        <Clock />
      </div>
    </nav>
  );
}
