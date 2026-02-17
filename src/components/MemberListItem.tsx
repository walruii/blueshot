"use client";

import { X, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleLabels, RoleValue } from "@/types/permission";

interface MemberListItemProps {
  type: "user" | "userGroup";
  name: string;
  email?: string;
  role?: RoleValue;
  onRemove: () => void;
  onRoleChange?: (newRole: RoleValue) => void;
  disabled?: boolean;
  canEditRole?: boolean;
}

export default function MemberListItem({
  type,
  name,
  email,
  role,
  onRemove,
  onRoleChange,
  disabled = false,
  canEditRole = false,
}: MemberListItemProps) {
  const isUser = type === "user";

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
            isUser
              ? "bg-primary/20 text-primary"
              : "bg-purple-500/20 text-purple-400"
          }`}
        >
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Users className="h-4 w-4" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          {email && isUser && (
            <p className="text-xs text-muted-foreground">{email}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {role !== undefined &&
          (canEditRole && onRoleChange ? (
            <Select
              value={role.toString()}
              onValueChange={(value) =>
                onRoleChange(Number(value) as RoleValue)
              }
              disabled={disabled}
            >
              <SelectTrigger className="w-28 h-8 text-xs">
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
          ) : (
            <span className="text-xs text-muted-foreground px-2">
              {RoleLabels[role as RoleValue] || "Unknown"}
            </span>
          ))}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          className="h-8 w-8 hover:text-destructive"
          title={`Remove ${isUser ? "user" : "user group"}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
