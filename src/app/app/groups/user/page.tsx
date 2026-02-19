"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAlert } from "@/components/AlertProvider";
import { UserGroup } from "@/types/userGroup";
import {
  getAccessibleUserGroups,
  getUserGroupMembers,
  batchUpdateUserGroupMembers,
  transferUserGroupOwnership,
  deleteUserGroup,
} from "@/server-actions/userGroup";
import { UserGroupMemberChange } from "@/types/pendingChanges";
import EmailAddForm from "@/components/EmailAddForm";
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
import { Loader2, Plus, RotateCcw, Save, Trash2, Settings } from "lucide-react";

// New hooks for refactored logic
import { useGroupManagement } from "@/app/app/groups/_hooks/useGroupManagement";
import { usePendingChanges } from "@/app/app/groups/_hooks/usePendingChanges";
import { useSaveAndRefresh } from "@/app/app/groups/_hooks/useSaveAndRefresh";
import { useUserGroupForm } from "@/app/app/groups/user/_hooks/useUserGroupForm";

// New shared components
import { PendingChangeFooter } from "@/app/app/groups/_components/PendingChangeFooter";
import { GroupSettingsModal } from "@/app/app/groups/_components/GroupSettingsModal";
import { GroupEmptyState } from "@/app/app/groups/_components/GroupEmptyState";

// New page-specific components
import { UserGroupMembersView } from "@/app/app/groups/user/_components/UserGroupMembersView";

interface Member {
  userId: string;
  email: string;
  name: string;
}

