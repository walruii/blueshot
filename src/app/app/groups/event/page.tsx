"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAlert } from "@/components/AlertProvider";
import { EventGroup } from "@/types/eventGroup";
import { UserGroup } from "@/types/userGroup";
import {
  getAccessibleEventGroups,
  getEventGroupAccess,
  batchUpdateEventGroupAccess,
  transferEventGroupOwnership,
  deleteEventGroup,
  EventGroupAccessResult,
} from "@/server-actions/eventGroup";
import { getAccessibleUserGroups } from "@/server-actions/userGroup";
import { checkEmailListExist } from "@/server-actions/addEvent";
import { Role, RoleValue } from "@/types/permission";
import {
  EventGroupChange,
  AddUserChange,
  AddUserGroupChange,
  RemoveUserChange,
  RemoveUserGroupChange,
  UpdateUserRoleChange,
  UpdateUserGroupRoleChange,
} from "@/types/pendingChanges";
import EmailAddForm from "@/components/EmailAddForm";
import UserGroupDropdown from "@/components/UserGroupDropdown";
import MemberListItem from "@/components/MemberListItem";
import { CreateEventGroupModal } from "@/components/CreateEventGroupModal";
import { CreateUserGroupModal } from "@/components/CreateUserGroupModal";
import { BatchResultDialog } from "@/components/BatchResultDialog";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, RotateCcw, Save, Trash2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper to generate unique IDs for changes
let changeIdCounter = 0;
const generateChangeId = () => `change-${++changeIdCounter}`;

