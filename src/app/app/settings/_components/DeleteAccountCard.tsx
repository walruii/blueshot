"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useAlert } from "@/components/AlertProvider";
import { useRouter } from "next/navigation";
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
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteAccountCardProps {
  hasPassword: boolean;
}

export function DeleteAccountCard({ hasPassword }: DeleteAccountCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();
  const router = useRouter();

  const handleOpenDialog = () => {
    // If no password, skip straight to confirmation
    if (!hasPassword) {
      setIsConfirmDialogOpen(true);
    } else {
      setIsDialogOpen(true);
      setPassword("");
      setError("");
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setPassword("");
    setError("");
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    setError("");
    setIsDialogOpen(false);
    setIsConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setIsConfirmDialogOpen(false);
    setConfirmText("");
    setPassword("");
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (confirmText !== "DELETE") {
      setError('Please type "DELETE" to confirm');
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Call delete account endpoint
      const result = await authClient.deleteUser(
        hasPassword ? { password: password } : {},
      );

      if (result.error) {
        setError(result.error.message || "Failed to delete account");
        setLoading(false);
        return;
      }

      // Success - sign out and redirect
      showAlert({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
        type: "success",
      });

      // Sign out and redirect to home page
      await authClient.signOut();
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (err: any) {
      setError(err?.message || "Failed to delete account");
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Warning:</strong> This action cannot be undone. All your
              data, including events, groups, and settings will be permanently
              deleted.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button variant="destructive" onClick={handleOpenDialog}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </CardFooter>
      </Card>

      {/* Password Verification Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Identity</DialogTitle>
            <DialogDescription>
              Enter your password to continue with account deletion.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delete-password">Password</Label>
              <Input
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={loading || !password.trim()}
              >
                Continue
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Final Confirmation Dialog */}
      <Dialog
        open={isConfirmDialogOpen}
        onOpenChange={handleCloseConfirmDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Are You Absolutely Sure?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all data. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                All your events, groups, memberships, and personal data will be
                permanently deleted.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="confirm-delete">
                Type <strong>DELETE</strong> to confirm
              </Label>
              <Input
                id="confirm-delete"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                required
                disabled={loading}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseConfirmDialog}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={loading || confirmText !== "DELETE"}
              >
                {loading ? "Deleting..." : "Delete My Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
