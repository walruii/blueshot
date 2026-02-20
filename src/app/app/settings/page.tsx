"use client";

import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Enable2FACard } from "./_components/Enable2FACard";
import { Disable2FACard } from "./_components/Disable2FACard";

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
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {/* Account Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">Email:</span>{" "}
            <span className="font-medium">{user.email}</span>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">
              Two-Factor Authentication:
            </span>{" "}
            <span
              className={`font-medium ${user.twoFactorEnabled ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
            >
              {user.twoFactorEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication Management */}
      {user.twoFactorEnabled ? <Disable2FACard /> : <Enable2FACard />}
    </div>
  );
}
