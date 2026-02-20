"use client";

import { authClient } from "@/lib/auth-client";
import { UpdateNameCard } from "./_components/UpdateNameCard";
import { UpdateEmailCard } from "./_components/UpdateEmailCard";
import { PasskeyManagementCard } from "./_components/PasskeyManagementCard";
import { Enable2FACard } from "./_components/Enable2FACard";
import { Disable2FACard } from "./_components/Disable2FACard";
import { DeleteAccountCard } from "./_components/DeleteAccountCard";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

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
        <PasskeyManagementCard />
        {user.twoFactorEnabled ? <Disable2FACard /> : <Enable2FACard />}
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
        <DeleteAccountCard />
      </section>
    </div>
  );
}
