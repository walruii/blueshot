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
import { Fingerprint, Plus, Trash2, Info } from "lucide-react";

interface Passkey {
  id: string;
  name: string;
  createdAt: Date;
}

export function PasskeyManagementCard() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPasskey, setSelectedPasskey] = useState<Passkey | null>(null);
  const [passkeyName, setPasskeyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingPasskeys, setFetchingPasskeys] = useState(true);
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchPasskeys();
  }, []);

  const fetchPasskeys = async () => {
    try {
      setFetchingPasskeys(true);
      const result = await authClient.passkey.listUserPasskeys();

      if (result.data) {
        setPasskeys(result.data as Passkey[]);
      }
    } catch (err) {
      console.error("Failed to fetch passkeys:", err);
    } finally {
      setFetchingPasskeys(false);
    }
  };

  const handleOpenAddDialog = () => {
    setIsAddDialogOpen(true);
    setPasskeyName("");
    setError("");
  };

  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false);
    setPasskeyName("");
    setError("");
  };

  const handleAddPasskey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passkeyName.trim()) {
      setError("Please enter a name for this passkey");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await authClient.passkey.addPasskey({
        name: passkeyName.trim(),
      });

      if (result.error) {
        setError(result.error.message || "Failed to add passkey");
        setLoading(false);
        return;
      }

      // Success!
      showAlert({
        title: "Passkey added successfully",
        type: "success",
      });
      handleCloseAddDialog();
      await fetchPasskeys();
    } catch (err: any) {
      const errorMessage = err?.message || String(err);

      // Check if user cancelled
      const isCancellation =
        errorMessage.includes("timed out") ||
        errorMessage.includes("not allowed") ||
        errorMessage.includes("abort");

      if (!isCancellation) {
        setError(errorMessage || "Failed to add passkey");
      }
      setLoading(false);
    }
  };

  const handleOpenDeleteDialog = (passkey: Passkey) => {
    setSelectedPasskey(passkey);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedPasskey(null);
  };

  const handleDeletePasskey = async () => {
    if (!selectedPasskey) return;

    setLoading(true);

    try {
      const result = await authClient.passkey.deletePasskey({
        id: selectedPasskey.id,
      });

      if (result.error) {
        showAlert({
          title: result.error.message || "Failed to delete passkey",
          type: "error",
        });
        setLoading(false);
        return;
      }

      // Success!
      showAlert({
        title: "Passkey deleted",
        type: "success",
      });
      handleCloseDeleteDialog();
      await fetchPasskeys();
    } catch (err: any) {
      showAlert({
        title: err?.message || "Failed to delete passkey",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5" />
            Passkeys
          </CardTitle>
          <CardDescription>
            Passkeys let you sign in securely using biometrics or your device's
            security features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fetchingPasskeys ? (
            <div className="text-sm text-muted-foreground">
              Loading passkeys...
            </div>
          ) : passkeys.length > 0 ? (
            <div className="space-y-2">
              {passkeys.map((passkey) => (
                <div
                  key={passkey.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Fingerprint className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{passkey.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(passkey.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDeleteDialog(passkey)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                No passkeys added yet. Add one to enable faster, more secure
                sign-ins.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={handleOpenAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Passkey
          </Button>
        </CardFooter>
      </Card>

      {/* Add Passkey Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleCloseAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Passkey</DialogTitle>
            <DialogDescription>
              Give this passkey a name to help you identify it later.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPasskey} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passkey-name">Passkey Name</Label>
              <Input
                id="passkey-name"
                type="text"
                value={passkeyName}
                onChange={(e) => setPasskeyName(e.target.value)}
                placeholder="e.g., My MacBook, iPhone"
                required
                disabled={loading}
                autoFocus
                maxLength={50}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                You'll be prompted to use your device's biometric authentication
                (Face ID, Touch ID, Windows Hello, etc.).
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseAddDialog}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !passkeyName.trim()}>
                {loading ? "Adding..." : "Add Passkey"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Passkey Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={handleCloseDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Passkey</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedPasskey?.name}"?
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertDescription className="text-xs">
              This action cannot be undone. You'll need to add a new passkey if
              you want to use this device again.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDeleteDialog}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePasskey}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Passkey"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
