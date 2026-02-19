"use client";
import { useState } from "react";

export default function useResendVerification(email: string) {
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

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
  return {
    loading: resendLoading,
    message: resendMessage,
    error: resendError,
    countdown: resendCountdown,
    resend: handleResendEmail,
  };
}
