"use client";

import { Loader2 } from "lucide-react";
import UserGroupDropdown from "@/components/UserGroupDropdown";
import MemberListItem from "@/components/MemberListItem";
import { EventAccessResult } from "@/server-actions/event";
import { UserGroup } from "@/types/userGroup";

type UserGroupManagerProps = {
  accessData: EventAccessResult | null;
  loading: boolean;
  availableUserGroups: UserGroup[];
  excludedUserGroupIds: string[];
  onAddUserGroup: (group: { id: string; name: string }) => void;
  onRemoveUserGroup: (userGroupId: string, name: string) => void;
  onCreateUserGroup: () => void;
};

export default function UserGroupManager({
  accessData,
  loading,
  availableUserGroups,
  excludedUserGroupIds,
  onAddUserGroup,
  onRemoveUserGroup,
  onCreateUserGroup,
}: UserGroupManagerProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">User Group Access</h3>
        <p className="text-sm text-muted-foreground">
          Add user groups in addition to the event group
        </p>
      </div>

      <UserGroupDropdown
        groups={availableUserGroups}
        excludedIds={excludedUserGroupIds}
        onSelect={onAddUserGroup}
        label="Add User Group"
        onCreateUserGroup={onCreateUserGroup}
      />

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
            User Groups ({accessData?.userGroups.length || 0})
          </h4>
          {!accessData?.userGroups.length ? (
            <p className="text-sm text-muted-foreground">
              No user groups have direct access
            </p>
          ) : (
            <div className="space-y-2">
              {accessData.userGroups.map((group) => (
                <MemberListItem
                  key={group.id}
                  type="userGroup"
                  name={group.name}
                  onRemove={() => onRemoveUserGroup(group.id, group.name)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
