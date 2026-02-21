import { cn } from "@/lib/utils";
import MemberListItem from "@/components/MemberListItem";
import { Loader2 } from "lucide-react";
import { RoleValue } from "@/types/permission";

interface Member {
  userId: string;
  email: string;
  name: string;
}

interface MembersListSectionProps {
  title: string;
  members: Member[];
  removedIds: Set<string>;
  addedIds: Set<string>;
  loading: boolean;
  emptyMessage?: string;
  onRemove: (member: Member) => void;
  onRoleChange?: (memberId: string, email: string, newRole: RoleValue) => void;
  currentRole?: RoleValue;
}

export function MembersListSection({
  title,
  members,
  removedIds,
  addedIds,
  loading,
  emptyMessage = "No members in this group",
  onRemove,
  onRoleChange,
  currentRole,
}: MembersListSectionProps) {
  const visibleMembers = members.filter((m) => !removedIds.has(m.userId));

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">
        {title} ({visibleMembers.length})
      </h3>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : visibleMembers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {visibleMembers.map((member) => {
            const isAdded = addedIds.has(member.userId);

            return (
              <div
                key={member.userId}
                className={cn(
                  "rounded-lg transition-colors",
                  isAdded && "ring-2 ring-green-500/50 bg-green-500/5",
                )}
              >
                <MemberListItem
                  type="user"
                  name={member.name || member.email}
                  email={member.name ? member.email : undefined}
                  onRemove={() => onRemove(member)}
                  onRoleChange={
                    onRoleChange
                      ? (newRole) =>
                          onRoleChange(member.userId, member.email, newRole)
                      : undefined
                  }
                  role={currentRole}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