export default function ManageEventGroupsPage() {
  const { showAlert } = useAlert();
  const { data: session } = authClient.useSession();

  // Modal state
  const [isCreateEventGroupModalOpen, setIsCreateEventGroupModalOpen] =
    useState(false);
  const [isCreateUserGroupModalOpen, setIsCreateUserGroupModalOpen] =
    useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);

  // Group selection state
  const [groups, setGroups] = useState<EventGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Selected group data (original from server)
  const [selectedGroup, setSelectedGroup] = useState<EventGroup | null>(null);
  const [originalAccessData, setOriginalAccessData] =
    useState<EventGroupAccessResult | null>(null);
  const [loadingAccess, setLoadingAccess] = useState(false);

  // Pending changes
  const [pendingChanges, setPendingChanges] = useState<EventGroupChange[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Result dialog state
  const [resultData, setResultData] = useState<{
    successCount: number;
    totalCount: number;
    failedChanges: { description: string; error: string }[];
  }>({ successCount: 0, totalCount: 0, failedChanges: [] });

  // Available user groups for adding
  const [availableUserGroups, setAvailableUserGroups] = useState<UserGroup[]>(
    [],
  );

  // Transfer ownership state
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Group settings modal state
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        setOriginalAccessData(null);
        setPendingChanges([]);
        return;
      }

      setLoadingAccess(true);
      const group = groups.find((g) => g.id === selectedGroupId);
      setSelectedGroup(group || null);

      const result = await getEventGroupAccess(selectedGroupId);
      if (result.success && result.data) {
        setOriginalAccessData(result.data);
        setPendingChanges([]); // Reset pending changes when switching groups
      } else {
        showAlert({
          title: "Failed to load access",
          description: !result.success ? result.error : "",
          type: "error",
        });
        setOriginalAccessData(null);
      }
      setLoadingAccess(false);
    }
    loadAccess();
  }, [selectedGroupId, groups, showAlert]);

  // Compute effective state (original + pending changes)
  const effectiveState = useMemo(() => {
    if (!originalAccessData)
      return { users: [], userGroups: [], pendingUserIds: new Set<string>() };

    // Start with original data
    const users = [...originalAccessData.users];
    const userGroups = [...originalAccessData.userGroups];
    const removedUserIds = new Set<string>();
    const removedUserGroupIds = new Set<string>();
    const addedUserIds = new Set<string>();
    const addedUserGroupIds = new Set<string>();
    const roleChanges = new Map<
      string,
      { oldRole: RoleValue; newRole: RoleValue }
    >();

    // Apply pending changes
    for (const change of pendingChanges) {
      switch (change.type) {
        case "add-user":
          if (!users.some((u) => u.userId === change.userId)) {
            users.push({
              userId: change.userId,
              email: change.email,
              name: change.name,
              role: change.role,
            });
            addedUserIds.add(change.userId);
          }
          break;
        case "add-user-group":
          if (!userGroups.some((g) => g.id === change.userGroupId)) {
            userGroups.push({
              id: change.userGroupId,
              name: change.name,
              role: change.role,
            });
            addedUserGroupIds.add(change.userGroupId);
          }
          break;
        case "remove-user":
          removedUserIds.add(change.userId);
          break;
        case "remove-user-group":
          removedUserGroupIds.add(change.userGroupId);
          break;
        case "update-user-role": {
          const user = users.find((u) => u.userId === change.userId);
          if (user) {
            user.role = change.newRole;
            roleChanges.set(change.userId, {
              oldRole: change.oldRole,
              newRole: change.newRole,
            });
          }
          break;
        }
        case "update-user-group-role": {
          const group = userGroups.find((g) => g.id === change.userGroupId);
          if (group) {
            group.role = change.newRole;
            roleChanges.set(change.userGroupId, {
              oldRole: change.oldRole,
              newRole: change.newRole,
            });
          }
          break;
        }
      }
    }

    return {
      users,
      userGroups,
      removedUserIds,
      removedUserGroupIds,
      addedUserIds,
      addedUserGroupIds,
      roleChanges,
    };
  }, [originalAccessData, pendingChanges]);

  const hasPendingChanges = pendingChanges.length > 0;

  const handleAddUser = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      if (!selectedGroupId)
        return { success: false, error: "No group selected" };

      const normalizedEmail = email.toLowerCase();

      // Check if already in original data
      if (
        originalAccessData?.users.some(
          (u) => u.email.toLowerCase() === normalizedEmail,
        )
      ) {
        return { success: false, error: "This user already has access" };
      }

      // Check if already in pending additions
      if (
        pendingChanges.some(
          (c) =>
            c.type === "add-user" && c.email.toLowerCase() === normalizedEmail,
        )
      ) {
        return {
          success: false,
          error: "This user is already pending addition",
        };
      }

      // Validate email exists and get user info
      const checkResult = await checkEmailListExist([email]);
      if (!checkResult?.success || !checkResult.data?.[0]?.exist) {
        return { success: false, error: "User not found with this email" };
      }

      const userData = checkResult.data[0];

      // Add to pending changes
      const change: AddUserChange = {
        id: generateChangeId(),
        type: "add-user",
        email: userData.email,
        userId: userData.userId!,
        name: userData.name || userData.email,
        role: Role.READ,
      };

      setPendingChanges((prev) => [...prev, change]);
      return { success: true };
    },
    [selectedGroupId, originalAccessData, pendingChanges],
  );

  const handleAddUserGroup = useCallback(
    (userGroup: { id: string; name: string }) => {
      if (!selectedGroupId) return;

      // Check if already in original data
      if (originalAccessData?.userGroups.some((g) => g.id === userGroup.id)) {
        showAlert({
          title: "Already has access",
          description: "This user group already has access",
          type: "error",
        });
        return;
      }

      // Check if already in pending additions
      if (
        pendingChanges.some(
          (c) => c.type === "add-user-group" && c.userGroupId === userGroup.id,
        )
      ) {
        showAlert({
          title: "Already pending",
          description: "This user group is already pending addition",
          type: "error",
        });
        return;
      }

      const change: AddUserGroupChange = {
        id: generateChangeId(),
        type: "add-user-group",
        userGroupId: userGroup.id,
        name: userGroup.name,
        role: Role.READ,
      };

      setPendingChanges((prev) => [...prev, change]);
    },
    [selectedGroupId, originalAccessData, pendingChanges, showAlert],
  );

  const handleRemoveUser = useCallback(
    (userId: string, email: string) => {
      // Check if this is a pending addition - just remove the pending change
      const pendingAddIndex = pendingChanges.findIndex(
        (c) => c.type === "add-user" && c.userId === userId,
      );
      if (pendingAddIndex !== -1) {
        setPendingChanges((prev) =>
          prev.filter((_, i) => i !== pendingAddIndex),
        );
        return;
      }

      // Check if already pending removal
      if (
        pendingChanges.some(
          (c) => c.type === "remove-user" && c.userId === userId,
        )
      ) {
        return;
      }

      const change: RemoveUserChange = {
        id: generateChangeId(),
        type: "remove-user",
        userId,
        email,
      };

      setPendingChanges((prev) => [...prev, change]);
    },
    [pendingChanges],
  );

  const handleRemoveUserGroup = useCallback(
    (userGroupId: string, name: string) => {
      // Check if this is a pending addition - just remove the pending change
      const pendingAddIndex = pendingChanges.findIndex(
        (c) => c.type === "add-user-group" && c.userGroupId === userGroupId,
      );
      if (pendingAddIndex !== -1) {
        setPendingChanges((prev) =>
          prev.filter((_, i) => i !== pendingAddIndex),
        );
        return;
      }

      // Check if already pending removal
      if (
        pendingChanges.some(
          (c) =>
            c.type === "remove-user-group" && c.userGroupId === userGroupId,
        )
      ) {
        return;
      }

      const change: RemoveUserGroupChange = {
        id: generateChangeId(),
        type: "remove-user-group",
        userGroupId,
        name,
      };

      setPendingChanges((prev) => [...prev, change]);
    },
    [pendingChanges],
  );

  const handleUpdateUserRole = useCallback(
    (
      userId: string,
      email: string,
      currentRole: RoleValue,
      newRole: RoleValue,
    ) => {
      if (currentRole === newRole) return;

      // Check if there's already a role change pending for this user
      const existingChangeIndex = pendingChanges.findIndex(
        (c) => c.type === "update-user-role" && c.userId === userId,
      );

      // Get the original role
      const originalUser = originalAccessData?.users.find(
        (u) => u.userId === userId,
      );
      const originalRole = originalUser?.role as RoleValue | undefined;

      // If new role equals original, remove the pending change
      if (originalRole !== undefined && newRole === originalRole) {
        if (existingChangeIndex !== -1) {
          setPendingChanges((prev) =>
            prev.filter((_, i) => i !== existingChangeIndex),
          );
        }
        return;
      }

      const change: UpdateUserRoleChange = {
        id: generateChangeId(),
        type: "update-user-role",
        userId,
        email,
        oldRole: originalRole ?? currentRole,
        newRole,
      };

      if (existingChangeIndex !== -1) {
        setPendingChanges((prev) =>
          prev.map((c, i) => (i === existingChangeIndex ? change : c)),
        );
      } else {
        setPendingChanges((prev) => [...prev, change]);
      }
    },
    [pendingChanges, originalAccessData],
  );

  const handleUpdateUserGroupRole = useCallback(
    (
      userGroupId: string,
      name: string,
      currentRole: RoleValue,
      newRole: RoleValue,
    ) => {
      if (currentRole === newRole) return;

      // Check if there's already a role change pending for this group
      const existingChangeIndex = pendingChanges.findIndex(
        (c) =>
          c.type === "update-user-group-role" && c.userGroupId === userGroupId,
      );

      // Get the original role
      const originalGroup = originalAccessData?.userGroups.find(
        (g) => g.id === userGroupId,
      );
      const originalRole = originalGroup?.role as RoleValue | undefined;

      // If new role equals original, remove the pending change
      if (originalRole !== undefined && newRole === originalRole) {
        if (existingChangeIndex !== -1) {
          setPendingChanges((prev) =>
            prev.filter((_, i) => i !== existingChangeIndex),
          );
        }
        return;
      }

      const change: UpdateUserGroupRoleChange = {
        id: generateChangeId(),
        type: "update-user-group-role",
        userGroupId,
        name,
        oldRole: originalRole ?? currentRole,
        newRole,
      };

      if (existingChangeIndex !== -1) {
        setPendingChanges((prev) =>
          prev.map((c, i) => (i === existingChangeIndex ? change : c)),
        );
      } else {
        setPendingChanges((prev) => [...prev, change]);
      }
    },
    [pendingChanges, originalAccessData],
  );

  const handleDiscardChanges = useCallback(() => {
    setPendingChanges([]);
  }, []);

  const handleSaveChanges = useCallback(async () => {
    if (!selectedGroupId || pendingChanges.length === 0) return;

    setIsSaving(true);
    const result = await batchUpdateEventGroupAccess(
      selectedGroupId,
      pendingChanges,
    );

    if (result.success && result.data) {
      const { successful, failed } = result.data;

      // Map failed changes to display format
      const failedChanges = failed.map(({ change, error }) => {
        let description = "";
        switch (change.type) {
          case "add-user":
            description = `Add user: ${change.email}`;
            break;
          case "add-user-group":
            description = `Add user group: ${change.name}`;
            break;
          case "remove-user":
            description = `Remove user: ${change.email}`;
            break;
          case "remove-user-group":
            description = `Remove user group: ${change.name}`;
            break;
          case "update-user-role":
            description = `Update role for: ${change.email}`;
            break;
          case "update-user-group-role":
            description = `Update role for group: ${change.name}`;
            break;
        }
        return { description, error };
      });

      setResultData({
        successCount: successful.length,
        totalCount: pendingChanges.length,
        failedChanges,
      });

      // Refresh data from server
      const refreshResult = await getEventGroupAccess(selectedGroupId);
      if (refreshResult.success && refreshResult.data) {
        setOriginalAccessData(refreshResult.data);
      }

      // Keep only failed changes as pending
      const failedChangeIds = new Set(failed.map((f) => f.change.id));
      setPendingChanges((prev) =>
        prev.filter((c) => failedChangeIds.has(c.id)),
      );

      setIsResultDialogOpen(true);
    } else if (!result.success) {
      showAlert({
        title: "Failed to save changes",
        description: result.error,
        type: "error",
      });
    }

    setIsSaving(false);
  }, [selectedGroupId, pendingChanges, showAlert]);

  const handleTransferOwnership = useCallback(async () => {
    if (!selectedGroupId || !selectedNewOwnerId) return;

    setIsTransferring(true);
    const result = await transferEventGroupOwnership(
      selectedGroupId,
      selectedNewOwnerId,
    );

    if (result.success) {
      showAlert({
        title: "Ownership transferred successfully",
        description: `The group is now owned by the selected user.`,
        type: "success",
      });

      // Refresh the groups list and clear selection
      const groupsResult = await getAccessibleEventGroups();
      if (groupsResult.success && groupsResult.data) {
        setGroups(groupsResult.data);
      }

      setSelectedGroupId("");
      setSelectedNewOwnerId("");
    } else {
      showAlert({
        title: "Failed to transfer ownership",
        description: result.error,
        type: "error",
      });
    }

    setIsTransferring(false);
  }, [selectedGroupId, selectedNewOwnerId, showAlert]);

  const handleDeleteGroup = useCallback(async () => {
    if (!selectedGroupId) return;

    setIsDeleting(true);
    const result = await deleteEventGroup(selectedGroupId);

    if (result.success) {
      showAlert({
        title: "Group deleted successfully",
        description: "The event group and all its data has been deleted.",
        type: "success",
      });

      // Refresh the groups list and clear selection
      const groupsResult = await getAccessibleEventGroups();
      if (groupsResult.success && groupsResult.data) {
        setGroups(groupsResult.data);
      }

      setSelectedGroupId("");
      setIsDeleteConfirmOpen(false);
      setIsGroupSettingsOpen(false);
    } else {
      showAlert({
        title: "Failed to delete group",
        description: result.error,
        type: "error",
      });
    }

    setIsDeleting(false);
  }, [selectedGroupId, showAlert]);

  // Get IDs of already-added user groups (including pending)
  const excludedUserGroupIds = useMemo(() => {
    const ids = originalAccessData?.userGroups.map((g) => g.id) || [];
    const pendingIds = pendingChanges
      .filter((c) => c.type === "add-user-group")
      .map((c) => (c as AddUserGroupChange).userGroupId);
    return [...ids, ...pendingIds];
  }, [originalAccessData, pendingChanges]);

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
    <div className="space-y-6 pb-20">
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
        <Select
          value={selectedGroupId}
          onValueChange={setSelectedGroupId}
          disabled={groups.length === 0}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                groups.length === 0
                  ? `No groups available`
                  : `-- Select a group --`
              }
            />
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
                    Users (
                    {
                      effectiveState.users.filter(
                        (u) => !effectiveState.removedUserIds?.has(u.userId),
                      ).length
                    }
                    )
                  </h3>
                  {effectiveState.users.filter(
                    (u) => !effectiveState.removedUserIds?.has(u.userId),
                  ).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No individual users have access
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {effectiveState.users.map((user) => {
                        const isRemoved = effectiveState.removedUserIds?.has(
                          user.userId,
                        );
                        const isAdded = effectiveState.addedUserIds?.has(
                          user.userId,
                        );
                        const roleChange = effectiveState.roleChanges?.get(
                          user.userId,
                        );

                        if (isRemoved) return null;

                        return (
                          <div
                            key={user.userId}
                            className={cn(
                              "rounded-lg transition-colors",
                              isAdded &&
                                "ring-2 ring-green-500/50 bg-green-500/5",
                              roleChange &&
                                !isAdded &&
                                "ring-2 ring-yellow-500/50 bg-yellow-500/5",
                            )}
                          >
                            <MemberListItem
                              type="user"
                              name={user.name || user.email}
                              email={user.name ? user.email : undefined}
                              role={user.role as RoleValue}
                              canEditRole={true}
                              onRoleChange={(newRole) =>
                                handleUpdateUserRole(
                                  user.userId,
                                  user.email,
                                  user.role as RoleValue,
                                  newRole,
                                )
                              }
                              onRemove={() =>
                                handleRemoveUser(user.userId, user.email)
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* User Groups List */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                    User Groups (
                    {
                      effectiveState.userGroups.filter(
                        (g) => !effectiveState.removedUserGroupIds?.has(g.id),
                      ).length
                    }
                    )
                  </h3>
                  {effectiveState.userGroups.filter(
                    (g) => !effectiveState.removedUserGroupIds?.has(g.id),
                  ).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No user groups have access
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {effectiveState.userGroups.map((group) => {
                        const isRemoved =
                          effectiveState.removedUserGroupIds?.has(group.id);
                        const isAdded = effectiveState.addedUserGroupIds?.has(
                          group.id,
                        );
                        const roleChange = effectiveState.roleChanges?.get(
                          group.id,
                        );

                        if (isRemoved) return null;

                        return (
                          <div
                            key={group.id}
                            className={cn(
                              "rounded-lg transition-colors",
                              isAdded &&
                                "ring-2 ring-green-500/50 bg-green-500/5",
                              roleChange &&
                                !isAdded &&
                                "ring-2 ring-yellow-500/50 bg-yellow-500/5",
                            )}
                          >
                            <MemberListItem
                              type="userGroup"
                              name={group.name}
                              role={group.role as RoleValue}
                              canEditRole={true}
                              onRoleChange={(newRole) =>
                                handleUpdateUserGroupRole(
                                  group.id,
                                  group.name,
                                  group.role as RoleValue,
                                  newRole,
                                )
                              }
                              onRemove={() =>
                                handleRemoveUserGroup(group.id, group.name)
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
          {/* Group Settings Footer - Only show to owner */}
          {selectedGroup.createdBy === session?.user?.id &&
            selectedGroup.name !== "Personal" && (
              <div className="border-t bg-muted/50 px-6 py-4">
                <Button
                  onClick={() => setIsGroupSettingsOpen(true)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Group Settings
                </Button>
              </div>
            )}
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

      {/* Sticky Footer for Save/Discard */}
      {hasPendingChanges && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
            <p className="text-sm text-muted-foreground">
              {pendingChanges.length} pending change
              {pendingChanges.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleDiscardChanges}
                disabled={isSaving}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Discard
              </Button>
              <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
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

      {/* Result Dialog */}
      <BatchResultDialog
        isOpen={isResultDialogOpen}
        onClose={() => setIsResultDialogOpen(false)}
        successCount={resultData.successCount}
        totalCount={resultData.totalCount}
        failedChanges={resultData.failedChanges}
      />

      {/* Group Settings Modal */}
      <AlertDialog
        open={isGroupSettingsOpen}
        onOpenChange={setIsGroupSettingsOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Group Settings</AlertDialogTitle>
            <AlertDialogDescription>
              Manage advanced settings for this event group.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {/* Transfer Ownership Section */}
            <div className="space-y-3 border-b pb-4">
              <h4 className="text-sm font-medium">Transfer Ownership</h4>
              <Select
                value={selectedNewOwnerId}
                onValueChange={setSelectedNewOwnerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose new owner..." />
                </SelectTrigger>
                <SelectContent>
                  {effectiveState.users &&
                    effectiveState.users
                      .filter(
                        (u) =>
                          !effectiveState.removedUserIds?.has(u.userId) &&
                          u.userId !== session?.user?.id,
                      )
                      .map((user) => (
                        <SelectItem key={user.userId} value={user.userId}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleTransferOwnership}
                disabled={!selectedNewOwnerId || isTransferring}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {isTransferring ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Transfer Ownership
              </Button>
            </div>

            {/* Delete Group Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-destructive">
                Delete Group
              </h4>
              <p className="text-xs text-muted-foreground">
                Permanently delete this group and all its data. This action
                cannot be undone.
              </p>
              <Button
                onClick={() => setIsDeleteConfirmOpen(true)}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Group
              </Button>
            </div>
          </div>

          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedGroup?.name}&quot;?
              This will permanently delete the group and all its data, including
              all events in this group. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteGroup}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Delete
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
