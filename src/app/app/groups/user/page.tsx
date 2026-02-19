"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAlert } from "@/components/AlertProvider";
import { UserGroup } from "@/types/userGroup";
import {
  getAccessibleUserGroups,
  getUserGroupMembers,
  batchUpdateUserGroupMembers,
  transferUserGroupOwnership,
} from "@/server-actions/userGroup";
import { checkEmailListExist } from "@/server-actions/addEvent";
import {
  UserGroupMemberChange,
  AddMemberChange,
  RemoveMemberChange,
} from "@/types/pendingChanges";
import EmailAddForm from "@/components/EmailAddForm";
import MemberListItem from "@/components/MemberListItem";
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
import { Loader2, Plus, RotateCcw, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface Member {
  userId: string;
  email: string;
  name: string;
}

// Helper to generate unique IDs for changes
let changeIdCounter = 0;
const generateChangeId = () => `change-${++changeIdCounter}`;

export default function ManageUserGroupsPage() {
  const { showAlert } = useAlert();
  const { data: session } = authClient.useSession();

  // Modal state
  const [isCreateUserGroupModalOpen, setIsCreateUserGroupModalOpen] =
    useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);

  // Group selection state
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Selected group data (original from server)
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [originalMembers, setOriginalMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Pending changes
  const [pendingChanges, setPendingChanges] = useState<UserGroupMemberChange[]>(
    [],
  );
  const [isSaving, setIsSaving] = useState(false);

  // Result dialog state
  const [resultData, setResultData] = useState<{
    successCount: number;
    totalCount: number;
    failedChanges: { description: string; error: string }[];
  }>({ successCount: 0, totalCount: 0, failedChanges: [] });

  // Transfer ownership state
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Load groups on mount
  useEffect(() => {
    async function loadGroups() {
      setLoadingGroups(true);
      const result = await getAccessibleUserGroups();
      if (result.success && result.data) {
        setGroups(result.data);
      }
      setLoadingGroups(false);
    }
    loadGroups();
  }, []);

  // Load members when group is selected
  useEffect(() => {
    async function loadMembers() {
      if (!selectedGroupId) {
        setSelectedGroup(null);
        setOriginalMembers([]);
        setPendingChanges([]);
        return;
      }

      setLoadingMembers(true);
      const group = groups.find((g) => g.id === selectedGroupId);
      setSelectedGroup(group || null);

      const result = await getUserGroupMembers(selectedGroupId);
      if (result.success && result.data) {
        setOriginalMembers(result.data);
        setPendingChanges([]); // Reset pending changes when switching groups
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
  }, [selectedGroupId, groups, showAlert]);

  // Compute effective state (original + pending changes)
  const effectiveState = useMemo(() => {
    const members = [...originalMembers];
    const removedUserIds = new Set<string>();
    const addedUserIds = new Set<string>();

    // Apply pending changes
    for (const change of pendingChanges) {
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
  }, [originalMembers, pendingChanges]);

  const hasPendingChanges = pendingChanges.length > 0;

  const handleAddMember = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      if (!selectedGroupId)
        return { success: false, error: "No group selected" };

      const normalizedEmail = email.toLowerCase();

      // Check if already in original data
      if (
        originalMembers.some((m) => m.email.toLowerCase() === normalizedEmail)
      ) {
        return { success: false, error: "This user is already a member" };
      }

      // Check if already in pending additions
      if (
        pendingChanges.some(
          (c) =>
            c.type === "add-member" &&
            c.email.toLowerCase() === normalizedEmail,
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
      const change: AddMemberChange = {
        id: generateChangeId(),
        type: "add-member",
        email: userData.email,
        userId: userData.userId!,
        name: userData.name || userData.email,
      };

      setPendingChanges((prev) => [...prev, change]);
      return { success: true };
    },
    [selectedGroupId, originalMembers, pendingChanges],
  );

  const handleRemoveMember = useCallback(
    (member: Member) => {
      // Check if this is a pending addition - just remove the pending change
      const pendingAddIndex = pendingChanges.findIndex(
        (c) => c.type === "add-member" && c.userId === member.userId,
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
          (c) => c.type === "remove-member" && c.userId === member.userId,
        )
      ) {
        return;
      }

      const change: RemoveMemberChange = {
        id: generateChangeId(),
        type: "remove-member",
        userId: member.userId,
        email: member.email,
        name: member.name,
      };

      setPendingChanges((prev) => [...prev, change]);
    },
    [pendingChanges],
  );

  const handleDiscardChanges = useCallback(() => {
    setPendingChanges([]);
  }, []);

  const handleSaveChanges = useCallback(async () => {
    if (!selectedGroupId || pendingChanges.length === 0) return;

    setIsSaving(true);
    const result = await batchUpdateUserGroupMembers(
      selectedGroupId,
      pendingChanges,
    );

    if (result.success && result.data) {
      const { successful, failed } = result.data;

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

      setResultData({
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

  const handleUserGroupCreated = (newGroup: UserGroup) => {
    setGroups((prev) => [...prev, newGroup]);
    setSelectedGroupId(newGroup.id);
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
        <h1 className="text-xl font-semibold">User Groups</h1>
        <Button onClick={() => setIsCreateUserGroupModalOpen(true)}>
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
            {/* Transfer Ownership Section - Only show to owner and not for Personal group */}
            {selectedGroup.createdBy === session?.user?.id &&
              selectedGroup.name !== "Personal" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                  <h3 className="mb-3 text-sm font-medium">
                    Transfer Ownership
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="new-owner-select">Select New Owner</Label>
                      <Select
                        value={selectedNewOwnerId}
                        onValueChange={setSelectedNewOwnerId}
                      >
                        <SelectTrigger id="new-owner-select">
                          <SelectValue placeholder="Choose new owner from members..." />
                        </SelectTrigger>
                        <SelectContent>
                          {effectiveState.members &&
                            effectiveState.members
                              .filter(
                                (m) =>
                                  !effectiveState.removedUserIds?.has(
                                    m.userId,
                                  ) && m.userId !== session?.user?.id,
                              )
                              .map((member) => (
                                <SelectItem
                                  key={member.userId}
                                  value={member.userId}
                                >
                                  {member.name || member.email}
                                </SelectItem>
                              ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleTransferOwnership}
                      disabled={!selectedNewOwnerId || isTransferring}
                      variant="outline"
                      size="sm"
                    >
                      {isTransferring ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Transfer Ownership
                    </Button>
                  </div>
                </div>
              )}

            {/* Add Member Form */}
            <EmailAddForm onAdd={handleAddMember} label="Add Member by Email" />

            {/* Members List */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                Members (
                {
                  effectiveState.members.filter(
                    (m) => !effectiveState.removedUserIds.has(m.userId),
                  ).length
                }
                )
              </h3>
              {loadingMembers ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : effectiveState.members.filter(
                  (m) => !effectiveState.removedUserIds.has(m.userId),
                ).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No members in this group
                </p>
              ) : (
                <div className="space-y-2">
                  {effectiveState.members.map((member) => {
                    const isRemoved = effectiveState.removedUserIds.has(
                      member.userId,
                    );
                    const isAdded = effectiveState.addedUserIds.has(
                      member.userId,
                    );

                    if (isRemoved) return null;

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
                          onRemove={() => handleRemoveMember(member)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
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
    </div>
  );
}