export default function ManageUserGroupsPage() {
  const { showAlert } = useAlert();
  const { data: session } = authClient.useSession();

  // Initialize group management hook
  const groupManagement = useGroupManagement(getAccessibleUserGroups);
  const {
    groups,
    selectedGroupId,
    selectedGroup,
    loadingGroups,
    setSelectedGroupId,
    handleGroupCreated,
    handleGroupsRefresh,
    clearSelection,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isGroupSettingsOpen,
    setIsGroupSettingsOpen,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
  } = groupManagement;

  // Selected group data (original from server)
  const [originalMembers, setOriginalMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Transfer ownership state
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Delete operation state
  const [isDeleting, setIsDeleting] = useState(false);

  // Compute effective state (original + pending changes)
  const computeEffectiveState = useCallback(
    (changes: UserGroupMemberChange[]) => {
      const members = [...originalMembers];
      const removedUserIds = new Set<string>();
      const addedUserIds = new Set<string>();

      // Apply pending changes
      for (const change of changes) {
        switch (change.type) {
          case "add-member":
            if (!members.some((m) => m.userId === change.userId)) {
              members.push({
                userId: change.userId,
                email: change.email,
                name: change.name,
              });
              addedUserIds.add(change.userId);
            }
            break;
          case "remove-member":
            removedUserIds.add(change.userId);
            break;
        }
      }

      return {
        members,
        removedUserIds,
        addedUserIds,
      };
    },
    [originalMembers],
  );

  // Initialize pending changes management
  const pendingChangesManager = usePendingChanges(computeEffectiveState);
  const {
    pendingChanges,
    hasPendingChanges,
    discardAll,
    keepOnly,
    addChange,
    removeChange,
  } = pendingChangesManager;
  const effectiveState = pendingChangesManager.effectiveState as {
    members: Member[];
    removedUserIds: Set<string>;
    addedUserIds: Set<string>;
  };

  // Initialize save and refresh management
  const saveManager = useSaveAndRefresh();
  const { isSaving, resultData, isResultDialogOpen, closeResultDialog } =
    saveManager;

  // Memoize form state to prevent infinite loops
  const formState = useMemo(
    () => ({ originalMembers, pendingChanges }),
    [originalMembers, pendingChanges],
  );

  // Initialize form handler hook
  const formHandlers = useUserGroupForm(
    selectedGroupId,
    formState,
    addChange,
    removeChange,
  );
  const { handleAddMember, handleRemoveMember } = formHandlers;

  // Load members when group is selected
  useEffect(() => {
    async function loadMembers() {
      if (!selectedGroupId) {
        setOriginalMembers([]);
        discardAll();
        return;
      }

      setLoadingMembers(true);

      const result = await getUserGroupMembers(selectedGroupId);
      if (result.success && result.data) {
        setOriginalMembers(result.data);
        discardAll(); // Reset pending changes when switching groups
      } else {
        showAlert({
          title: "Failed to load members",
          description: !result.success ? result.error : "",
          type: "error",
        });
      }
      setLoadingMembers(false);
    }
    loadMembers();
  }, [selectedGroupId, showAlert, discardAll]);

  const handleDiscardChanges = useCallback(() => {
    discardAll();
  }, [discardAll]);

  const handleSaveChanges = useCallback(async () => {
    if (!selectedGroupId || pendingChanges.length === 0) return;

    await saveManager.executeSave(
      async () => {
        const result = await batchUpdateUserGroupMembers(
          selectedGroupId,
          pendingChanges,
        );
        return result;
      },
      async (data) => {
        const { successful, failed } = data;

        // Map failed changes to display format
        const failedChanges = failed.map(({ change, error }) => {
          let description = "";
          switch (change.type) {
            case "add-member":
              description = `Add member: ${change.email}`;
              break;
            case "remove-member":
              description = `Remove member: ${change.email}`;
              break;
          }
          return { description, error };
        });

        saveManager.displayResult({
          successCount: successful.length,
          totalCount: pendingChanges.length,
          failedChanges,
        });

        // Refresh data from server
        const refreshResult = await getUserGroupMembers(selectedGroupId);
        if (refreshResult.success && refreshResult.data) {
          setOriginalMembers(refreshResult.data);
        }

        // Keep only failed changes as pending
        const failedChangeIds = new Set(failed.map((f) => f.change.id));
        keepOnly((c) => failedChangeIds.has(c.id));
      },
    );
  }, [selectedGroupId, pendingChanges, saveManager, keepOnly]);

  const handleTransferOwnership = useCallback(async () => {
    if (!selectedGroupId || !selectedNewOwnerId) return;

    setIsTransferring(true);
    const result = await transferUserGroupOwnership(
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
      const groupsResult = await getAccessibleUserGroups();
      if (groupsResult.success && groupsResult.data) {
        handleGroupsRefresh(groupsResult.data);
      }

      clearSelection();
      setSelectedNewOwnerId("");
    } else {
      showAlert({
        title: "Failed to transfer ownership",
        description: result.error,
        type: "error",
      });
    }

    setIsTransferring(false);
  }, [
    selectedGroupId,
    selectedNewOwnerId,
    showAlert,
    handleGroupsRefresh,
    clearSelection,
  ]);

  const handleDeleteGroup = useCallback(async () => {
    if (!selectedGroupId) return;

    setIsDeleting(true);
    const result = await deleteUserGroup(selectedGroupId);

    if (result.success) {
      showAlert({
        title: "Group deleted successfully",
        description: "The user group and all its data has been deleted.",
        type: "success",
      });

      // Refresh the groups list and clear selection
      const groupsResult = await getAccessibleUserGroups();
      if (groupsResult.success && groupsResult.data) {
        handleGroupsRefresh(groupsResult.data);
      }

      clearSelection();
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
  }, [
    selectedGroupId,
    showAlert,
    handleGroupsRefresh,
    clearSelection,
    setIsDeleteConfirmOpen,
    setIsGroupSettingsOpen,
  ]);

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
        <h1 className="text-xl font-semibold">User Groups</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create User Group
        </Button>
      </div>

      {/* Group Selector */}
      <div className="space-y-2">
        <Label>Select User Group</Label>
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
            {/* Add Member Form */}
            <EmailAddForm onAdd={handleAddMember} label="Add Member by Email" />

            {/* Members List */}
            <UserGroupMembersView
              members={effectiveState.members}
              removedIds={effectiveState.removedUserIds}
              addedIds={effectiveState.addedUserIds}
              loading={loadingMembers}
              onRemove={handleRemoveMember}
            />
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
              You don&apos;t have any user groups yet.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Click &quot;Create User Group&quot; above to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {hasPendingChanges && (
        <PendingChangeFooter
          pendingChangesCount={pendingChanges.length}
          onSave={handleSaveChanges}
          onDiscard={handleDiscardChanges}
          isSaving={isSaving}
        />
      )}

      {/* Create User Group Modal */}
      {session?.user?.id && (
        <CreateUserGroupModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleGroupCreated}
          userId={session.user.id}
        />
      )}

      {/* Result Dialog */}
      <BatchResultDialog
        isOpen={isResultDialogOpen}
        onClose={closeResultDialog}
        successCount={resultData.successCount}
        totalCount={resultData.totalCount}
        failedChanges={resultData.failedChanges}
      />

      {/* Group Settings Modal */}
      <GroupSettingsModal
        isOpen={isGroupSettingsOpen}
        onOpenChange={setIsGroupSettingsOpen}
        groupName={selectedGroup?.name || ""}
        currentUserId={session?.user?.id || ""}
        members={effectiveState.members}
        removedMemberIds={effectiveState.removedUserIds}
        selectedNewOwnerId={selectedNewOwnerId}
        onNewOwnerSelect={setSelectedNewOwnerId}
        isTransferring={isTransferring}
        onTransferOwnership={handleTransferOwnership}
        isDeleteConfirmOpen={isDeleteConfirmOpen}
        onDeleteConfirmOpenChange={setIsDeleteConfirmOpen}
        isDeleting={isDeleting}
        onDeleteGroup={handleDeleteGroup}
      />
    </div>
  );
}
