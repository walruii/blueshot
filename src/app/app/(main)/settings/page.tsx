"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { UpdateNameCard } from "./_components/UpdateNameCard";
import { UpdateEmailCard } from "./_components/UpdateEmailCard";
import { ChangePasswordCard } from "./_components/ChangePasswordCard";
import { PasskeyManagementCard } from "./_components/PasskeyManagementCard";
import { Enable2FACard } from "./_components/Enable2FACard";
import { Disable2FACard } from "./_components/Disable2FACard";
import { DeleteAccountCard } from "./_components/DeleteAccountCard";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function SettingsPage() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const [hasPassword, setHasPassword] = useState(true);
  const [checkingPassword, setCheckingPassword] = useState(true);

  useEffect(() => {
    const checkPasswordStatus = async () => {
      try {
        // Check if user has an email/password account
        const accounts = await authClient.listAccounts();

        // Check if any account has providerId 'credential' (email/password)
        const hasCredentialAccount = accounts?.data?.some(
          (account: any) => account.providerId === "credential",
        );

        setHasPassword(!!hasCredentialAccount);
      } catch (err) {
        console.error("Failed to check password status:", err);
        // Default to true to be safe
        setHasPassword(true);
      } finally {
        setCheckingPassword(false);
      }
    };

    if (user) {
      checkPasswordStatus();
    }
  }, [user]);

  if (isPending) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <p className="text-muted-foreground">
          Please sign in to access settings.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* OAuth User Banner */}
      {!checkingPassword && !hasPassword && (
        <>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Signed in with Google.</strong> Set up a password below to
              enable email/password sign-in and access all security features.
            </AlertDescription>
          </Alert>
        </>
      )}

      <Separator />

      {/* Profile Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground">
            Update your personal information.
          </p>
        </div>
        <UpdateNameCard currentName={user.name} />
        <UpdateEmailCard currentEmail={user.email} />
      </section>

      <Separator />

      {/* Security Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Security</h2>
          <p className="text-sm text-muted-foreground">
            Manage your authentication methods and security settings.
          </p>
        </div>
        {!checkingPassword && <ChangePasswordCard hasPassword={hasPassword} />}
        <PasskeyManagementCard />
        {!checkingPassword &&
          (user.twoFactorEnabled ? (
            <Disable2FACard />
          ) : (
            <Enable2FACard hasPassword={hasPassword} />
          ))}
      </section>

      <Separator />

      {/* Danger Zone */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-destructive">
            Danger Zone
          </h2>
          <p className="text-sm text-muted-foreground">
            Irreversible actions for your account.
          </p>
        </div>
        {!checkingPassword && <DeleteAccountCard hasPassword={hasPassword} />}
      </section>
    </div>
  );
}
