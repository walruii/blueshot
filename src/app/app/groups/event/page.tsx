"use client";

import { useState, useEffect } from "react";
import { useAlert } from "@/app/(alert)/AlertProvider";
import { EventGroup } from "@/types/eventGroup";
import { UserGroup } from "@/types/userGroup";
import {
  getAccessibleEventGroups,
  getEventGroupAccess,
  addAccessToEventGroup,
  removeAccessFromEventGroup,
  EventGroupAccessResult,
} from "@/server-actions/eventGroup";
import { getAccessibleUserGroups } from "@/server-actions/userGroup";
import { checkEmailListExist } from "@/server-actions/addEvent";
import { Role } from "@/types/permission";
import EmailAddForm from "@/components/EmailAddForm";
import UserGroupDropdown from "@/components/UserGroupDropdown";
import MemberListItem from "@/components/MemberListItem";
import { CreateEventGroupModal } from "@/components/CreateEventGroupModal";
import { CreateUserGroupModal } from "@/components/CreateUserGroupModal";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";

export default function ManageEventGroupsPage() {
  const { showAlert } = useAlert();
  const { data: session } = authClient.useSession();

  // Modal state
  const [isCreateEventGroupModalOpen, setIsCreateEventGroupModalOpen] =
    useState(false);
  const [isCreateUserGroupModalOpen, setIsCreateUserGroupModalOpen] =
    useState(false);

  // Group selection state
  const [groups, setGroups] = useState<EventGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Selected group data
  const [selectedGroup, setSelectedGroup] = useState<EventGroup | null>(null);
  const [accessData, setAccessData] = useState<EventGroupAccessResult | null>(
    null,
  );
  const [loadingAccess, setLoadingAccess] = useState(false);

  // Available user groups for adding
  const [availableUserGroups, setAvailableUserGroups] = useState<UserGroup[]>(
    [],
  );

  // Load groups on mount
  useEffect(() => {
    async function loadGroups() {
      setLoadingGroups(true);
      const [groupsResult, userGroupsResult] = await Promise.all([
        getAccessibleEventGroups(),
        getAccessibleUserGroups(),
      ]);

      if (groupsResult.success && groupsResult.data) {
        setGroups(groupsResult.data);
      }
      if (userGroupsResult.success && userGroupsResult.data) {
        setAvailableUserGroups(userGroupsResult.data);
      }
      setLoadingGroups(false);
    }
    loadGroups();
  }, []);

  // Load access when group is selected
  useEffect(() => {
    async function loadAccess() {
      if (!selectedGroupId) {
        setSelectedGroup(null);
        setAccessData(null);
        return;
      }

      setLoadingAccess(true);
      const group = groups.find((g) => g.id === selectedGroupId);
      setSelectedGroup(group || null);

      const result = await getEventGroupAccess(selectedGroupId);
      if (result.success && result.data) {
        setAccessData(result.data);
      } else {
        showAlert({
          title: "Failed to load access",
          description: !result.success ? result.error : "",
          type: "error",
        });
        setAccessData(null);
      }
      setLoadingAccess(false);
    }
    loadAccess();
  }, [selectedGroupId, groups, showAlert]);

  const refreshAccess = async () => {
    if (!selectedGroupId) return;
    const result = await getEventGroupAccess(selectedGroupId);
    if (result.success && result.data) {
      setAccessData(result.data);
    }
  };

  const handleAddUser = async (
    email: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!selectedGroupId) return { success: false, error: "No group selected" };

    // Check if already has access
    if (accessData?.users.some((u) => u.email.toLowerCase() === email)) {
      return { success: false, error: "This user already has access" };
    }

    // Validate email exists
    const checkResult = await checkEmailListExist([email]);
    if (!checkResult?.success || !checkResult.data?.[0]?.exist) {
      return { success: false, error: "User not found with this email" };
    }

    // Add to group
    const result = await addAccessToEventGroup(selectedGroupId, [
      { identifier: email, type: "email", role: Role.READ, name: email },
    ]);

    if (!result.success) {
      return { success: false, error: result.error || "Failed to add user" };
    }

    if (result.data?.added) {
      showAlert({
        title: "User added",
        description: `Added ${email} to the group`,
        type: "success",
      });
      await refreshAccess();
      return { success: true };
    }

    return { success: false, error: "Failed to add user" };
  };

  const handleAddUserGroup = async (userGroup: {
    id: string;
    name: string;
  }) => {
    if (!selectedGroupId) return;

    const result = await addAccessToEventGroup(selectedGroupId, [
      {
        identifier: userGroup.id,
        type: "userGroup",
        role: Role.READ,
        name: userGroup.name,
      },
    ]);

    if (result.success) {
      showAlert({
        title: "User group added",
        description: `Added "${userGroup.name}" to the event group`,
        type: "success",
      });
      await refreshAccess();
    } else {
      showAlert({
        title: "Failed to add user group",
        description: result.error || "",
        type: "error",
      });
    }
  };

  const handleRemoveUser = async (userId: string, email: string) => {
    if (!selectedGroupId) return;

    const result = await removeAccessFromEventGroup(
      selectedGroupId,
      userId,
      undefined,
    );

    if (result.success) {
      showAlert({
        title: "User removed",
        description: `Removed ${email} from the group`,
        type: "success",
      });
      await refreshAccess();
    } else {
      showAlert({
        title: "Failed to remove user",
        description: result.error || "",
        type: "error",
      });
    }
  };

  const handleRemoveUserGroup = async (userGroupId: string, name: string) => {
    if (!selectedGroupId) return;

    const result = await removeAccessFromEventGroup(
      selectedGroupId,
      undefined,
      userGroupId,
    );

    if (result.success) {
      showAlert({
        title: "User group removed",
        description: `Removed "${name}" from the event group`,
        type: "success",
      });
      await refreshAccess();
    } else {
      showAlert({
        title: "Failed to remove user group",
        description: result.error || "",
        type: "error",
      });
    }
  };

  // Get IDs of already-added user groups
  const excludedUserGroupIds = accessData?.userGroups.map((g) => g.id) || [];

  const handleEventGroupCreated = (newGroup: EventGroup) => {
    setGroups((prev) => [...prev, newGroup]);
    setSelectedGroupId(newGroup.id);
    setIsCreateEventGroupModalOpen(false);
  };

  const handleUserGroupCreated = (newGroup: UserGroup) => {
    setAvailableUserGroups((prev) => [...prev, newGroup]);
    setIsCreateUserGroupModalOpen(false);
  };

  if (loadingGroups) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Event Groups</h1>
        <Button onClick={() => setIsCreateEventGroupModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event Group
        </Button>
      </div>

      {/* Group Selector */}
      <div className="space-y-2">
        <Label>Select Event Group</Label>
        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
          <SelectTrigger>
            <SelectValue placeholder="-- Select a group --" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Group Details */}
      {selectedGroup && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedGroup.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add User Form */}
            <EmailAddForm onAdd={handleAddUser} label="Add User by Email" />

            {/* Add User Group */}
            <UserGroupDropdown
              groups={availableUserGroups}
              excludedIds={excludedUserGroupIds}
              onSelect={handleAddUserGroup}
              onCreateUserGroup={() => setIsCreateUserGroupModalOpen(true)}
            />

            {loadingAccess ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Users List */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                    Users ({accessData?.users.length || 0})
                  </h3>
                  {!accessData?.users.length ? (
                    <p className="text-sm text-muted-foreground">
                      No individual users have access
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {accessData.users.map((user) => (
                        <MemberListItem
                          key={user.userId}
                          type="user"
                          name={user.name || user.email}
                          email={user.name ? user.email : undefined}
                          onRemove={() =>
                            handleRemoveUser(user.userId, user.email)
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* User Groups List */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                    User Groups ({accessData?.userGroups.length || 0})
                  </h3>
                  {!accessData?.userGroups.length ? (
                    <p className="text-sm text-muted-foreground">
                      No user groups have access
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {accessData.userGroups.map((group) => (
                        <MemberListItem
                          key={group.id}
                          type="userGroup"
                          name={group.name}
                          onRemove={() =>
                            handleRemoveUserGroup(group.id, group.name)
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!selectedGroupId && groups.length === 0 && (
        <Card className="text-center">
          <CardContent className="py-8">
            <p className="text-muted-foreground">
              You don&apos;t have any event groups yet.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Click &quot;Create Event Group&quot; above to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create Event Group Modal */}
      {session?.user?.id && (
        <CreateEventGroupModal
          isOpen={isCreateEventGroupModalOpen}
          onClose={() => setIsCreateEventGroupModalOpen(false)}
          onCreated={handleEventGroupCreated}
          userId={session.user.id}
          userEmail={session.user.email}
          availableUserGroups={availableUserGroups}
          onCreateUserGroup={() => setIsCreateUserGroupModalOpen(true)}
        />
      )}

      {/* Create User Group Modal */}
      {session?.user?.id && (
        <CreateUserGroupModal
          isOpen={isCreateUserGroupModalOpen}
          onClose={() => setIsCreateUserGroupModalOpen(false)}
          onCreated={handleUserGroupCreated}
          userId={session.user.id}
        />
      )}
    </div>
  );
}
