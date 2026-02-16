"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Event Group"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Group Name */}
        <div>
          <label
            htmlFor="groupName"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Group Name
          </label>
          <input
            type="text"
            id="groupName"
            value={groupName}
            onChange={(e) => {
              setGroupName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Enter group name"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
            disabled={isSubmitting}
          />
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>

        {/* Permissions */}
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-600">
          <h4 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
        <div className="flex justify-end gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-600">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !groupName.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Group"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
