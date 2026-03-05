"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, Lock } from "lucide-react";
import { validateMeetingPasscode } from "@/server-actions/meeting";
import { authClient } from "@/lib/auth-client";

interface PasscodeEntryScreenProps {
  meetingId: string;
  onSuccess: (userId: string) => void;
  onError?: (error: string) => void;
}

export default function PasscodeEntryScreen({
  meetingId,
  onSuccess,
  onError,
}: PasscodeEntryScreenProps) {
  const [passcode, setPasscode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasscodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow alphanumeric characters, auto-uppercase
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    // Limit to 6 characters
    setPasscode(value.slice(0, 6));
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate input
    if (passcode.length !== 6) {
      setError("Passcode must be 6 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get authenticated user
      const session = await authClient.getSession();
      if (!session?.data?.user?.id) {
        setError("You must be logged in to join this meeting");
        if (onError) {
          onError("Not authenticated");
        }
        return;
      }

      const result = await validateMeetingPasscode(
        meetingId,
        passcode.trim(),
        session.data.user.id,
        "", // IP address will be extracted from headers on server
      );

      if (result.success && result.data) {
        onSuccess(session.data.user.id);
      } else if (!result.success) {
        const errorMsg = result.error || "Failed to validate passcode";
        setError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
      }
    } catch (err) {
      console.error("Error validating passcode:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <Card className="w-full max-w-md bg-background/95 backdrop-blur-sm border-border shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Join Meeting
            </h1>
            <p className="text-muted-foreground">
              Enter the passcode to join this meeting
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Passcode Input */}
            <div className="space-y-2">
              <label
                htmlFor="passcode"
                className="block text-sm font-medium text-foreground"
              >
                Passcode
              </label>
              <Input
                id="passcode"
                type="text"
                placeholder="Enter 6-character passcode"
                value={passcode}
                onChange={handlePasscodeChange}
                className="text-center text-2xl font-bold tracking-widest bg-muted/50 border-muted-foreground/20 text-foreground placeholder:text-muted-foreground"
                disabled={isSubmitting}
                maxLength={6}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                {passcode.length}/6 characters
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={passcode.length !== 6 || isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Meeting"
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
