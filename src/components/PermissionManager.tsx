"use client";

import { useState, useEffect, useRef } from "react";
import { PermissionEntry, RoleLabels, RoleValue } from "@/types/permission";
import { UserGroup } from "@/types/userGroup";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, X, Users, User } from "lucide-react";

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
  const [showUserGroupDropdown, setShowUserGroupDropdown] = useState(false);
  const [userGroupSearch, setUserGroupSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      <div className="space-y-2">
        <Label>Add by Email</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="email"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                if (validationError) onClearError?.();
              }}
              onKeyDown={handleKeyPress}
              placeholder="Enter email address"
              disabled={isValidating}
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
            disabled={isValidating || !emailInput.trim()}
          >
            Add
          </Button>
        </div>
        {validationError && (
          <p className="text-sm text-destructive">{validationError}</p>
        )}
      </div>

      {/* User Group Select */}
      {allowUserGroups && (
        <div ref={dropdownRef} className="relative space-y-2">
          <Label>Add User Group</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                value={userGroupSearch}
                onChange={(e) => {
                  setUserGroupSearch(e.target.value);
                  setShowUserGroupDropdown(true);
                }}
                onFocus={() => setShowUserGroupDropdown(true)}
                placeholder="Search user groups..."
              />
              {showUserGroupDropdown && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-popover shadow-lg">
                  {filteredUserGroups.length > 0 ? (
                    filteredUserGroups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => handleSelectUserGroup(group)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        {group.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
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
                      className="w-full border-t px-3 py-2 text-left text-sm font-medium text-primary hover:bg-accent"
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
        <div className="space-y-2">
          <Label>Members & Groups ({permissions.length})</Label>
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
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
      {/* Type indicator */}
      <Badge variant={isUserGroup ? "secondary" : "outline"} className="shrink-0">
        {isUserGroup ? (
          <Users className="size-3 mr-1" />
        ) : (
          <User className="size-3 mr-1" />
        )}
        {isUserGroup ? "Group" : "User"}
      </Badge>

      {/* Name/Email */}
      <div className="flex-1 truncate text-sm">
        {entry.name || entry.identifier}
      </div>

      {/* Role dropdown */}
      <Select
        value={String(entry.role)}
        onValueChange={(value) =>
          onUpdateRole(entry.identifier, Number(value) as RoleValue)
        }
      >
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(RoleLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Remove button */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => onRemove(entry.identifier)}
        className="text-muted-foreground hover:text-destructive"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
};
