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
import { PermissionManager } from "@/components/PermissionManager";
import { usePermissionManager } from "@/hooks/usePermissionManager";
import { createEventGroup } from "@/server-actions/eventGroup";
import { EventGroup } from "@/types/eventGroup";
import { UserGroup } from "@/types/userGroup";
import { useAlert } from "@/app/(alert)/AlertProvider";

interface CreateEventGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (group: EventGroup) => void;
  userId: string;
  userEmail?: string;
  availableUserGroups?: UserGroup[];
  onCreateUserGroup?: () => void;
}

export const CreateEventGroupModal = ({
  isOpen,
  onClose,
  onCreated,
  userId,
  userEmail,
  availableUserGroups = [],
  onCreateUserGroup,
}: CreateEventGroupModalProps) => {
  const [groupName, setGroupName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showAlert } = useAlert();

  const {
    permissions,
    isValidating,
    validationError,
    addMemberByEmail,
    addUserGroup,
    updateRole,
    removeEntry,
    clearValidationError,
    setPermissions,
  } = usePermissionManager({
    initialPermissions: [],
    excludedEmails: userEmail ? [userEmail] : [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createEventGroup({
        name: groupName.trim(),
        createdBy: userId,
        permissions,
      });

      if (!result.success) {
        setError(result.error || "Failed to create group");
        return;
      }

      showAlert({
        type: "success",
        title: "Event Group Created",
        description: `"${result.data!.name}" has been created successfully.`,
      });

      // Reset form
      setGroupName("");
      setPermissions([]);

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
    setPermissions([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Event Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              type="text"
              id="groupName"
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

          {/* Permissions */}
          <div className="rounded-lg border p-4">
            <h4 className="mb-3 text-sm font-medium">
              Group Access (Optional)
            </h4>
            <PermissionManager
              permissions={permissions}
              onAddEmail={addMemberByEmail}
              onAddUserGroup={addUserGroup}
              onUpdateRole={updateRole}
              onRemoveEntry={removeEntry}
              isValidating={isValidating}
              validationError={validationError}
              onClearError={clearValidationError}
              availableUserGroups={availableUserGroups}
              allowUserGroups={true}
              onCreateUserGroup={onCreateUserGroup}
            />
          </div>

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
