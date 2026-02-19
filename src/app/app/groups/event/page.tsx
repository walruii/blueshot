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
import { RoleValue } from "@/types/permission";
import { EventGroupChange, AddUserGroupChange } from "@/types/pendingChanges";
import EmailAddForm from "@/components/EmailAddForm";
import UserGroupDropdown from "@/components/UserGroupDropdown";
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
import { Loader2, Plus, Settings } from "lucide-react";
// New hooks for refactored logic
import { useGroupManagement } from "@/app/app/groups/_hooks/useGroupManagement";
import { usePendingChanges } from "@/app/app/groups/_hooks/usePendingChanges";
import { useSaveAndRefresh } from "@/app/app/groups/_hooks/useSaveAndRefresh";
import { useEventGroupForm } from "@/app/app/groups/event/_hooks/useEventGroupForm";
// New shared components
import { PendingChangeFooter } from "@/app/app/groups/_components/PendingChangeFooter";
import { GroupSettingsModal } from "@/app/app/groups/_components/GroupSettingsModal";
import { GroupEmptyState } from "@/app/app/groups/_components/GroupEmptyState";
// New page-specific components
import { EventGroupAccessView } from "@/app/app/groups/event/_components/EventGroupAccessView";

export default function ManageEventGroupsPage() {
  const { showAlert } = useAlert();
  const { data: session } = authClient.useSession();

  // Use group management hook for core group/modal state
  const groupManagement = useGroupManagement(getAccessibleEventGroups);

  // Local modal states for create operations (page-specific)
  const [isCreateEventGroupModalOpen, setIsCreateEventGroupModalOpen] =
    useState(false);
  const [isCreateUserGroupModalOpen, setIsCreateUserGroupModalOpen] =
    useState(false);

  // Selected group data (original from server)
  const [originalAccessData, setOriginalAccessData] =
    useState<EventGroupAccessResult | null>(null);
  const [loadingAccess, setLoadingAccess] = useState(false);

  // Available user groups for adding
  const [availableUserGroups, setAvailableUserGroups] = useState<UserGroup[]>(
    [],
  );

  // Transfer ownership state
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Group settings modal state
  const [isDeleting, setIsDeleting] = useState(false);

  // Load available user groups (not managed by group management hook)
  useEffect(() => {
    async function loadAvailableUserGroups() {
      const result = await getAccessibleUserGroups();
      if (result.success && result.data) {
        setAvailableUserGroups(result.data);
      }
    }
    loadAvailableUserGroups();
  }, []);

  // Load access when group is selected
  useEffect(() => {
    async function loadAccess() {
      if (!groupManagement.selectedGroupId) {
        setOriginalAccessData(null);
        pendingChangesManager.discardAll();
        return;
      }

      setLoadingAccess(true);
      const result = await getEventGroupAccess(groupManagement.selectedGroupId);
      if (result.success && result.data) {
        setOriginalAccessData(result.data);
        pendingChangesManager.discardAll(); // Reset pending changes when switching groups
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
  }, [groupManagement.selectedGroupId, showAlert]);

  // Compute effective state (original + pending changes)
  const computeEffectiveState = (changes: EventGroupChange[]) => {
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
    const groupRoleChanges = new Map<
      string,
      { oldRole: RoleValue; newRole: RoleValue }
    >();

    // Apply pending changes
    for (const change of changes) {
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
            groupRoleChanges.set(change.userGroupId, {
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
      groupRoleChanges,
    };
  };

  // Use pending changes hook with custom effective state computation
  const pendingChangesManager = usePendingChanges(computeEffectiveState);

  // Use save and refresh hook
  const saveManager = useSaveAndRefresh();

  // Event-specific form logic
  const formHandlers = useEventGroupForm(
    groupManagement.selectedGroupId,
    {
      originalAccessData: originalAccessData
        ? {
            users: originalAccessData.users.map((u) => ({
              userId: u.userId,
              email: u.email,
              name: u.name,
              role: u.role as RoleValue,
            })),
            userGroups: originalAccessData.userGroups.map((g) => ({
              id: g.id,
              name: g.name,
              role: g.role as RoleValue,
            })),
          }
        : undefined,
      pendingChanges: pendingChangesManager.pendingChanges,
    },
    pendingChangesManager.addChange,
    pendingChangesManager.removeChange,
    pendingChangesManager.updateChange,
  );

  const {
    handleAddUser,
    handleAddUserGroup,
    handleRemoveUser,
    handleRemoveUserGroup,
    handleUpdateUserRole,
    handleUpdateUserGroupRole,
  } = formHandlers;

  // Wrapper for handleAddUserGroup to match UserGroupDropdown signature
  const onSelectUserGroup = useCallback(
    (userGroup: { id: string; name: string }) => {
      handleAddUserGroup(userGroup, (errorMsg) => {
        showAlert({
          title: "Already has access",
          description: errorMsg,
          type: "error",
        });
      });
    },
    [handleAddUserGroup, showAlert],
  );

  const handleDiscardChanges = useCallback(() => {
    pendingChangesManager.discardAll();
  }, [pendingChangesManager]);

  const handleSaveChanges = useCallback(async () => {
    if (
      !groupManagement.selectedGroupId ||
      pendingChangesManager.pendingChanges.length === 0
    )
      return;

    const result = await batchUpdateEventGroupAccess(
      groupManagement.selectedGroupId,
      pendingChangesManager.pendingChanges,
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

      saveManager.displayResult({
        successCount: successful.length,
        totalCount: pendingChangesManager.pendingChanges.length,
        failedChanges,
      });

      // Refresh data from server
      const refreshResult = await getEventGroupAccess(
        groupManagement.selectedGroupId,
      );
      if (refreshResult.success && refreshResult.data) {
        setOriginalAccessData(refreshResult.data);
      }

      // Keep only failed changes as pending
      const failedChangeIds = new Set(failed.map((f) => f.change.id));
      pendingChangesManager.keepOnly((c) => failedChangeIds.has(c.id));
    } else if (!result.success) {
      showAlert({
        title: "Failed to save changes",
        description: result.error,
        type: "error",
      });
    }
  }, [
    groupManagement.selectedGroupId,
    pendingChangesManager,
    saveManager,
    showAlert,
  ]);

  const handleTransferOwnership = useCallback(async () => {
    if (!groupManagement.selectedGroupId || !selectedNewOwnerId) return;

    setIsTransferring(true);
    const result = await transferEventGroupOwnership(
      groupManagement.selectedGroupId,
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
        groupManagement.handleGroupsRefresh(groupsResult.data);
      }

      groupManagement.clearSelection();
      setSelectedNewOwnerId("");
    } else {
      showAlert({
        title: "Failed to transfer ownership",
        description: result.error,
        type: "error",
      });
    }

    setIsTransferring(false);
  }, [groupManagement.selectedGroupId, selectedNewOwnerId, showAlert]);

  const handleDeleteGroup = useCallback(async () => {
    if (!groupManagement.selectedGroupId) return;

    setIsDeleting(true);
    const result = await deleteEventGroup(groupManagement.selectedGroupId);

    if (result.success) {
      showAlert({
        title: "Group deleted successfully",
        description: "The event group and all its data has been deleted.",
        type: "success",
      });

      // Refresh the groups list and clear selection
      const groupsResult = await getAccessibleEventGroups();
      if (groupsResult.success && groupsResult.data) {
        groupManagement.handleGroupsRefresh(groupsResult.data);
      }

      groupManagement.clearSelection();
      groupManagement.setIsDeleteConfirmOpen(false);
      groupManagement.setIsGroupSettingsOpen(false);
    } else {
      showAlert({
        title: "Failed to delete group",
        description: result.error,
        type: "error",
      });
    }

    setIsDeleting(false);
  }, [groupManagement.selectedGroupId, showAlert]);

  // Get IDs of already-added user groups (including pending)
  const excludedUserGroupIds = useMemo(() => {
    const ids = originalAccessData?.userGroups.map((g) => g.id) || [];
    const pendingIds = pendingChangesManager.pendingChanges
      .filter((c) => c.type === "add-user-group")
      .map((c) => (c as AddUserGroupChange).userGroupId);
    return [...ids, ...pendingIds];
  }, [originalAccessData, pendingChangesManager.pendingChanges]);

  const handleEventGroupCreated = (newGroup: EventGroup) => {
    groupManagement.handleGroupCreated(newGroup);
    setIsCreateEventGroupModalOpen(false);
  };

  const handleUserGroupCreated = (newGroup: UserGroup) => {
    setAvailableUserGroups((prev) => [...prev, newGroup]);
    setIsCreateUserGroupModalOpen(false);
  };

  if (groupManagement.loadingGroups) {
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
          value={groupManagement.selectedGroupId}
          onValueChange={groupManagement.setSelectedGroupId}
          disabled={groupManagement.groups.length === 0}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                groupManagement.groups.length === 0
                  ? `No groups available`
                  : `-- Select a group --`
              }
            />
          </SelectTrigger>
          <SelectContent>
            {groupManagement.groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Group Details */}
      {groupManagement.selectedGroup && (
        <Card>
          <CardHeader>
            <CardTitle>{groupManagement.selectedGroup.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add User Form */}
            <EmailAddForm onAdd={handleAddUser} label="Add User by Email" />

            {/* Add User Group */}
            <UserGroupDropdown
              groups={availableUserGroups}
              excludedIds={excludedUserGroupIds}
              onSelect={onSelectUserGroup}
              onCreateUserGroup={() => setIsCreateUserGroupModalOpen(true)}
            />

            {/* Access View */}
            <EventGroupAccessView
              loading={loadingAccess}
              users={pendingChangesManager.effectiveState.users || []}
              userGroups={pendingChangesManager.effectiveState.userGroups || []}
              removedUserIds={
                pendingChangesManager.effectiveState.removedUserIds || new Set()
              }
              removedUserGroupIds={
                pendingChangesManager.effectiveState.removedUserGroupIds ||
                new Set()
              }
              addedUserIds={
                pendingChangesManager.effectiveState.addedUserIds || new Set()
              }
              addedUserGroupIds={
                pendingChangesManager.effectiveState.addedUserGroupIds ||
                new Set()
              }
              roleChanges={
                pendingChangesManager.effectiveState.roleChanges || new Map()
              }
              groupRoleChanges={
                pendingChangesManager.effectiveState.groupRoleChanges ||
                new Map()
              }
              onRemoveUser={handleRemoveUser}
              onRemoveUserGroup={handleRemoveUserGroup}
              onUpdateUserRole={handleUpdateUserRole}
              onUpdateUserGroupRole={handleUpdateUserGroupRole}
            />
          </CardContent>
          {/* Group Settings Footer - Only show to owner */}
          {groupManagement.selectedGroup.createdBy === session?.user?.id &&
            groupManagement.selectedGroup.name !== "Personal" && (
              <div className="border-t bg-muted/50 px-6 py-4">
                <Button
                  onClick={() => groupManagement.setIsGroupSettingsOpen(true)}
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
      {!groupManagement.selectedGroupId &&
        groupManagement.groups.length === 0 && (
          <GroupEmptyState
            message="You don't have any event groups yet."
            actionPrompt='Click "Create Event Group" above to get started.'
          />
        )}

      {/* Pending Changes Footer */}
      {pendingChangesManager.hasPendingChanges && (
        <PendingChangeFooter
          pendingChangesCount={pendingChangesManager.pendingChanges.length}
          onSave={handleSaveChanges}
          onDiscard={handleDiscardChanges}
          isSaving={saveManager.isSaving}
        />
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
        isOpen={saveManager.isResultDialogOpen}
        onClose={saveManager.closeResultDialog}
        successCount={saveManager.resultData.successCount}
        totalCount={saveManager.resultData.totalCount}
        failedChanges={saveManager.resultData.failedChanges}
      />

      {/* Group Settings Modal */}
      {groupManagement.selectedGroup && session?.user?.id && (
        <GroupSettingsModal
          isOpen={groupManagement.isGroupSettingsOpen}
          onOpenChange={groupManagement.setIsGroupSettingsOpen}
          groupName={groupManagement.selectedGroup.name}
          currentUserId={session.user.id}
          members={pendingChangesManager.effectiveState.users || []}
          removedMemberIds={
            pendingChangesManager.effectiveState.removedUserIds || new Set()
          }
          selectedNewOwnerId={selectedNewOwnerId}
          onNewOwnerSelect={setSelectedNewOwnerId}
          isTransferring={isTransferring}
          onTransferOwnership={handleTransferOwnership}
          isDeleteConfirmOpen={groupManagement.isDeleteConfirmOpen}
          onDeleteConfirmOpenChange={groupManagement.setIsDeleteConfirmOpen}
          isDeleting={isDeleting}
          onDeleteGroup={handleDeleteGroup}
        />
      )}
    </div>
  );
}
