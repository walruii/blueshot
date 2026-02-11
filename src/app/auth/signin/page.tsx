"use client";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAlert } from "@/app/(alert)/AlertProvider";

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { showAlert } = useAlert();

  const signIn = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      await authClient.signIn.email(
        { email, password },
        {
          onRequest: () => {
            setLoading(true);
          },
          onSuccess: () => {
            setLoading(false);
            router.push("/dashboard");
          },
          onError: (ctx) => {
            setLoading(false);
            setError(ctx.error.message);
          },
        },
      );
    } catch (err) {
      console.error(err);
      showAlert({
        title: "Internal Server Error",
        description: "Please Try Again Later.",
        type: "error",
      });
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-zinc-950">
      <h1 className="text-4xl font-bold text-blue-500 mb-12">Blueshot</h1>
      <div className="w-full max-w-md bg-zinc-900 rounded-xl shadow-lg p-8 border border-zinc-800">
        <h2 className="text-2xl font-bold text-white mb-6">Sign In</h2>
        {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
        <form onSubmit={(e) => signIn(e)} className="flex flex-col gap-4">
          <div>
            <label className="text-white text-sm block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-white text-sm block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-semibold py-2 rounded transition"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-slate-300 text-sm mt-6 text-center">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="text-blue-400 hover:text-blue-300"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
