"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { createUserGroup } from "@/server-actions/userGroup";
import { checkEmailListExist } from "@/server-actions/addEvent";
import { UserGroup } from "@/types/userGroup";
import { useAlert } from "@/app/(alert)/AlertProvider";
import LoadingCircle from "@/svgs/LoadingCircle";

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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create User Group"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Group Name */}
        <div>
          <label
            htmlFor="userGroupName"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Group Name
          </label>
          <input
            type="text"
            id="userGroupName"
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

        {/* Add Members */}
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Add Members by Email
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                onKeyDown={handleKeyPress}
                placeholder="Enter email address"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                disabled={isValidating || isSubmitting}
              />
              {isValidating && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <LoadingCircle />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleAddEmail}
              disabled={isValidating || isSubmitting || !emailInput.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
          {emailError && (
            <p className="mt-1 text-sm text-red-500">{emailError}</p>
          )}
        </div>

        {/* Members List */}
        {members.length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Members ({members.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {members.map((email) => (
                <div
                  key={email}
                  className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(email)}
                    className="ml-1 rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800"
                    disabled={isSubmitting}
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
