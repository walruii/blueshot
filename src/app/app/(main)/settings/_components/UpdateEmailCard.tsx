"use client";

import { useState } from "react";
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
import { Mail, Pencil, AlertTriangle } from "lucide-react";

interface UpdateEmailCardProps {
  currentEmail: string | null | undefined;
}

export function UpdateEmailCard({ currentEmail }: UpdateEmailCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setNewEmail("");
    setError("");
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setNewEmail("");
    setError("");
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEmail.trim()) {
      setError("Email is required");
      return;
    }

    if (newEmail === currentEmail) {
      setError("Please enter a different email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await authClient.changeEmail({
        newEmail: newEmail.trim().toLowerCase(),
      });

      if (result.error) {
        setError(result.error.message || "Failed to update email");
        setLoading(false);
        return;
      }

      // Success!
      showAlert({
        title: "Verification email sent",
        description: "Check your new email to confirm the change.",
        type: "success",
      });
      handleCloseDialog();
    } catch (err: any) {
      setError(err?.message || "Failed to update email");
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Address
          </CardTitle>
          <CardDescription>
            Your email is used for signing in and receiving notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">{currentEmail}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={handleOpenDialog}>
            <Pencil className="w-4 h-4 mr-2" />
            Change Email
          </Button>
        </CardFooter>
      </Card>

      {/* Update Email Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Email Address</DialogTitle>
            <DialogDescription>
              You'll need to verify your new email address.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                After submitting, you'll receive a verification email at your
                new address. You must verify it to complete the change.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="new-email">New Email Address</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="newemail@example.com"
                required
                disabled={loading}
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !newEmail.trim()}>
                {loading ? "Sending..." : "Send Verification Email"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
