"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface MembersSectionProps {
  members: string[];
  input: string;
  onInputChange: (value: string) => void;
  onAddMembers: () => void;
  onRemoveMember: (member: string) => void;
  isValidating: boolean;
  type: string;
}

export const MembersSection = ({
  members,
  input,
  onInputChange,
  onAddMembers,
  onRemoveMember,
  isValidating,
  type,
}: MembersSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Add {type}</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={`Enter ${type} separated by commas (e.g., user1@example.com, user2@example.com)`}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={onAddMembers}
            disabled={isValidating || !input.trim()}
          >
            {isValidating ? "Checking..." : "Add"}
          </Button>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-muted/50 rounded-lg p-4 border">
        <p className="text-muted-foreground text-sm mb-3">
          {type} ({members.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <Badge
              key={member}
              variant="secondary"
              className="flex items-center gap-1 py-1"
            >
              <span>{member}</span>
              <button
                type="button"
                onClick={() => onRemoveMember(member)}
                className="hover:text-destructive transition ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};
