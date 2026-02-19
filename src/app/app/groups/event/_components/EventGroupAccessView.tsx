import { RoleValue } from "@/types/permission";
import { Loader2 } from "lucide-react";
import MemberListItem from "@/components/MemberListItem";
import { cn } from "@/lib/utils";

interface AccessViewMember {
  userId: string;
  email: string;
  name: string;
  role: RoleValue;
}

interface AccessViewUserGroup {
  id: string;
  name: string;
  role: RoleValue;
}

interface EventGroupAccessViewProps {
  loading: boolean;
  users: AccessViewMember[];
  userGroups: AccessViewUserGroup[];
  removedUserIds: Set<string>;
  removedUserGroupIds: Set<string>;
  addedUserIds: Set<string>;
  addedUserGroupIds: Set<string>;
  roleChanges: Map<string, { oldRole: RoleValue; newRole: RoleValue }>;
  groupRoleChanges: Map<string, { oldRole: RoleValue; newRole: RoleValue }>;
  onRemoveUser: (userId: string, email: string) => void;
  onRemoveUserGroup: (userGroupId: string, name: string) => void;
  onUpdateUserRole: (
    userId: string,
    email: string,
    currentRole: RoleValue,
    newRole: RoleValue,
  ) => void;
  onUpdateUserGroupRole: (
    userGroupId: string,
    name: string,
    currentRole: RoleValue,
    newRole: RoleValue,
  ) => void;
}

export function EventGroupAccessView({
  loading,
  users,
  userGroups,
  removedUserIds,
  removedUserGroupIds,
  addedUserIds,
  addedUserGroupIds,
  roleChanges,
  groupRoleChanges,
  onRemoveUser,
  onRemoveUserGroup,
  onUpdateUserRole,
  onUpdateUserGroupRole,
}: EventGroupAccessViewProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const visibleUsers = users.filter((u) => !removedUserIds.has(u.userId));
  const visibleUserGroups = userGroups.filter(
    (g) => !removedUserGroupIds.has(g.id),
  );

  return (
    <div className="space-y-6">
      {/* Users Section */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          Users ({visibleUsers.length})
        </h3>
        {visibleUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No users with access yet
          </p>
        ) : (
          <div className="space-y-2">
            {visibleUsers.map((user) => {
              const isAdded = addedUserIds.has(user.userId);
              const hasRoleChange = roleChanges.has(user.userId);
              const displayRole = hasRoleChange
                ? roleChanges.get(user.userId)!.newRole
                : user.role;

              return (
                <div
                  key={user.userId}
                  className={cn(
                    "rounded-lg transition-colors",
                    isAdded && "ring-2 ring-green-500/50 bg-green-500/5",
                    hasRoleChange && "ring-2 ring-blue-500/50 bg-blue-500/5",
                  )}
                >
                  <MemberListItem
                    type="user"
                    name={user.name || user.email}
                    email={user.name ? user.email : undefined}
                    onRemove={() => onRemoveUser(user.userId, user.email)}
                    onRoleChange={(newRole) =>
                      onUpdateUserRole(
                        user.userId,
                        user.email,
                        displayRole,
                        newRole,
                      )
                    }
                    role={displayRole}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Groups Section */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          User Groups ({visibleUserGroups.length})
        </h3>
        {visibleUserGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No user groups with access yet
          </p>
        ) : (
          <div className="space-y-2">
            {visibleUserGroups.map((group) => {
              const isAdded = addedUserGroupIds.has(group.id);
              const hasRoleChange = groupRoleChanges.has(group.id);
              const displayRole = hasRoleChange
                ? groupRoleChanges.get(group.id)!.newRole
                : group.role;

              return (
                <div
                  key={group.id}
                  className={cn(
                    "rounded-lg transition-colors",
                    isAdded && "ring-2 ring-green-500/50 bg-green-500/5",
                    hasRoleChange && "ring-2 ring-blue-500/50 bg-blue-500/5",
                  )}
                >
                  <MemberListItem
                    type="userGroup"
                    name={group.name}
                    onRemove={() => onRemoveUserGroup(group.id, group.name)}
                    onRoleChange={(newRole) =>
                      onUpdateUserGroupRole(
                        group.id,
                        group.name,
                        displayRole,
                        newRole,
                      )
                    }
                    role={displayRole}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
