"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Mail } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const error = searchParams.get("error");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [signOutLoading, setSignOutLoading] = useState(false);

  // Sync email from URL params, sessionStorage, or user session
  useEffect(() => {
    const syncEmail = async () => {
      const urlEmail = searchParams.get("email");
      if (urlEmail) {
        setEmail(urlEmail);
        // Store in sessionStorage for persistence across refreshes
        sessionStorage.setItem("verifyEmail", urlEmail);
      } else {
        // Try to get from sessionStorage if URL param is missing
        const storedEmail = sessionStorage.getItem("verifyEmail");
        if (storedEmail) {
          setEmail(storedEmail);
        } else {
          // Try to get from current session if nothing else is available
          try {
            const sessionData = await authClient.getSession();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const user = (sessionData as any)?.data?.user as
              | { email: string }
              | undefined;
            if (user?.email) {
              setEmail(user.email);
              sessionStorage.setItem("verifyEmail", user.email);
            }
          } catch (err) {
            console.error("Failed to get session email:", err);
          }
        }
      }
    };

    syncEmail();
  }, [searchParams]);

  const handleResendEmail = async () => {
    // This will be implemented in Milestone 4
    setResendLoading(true);
    setResendError("");
    setResendMessage("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.retryAfter) {
          setResendCountdown(data.retryAfter);
          setResendError(
            `Please wait ${data.retryAfter} seconds before requesting a new email`,
          );
          // Start countdown
          const interval = setInterval(() => {
            setResendCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(interval);
                setResendError("");
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          setResendError(data.error || "Failed to resend email");
        }
      } else {
        setResendMessage("Verification email sent! Check your inbox.");
      }
    } catch (err) {
      console.error("Error resending email:", err);
      setResendError("An error occurred. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-background px-4">
      <h1 className="text-3xl md:text-4xl font-bold text-primary mb-8 md:mb-12">
        Blueshot
      </h1>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription className="mt-2">
            We&apos;ve sent a verification link to
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Display */}
          <div className="bg-muted rounded-lg p-3 text-center break-all">
            <p className="font-semibold text-sm text-foreground">{email}</p>
          </div>

          {/* Error State - Invalid or Expired Link */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  {error === "invalid"
                    ? "Invalid verification link"
                    : "Verification link expired"}
                </p>
                <p className="text-xs text-destructive/80 mt-1">
                  Request a new one below
                </p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {resendMessage && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                {resendMessage}
              </p>
            </div>
          )}

          {/* Resend Error Message */}
          {resendError && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                {resendError}
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Click the link in the email to verify your account. The link will
              expire in 24 hours.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 ml-4 list-disc">
              <li>Check your spam folder if you don&apos;t see it</li>
              <li>You won&apos;t be able to login until verified</li>
            </ul>
          </div>

          {/* Resend Button */}
          <div className="pt-2">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Didn&apos;t receive an email?
            </p>
            <Button
              onClick={handleResendEmail}
              disabled={resendLoading || resendCountdown > 0}
              variant="outline"
              className="w-full"
            >
              {resendLoading
                ? "Sending..."
                : resendCountdown > 0
                  ? `Resend in ${resendCountdown}s`
                  : "Resend verification email"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Support and Sign Out Options */}
      <div className="mt-6 flex flex-col gap-4 items-center">
        <p className="text-sm text-muted-foreground">
          Need help?{" "}
          <Link
            href="mailto:support@blueshot.com"
            className="text-primary hover:underline"
          >
            Contact support
          </Link>
        </p>
        <p className="text-xs text-muted-foreground">
          Wrong account?{" "}
          <button
            onClick={async () => {
              setSignOutLoading(true);
              try {
                await authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      sessionStorage.removeItem("verifyEmail");
                      router.push("/auth/signin");
                    },
                  },
                });
              } catch (err) {
                console.error("Sign out error:", err);
                setSignOutLoading(false);
              }
            }}
            disabled={signOutLoading}
            className="text-primary hover:underline cursor-pointer font-medium disabled:opacity-50"
          >
            {signOutLoading ? "Signing out..." : "Sign in with another account"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
