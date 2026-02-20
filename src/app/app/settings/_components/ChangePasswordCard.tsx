"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useAlert } from "@/components/AlertProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Info } from "lucide-react";

interface ChangePasswordCardProps {
  hasPassword: boolean;
}

export function ChangePasswordCard({ hasPassword }: ChangePasswordCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Submitting password change", {
      hasPassword,
      currentPassword,
      newPassword,
      confirmPassword,
    });

    // Validation
    if (hasPassword && !currentPassword.trim()) {
      setError("Current password is required");
      return;
    }

    if (!newPassword.trim()) {
      setError("New password is required");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Both setting and changing password use the same method
      const payload: any = {
        currentPassword,
        newPassword: newPassword,
        revokeOtherSessions: false,
      };

      // Only include current password if user has one
      if (hasPassword) {
        payload.currentPassword = currentPassword;
      }

      const result = await authClient.changePassword(payload);
      authClient.resetPassword;

      if (result.error) {
        setError(
          result.error.message ||
            (hasPassword
              ? "Failed to change password"
              : "Failed to set password"),
        );
        setLoading(false);
        return;
      }

      // Success!
      showAlert({
        title: hasPassword
          ? "Password changed successfully"
          : "Password set successfully",
        type: "success",
      });
      handleCloseDialog();

      // Refresh to update hasPassword status
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err: any) {
      setError(err?.message || "Failed to update password");
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Password
          </CardTitle>
          <CardDescription>
            {hasPassword
              ? "Change your account password."
              : "Set up a password to enable additional security features."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasPassword && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                You signed in with Google. Setting a password will allow you to
                sign in with email/password and access all security features.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={handleOpenDialog}>
            <Lock className="w-4 h-4 mr-2" />
            {hasPassword ? "Change Password" : "Set Up Password"}
          </Button>
        </CardFooter>
      </Card>

      {/* Change/Set Password Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {hasPassword ? "Change Password" : "Set Up Password"}
            </DialogTitle>
            <DialogDescription>
              {hasPassword
                ? "Enter your current password and choose a new one."
                : "Choose a strong password for your account."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                disabled={loading}
                autoFocus={!hasPassword}
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                disabled={loading}
                minLength={8}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Password must be at least 8 characters long.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? "Saving..."
                  : hasPassword
                    ? "Change Password"
                    : "Set Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
