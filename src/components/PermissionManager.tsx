"use client";

import { useState, useEffect, useRef } from "react";
import { PermissionEntry, RoleLabels, RoleValue } from "@/types/permission";
import { UserGroup } from "@/types/userGroup";
import LoadingCircle from "@/svgs/LoadingCircle";

interface PermissionManagerProps {
  permissions: PermissionEntry[];
  onAddEmail: (email: string) => Promise<boolean>;
  onAddUserGroup: (groupId: string, groupName: string) => void;
  onUpdateRole: (identifier: string, newRole: RoleValue) => void;
  onRemoveEntry: (identifier: string) => void;
  isValidating?: boolean;
  validationError?: string | null;
  onClearError?: () => void;
  availableUserGroups?: UserGroup[];
  allowUserGroups?: boolean;
  onCreateUserGroup?: () => void;
  className?: string;
}

export const PermissionManager = ({
  permissions,
  onAddEmail,
  onAddUserGroup,
  onUpdateRole,
  onRemoveEntry,
  isValidating = false,
  validationError,
  onClearError,
  availableUserGroups = [],
  allowUserGroups = true,
  onCreateUserGroup,
  className = "",
}: PermissionManagerProps) => {
  const [emailInput, setEmailInput] = useState("");
  // Debouncing state - reserved for future use
  const [, setDebouncedEmail] = useState("");
  const [showUserGroupDropdown, setShowUserGroupDropdown] = useState(false);
  const [userGroupSearch, setUserGroupSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce email input for validation feedback
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEmail(emailInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [emailInput]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserGroupDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddEmail = async () => {
    if (!emailInput.trim()) return;

    const success = await onAddEmail(emailInput.trim());
    if (success) {
      setEmailInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleSelectUserGroup = (group: UserGroup) => {
    onAddUserGroup(group.id, group.name);
    setShowUserGroupDropdown(false);
    setUserGroupSearch("");
  };

  const filteredUserGroups = availableUserGroups.filter(
    (group) =>
      group.name.toLowerCase().includes(userGroupSearch.toLowerCase()) &&
      !permissions.some((p) => p.identifier === group.id),
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Email Input */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Add by Email
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                if (validationError) onClearError?.();
              }}
              onKeyDown={handleKeyPress}
              placeholder="Enter email address"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              disabled={isValidating}
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
            disabled={isValidating || !emailInput.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
        {validationError && (
          <p className="mt-1 text-sm text-red-500">{validationError}</p>
        )}
      </div>

      {/* User Group Select */}
      {allowUserGroups && (
        <div ref={dropdownRef} className="relative">
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Add User Group
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={userGroupSearch}
                onChange={(e) => {
                  setUserGroupSearch(e.target.value);
                  setShowUserGroupDropdown(true);
                }}
                onFocus={() => setShowUserGroupDropdown(true)}
                placeholder="Search user groups..."
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              />
              {showUserGroupDropdown && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-600 dark:bg-zinc-700">
                  {filteredUserGroups.length > 0 ? (
                    filteredUserGroups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => handleSelectUserGroup(group)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-600"
                      >
                        {group.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-zinc-500">
                      No groups found
                    </div>
                  )}
                  {onCreateUserGroup && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserGroupDropdown(false);
                        onCreateUserGroup();
                      }}
                      className="w-full border-t border-zinc-200 px-3 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50 dark:border-zinc-600 dark:text-blue-400 dark:hover:bg-zinc-600"
                    >
                      + Create New Group
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Permission List */}
      {permissions.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Members & Groups ({permissions.length})
          </label>
          <div className="space-y-2">
            {permissions.map((entry) => (
              <PermissionRow
                key={entry.identifier}
                entry={entry}
                onUpdateRole={onUpdateRole}
                onRemove={onRemoveEntry}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface PermissionRowProps {
  entry: PermissionEntry;
  onUpdateRole: (identifier: string, newRole: RoleValue) => void;
  onRemove: (identifier: string) => void;
}

const PermissionRow = ({
  entry,
  onUpdateRole,
  onRemove,
}: PermissionRowProps) => {
  const isUserGroup = entry.type === "userGroup";

  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700">
      {/* Type indicator */}
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
          isUserGroup
            ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
            : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
        }`}
        title={isUserGroup ? "User Group" : "Individual User"}
      >
        {isUserGroup ? "G" : "U"}
      </div>

      {/* Name/Email */}
      <div className="flex-1 truncate text-sm text-gray-900 dark:text-white">
        {entry.name || entry.identifier}
      </div>

      {/* Role dropdown */}
      <select
        value={entry.role}
        onChange={(e) =>
          onUpdateRole(entry.identifier, Number(e.target.value) as RoleValue)
        }
        className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-600 dark:text-white"
      >
        {Object.entries(RoleLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(entry.identifier)}
        className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-500 dark:hover:bg-gray-600"
        aria-label="Remove"
      >
        <svg
          className="h-4 w-4"
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
  );
};
