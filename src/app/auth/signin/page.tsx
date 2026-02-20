"use client";
import { Suspense } from "react";
import LoadingAuth from "@/components/loading/LoadingAuth";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if coming from verified email link
  const isVerifiedRedirect = searchParams?.get("verified") === "true";

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
      });
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasskeySignIn = async () => {
    setPasskeyLoading(true);
    setError("");

    try {
      await authClient.signIn.passkey({
        fetchOptions: {
          onSuccess: async () => {
            try {
              const { data } = await authClient.getSession();
              const user = data?.user;

              if (user && !user.emailVerified) {
                if (user.email)
                  sessionStorage.setItem("verifyEmail", user.email);
                router.push(
                  `/auth/verify-email?email=${encodeURIComponent(user.email || "")}`,
                );
              } else {
                sessionStorage.removeItem("verifyEmail");
                router.push("/app");
              }
            } catch (err) {
              router.push("/app");
            }
          },
          onError: (ctx) => {
            console.log("Passkey onError callback triggered", ctx);
            const error = ctx.error;

            // Better Auth standardizes the "User Cancelled" error here
            if (
              error.status === 403 ||
              error.code === "NOT_ALLOWED" ||
              error.message.includes("not allowed")
            ) {
              console.log(
                "User cancelled the prompt. No need to show a scary error message.",
              );
              // Just stop loading, don't set an error message
            } else {
              console.error("Actual Passkey Error:", error);
              setError(error.message || "Passkey sign-in failed.");
            }
            setPasskeyLoading(false); // Make sure to turn off loading on error!
          },
        },
      });
    } catch (err) {
      console.error("Unexpected error during Passkey sign-in:", err);
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleSignIn = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    await authClient.signIn.email(
      { email, password },
      {
        onRequest: () => {
          setLoading(true);
        },
        onError: (ctx) => {
          setLoading(false);
          setError(ctx.error.message);
        },
        onSuccess: async () => {
          setLoading(false);
          try {
            const { data } = await authClient.getSession();
            const user = data?.user;

            if (user && !user.emailVerified) {
              if (user.email) sessionStorage.setItem("verifyEmail", user.email);
              router.push(
                `/auth/verify-email?email=${encodeURIComponent(user.email || email)}`,
              );
            } else {
              sessionStorage.removeItem("verifyEmail");
              router.push("/app");
            }
          } catch (err) {
            router.push("/app"); // Fallback
          } finally {
            setLoading(false);
          }
        },
      },
    );
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
          {isVerifiedRedirect && (
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
          {/* Passkey Button */}
          <Button
            onClick={handlePasskeySignIn}
            disabled={passkeyLoading}
            variant="outline"
            className="w-full mb-4"
          >
            {passkeyLoading ? "Signing in..." : "Sign in with Passkey"}
          </Button>

          {/* Google OAuth Button */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            variant="outline"
            className="w-full mb-4"
          >
            {googleLoading ? "Signing in..." : "Sign in with Google"}
          </Button>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <form
            onSubmit={(e) => handleSignIn(e)}
            className="flex flex-col gap-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                autoComplete="email webauthn"
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
                autoComplete="current-password webauthn"
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

export default function Page() {
  return (
    <Suspense fallback={<LoadingAuth />}>
      <SignInForm />
    </Suspense>
  );
}
