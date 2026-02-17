"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createUserGroup } from "@/server-actions/userGroup";
import { checkEmailListExist } from "@/server-actions/addEvent";
import { UserGroup } from "@/types/userGroup";
import { useAlert } from "@/app/(alert)/AlertProvider";
import { Loader2, X } from "lucide-react";

interface CreateUserGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (group: UserGroup) => void;
  userId: string;
}

export const CreateUserGroupModal = ({
  isOpen,
  onClose,
  onCreated,
  userId,
}: CreateUserGroupModalProps) => {
  const [groupName, setGroupName] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const { showAlert } = useAlert();

  const handleAddEmail = async () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    if (members.includes(email)) {
      setEmailError("This email is already added");
      return;
    }

    setIsValidating(true);
    setEmailError(null);

    try {
      const result = await checkEmailListExist([email]);

      if (!result?.success || !result.data) {
        setEmailError("Failed to validate email");
        return;
      }

      if (!result.data[0].exist) {
        setEmailError("User not found with this email");
        return;
      }

      setMembers((prev) => [...prev, email]);
      setEmailInput("");
    } catch {
      setEmailError("Failed to validate email");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveMember = (email: string) => {
    setMembers((prev) => prev.filter((m) => m !== email));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createUserGroup({
        name: groupName.trim(),
        createdBy: userId,
        memberEmails: members,
      });

      if (!result.success) {
        setError(result.error || "Failed to create group");
        return;
      }

      showAlert({
        type: "success",
        title: "User Group Created",
        description: `"${result.data!.name}" has been created successfully.`,
      });

      // Reset form
      setGroupName("");
      setMembers([]);
      setEmailInput("");

      // Notify parent and close
      onCreated(result.data!);
      onClose();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form state on close
    setGroupName("");
    setMembers([]);
    setEmailInput("");
    setError(null);
    setEmailError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create User Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="userGroupName">Group Name</Label>
            <Input
              type="text"
              id="userGroupName"
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter group name"
              disabled={isSubmitting}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* Add Members */}
          <div className="space-y-2">
            <Label>Add Members by Email</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  onKeyDown={handleKeyPress}
                  placeholder="Enter email address"
                  disabled={isValidating || isSubmitting}
                />
                {isValidating && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="size-4 animate-spin" />
                  </div>
                )}
              </div>
              <Button
                type="button"
                onClick={handleAddEmail}
                disabled={isValidating || isSubmitting || !emailInput.trim()}
              >
                Add
              </Button>
            </div>
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
          </div>

          {/* Members List */}
          {members.length > 0 && (
            <div className="space-y-2">
              <Label>Members ({members.length})</Label>
              <div className="flex flex-wrap gap-2">
                {members.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(email)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted"
                      disabled={isSubmitting}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !groupName.trim()}>
              {isSubmitting ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
