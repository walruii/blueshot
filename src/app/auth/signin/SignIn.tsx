"use client";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAlert } from "@/app/(alert)/AlertProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useAlert();

  // Check if coming from verified email link
  const verified = searchParams?.get("verified") === "true";

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
          onSuccess: async () => {
            setLoading(false);

            // Get the current session to check if email is verified
            try {
              const sessionData = await authClient.getSession();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const user = (sessionData as any)?.data?.user as
                | { email: string; emailVerified: boolean }
                | undefined;

              if (user && !user.emailVerified) {
                // Email not verified - redirect to verify-email page
                if (user.email) {
                  sessionStorage.setItem("verifyEmail", user.email);
                }
                router.push(
                  `/auth/verify-email?email=${encodeURIComponent(user.email || email)}`,
                );
              } else {
                // Email verified - clear cache and go to app
                sessionStorage.removeItem("verifyEmail");
                router.push("/app");
              }
            } catch (sessionErr) {
              console.error("Error getting session:", sessionErr);
              // Fallback to app if session check fails
              router.push("/app");
            }
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
    <div className="flex flex-col justify-center items-center min-h-screen bg-background px-4">
      <h1 className="text-3xl md:text-4xl font-bold text-primary mb-8 md:mb-12">
        Blueshot
      </h1>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-destructive text-sm mb-4">{error}</div>
          )}
          {verified && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 mb-4 flex gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Email verified successfully!
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                  You can now sign in with your account.
                </p>
              </div>
            </div>
          )}
          <form onSubmit={(e) => signIn(e)} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-muted-foreground text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="text-primary hover:underline"
            >
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
