"use client";
import { useRouter } from "next/navigation";
import Clock from "./Clock";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function NavBar() {
  const router = useRouter();
  return (
    <nav className="flex justify-between items-center p-5 ">
      <Link href="/">
        <h1 className="text-4xl font-extrabold text-blue-500">Blueshot</h1>
      </Link>
      <div className="flex gap-5">
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
