"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import useEmailSync from "./_hooks/use-email-sync";
import useResendVerification from "./_hooks/use-resend-verification";

function VerifyEmailContent() {
  const { email, signOut, signOutLoading } = useEmailSync();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const {
    loading,
    message,
    error: resendError,
    countdown,
    resend,
  } = useResendVerification(email);

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
          {message && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                {message}
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
              onClick={resend}
              disabled={loading || countdown > 0}
              variant="outline"
              className="w-full"
            >
              {loading
                ? "Sending..."
                : countdown > 0
                  ? `Resend in ${countdown}s`
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
            onClick={signOut}
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
