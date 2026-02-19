"use client";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function useEmailSync() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [signOutLoading, setSignOutLoading] = useState(false);
  const router = useRouter();

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

  const signOut = async () => {
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
  };
  return { email, signOut, signOutLoading };
}
