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
import { User, Pencil } from "lucide-react";

interface UpdateNameCardProps {
  currentName: string | null | undefined;
}

export function UpdateNameCard({ currentName }: UpdateNameCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newName, setNewName] = useState(currentName || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setNewName(currentName || "");
    setError("");
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setNewName(currentName || "");
    setError("");
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newName.trim()) {
      setError("Name cannot be empty");
      return;
    }

    if (newName === currentName) {
      setError("Please enter a different name");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await authClient.updateUser({
        name: newName.trim(),
      });

      if (result.error) {
        setError(result.error.message || "Failed to update name");
        setLoading(false);
        return;
      }

      // Success!
      showAlert({
        title: "Name updated successfully",
        type: "success",
      });
      handleCloseDialog();

      // Refresh to show updated name
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err: any) {
      setError(err?.message || "Failed to update name");
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Display Name
          </CardTitle>
          <CardDescription>
            Your display name is shown to other users in the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">
              {currentName || "No name set"}
            </span>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={handleOpenDialog}>
            <Pencil className="w-4 h-4 mr-2" />
            Change Name
          </Button>
        </CardFooter>
      </Card>

      {/* Update Name Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Display Name</DialogTitle>
            <DialogDescription>
              Choose how you want others to see your name.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateName} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">New Name</Label>
              <Input
                id="new-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter your name"
                required
                disabled={loading}
                autoFocus
                maxLength={100}
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
              <Button type="submit" disabled={loading || !newName.trim()}>
                {loading ? "Updating..." : "Update Name"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
