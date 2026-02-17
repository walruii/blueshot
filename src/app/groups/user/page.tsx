"use client";

import { useState, useEffect } from "react";
import { useAlert } from "@/app/(alert)/AlertProvider";
import { UserGroup } from "@/types/userGroup";
import {
  getAccessibleUserGroups,
  getUserGroupMembers,
  addMembersToUserGroup,
  removeMemberFromUserGroup,
} from "@/server-actions/userGroup";
import { checkEmailListExist } from "@/server-actions/addEvent";
import EmailAddForm from "@/components/EmailAddForm";
import MemberListItem from "@/components/MemberListItem";
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

interface Member {
  userId: string;
  email: string;
  name: string;
}

export default function ManageUserGroupsPage() {
  const { showAlert } = useAlert();
  const { data: session } = authClient.useSession();

  // Modal state
  const [isCreateUserGroupModalOpen, setIsCreateUserGroupModalOpen] =
    useState(false);

  // Group selection state
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Selected group data
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Load groups on mount
  useEffect(() => {
    async function loadGroups() {
      setLoadingGroups(true);
      const result = await getAccessibleUserGroups();
      if (result.success && result.data) {
        // Filter to only groups the user created (owns)
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
        setMembers([]);
        return;
      }

      setLoadingMembers(true);
      const group = groups.find((g) => g.id === selectedGroupId);
      setSelectedGroup(group || null);

      const result = await getUserGroupMembers(selectedGroupId);
      if (result.success && result.data) {
        setMembers(result.data);
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

  const handleAddMember = async (
    email: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!selectedGroupId) return { success: false, error: "No group selected" };

    // Check if already a member
    if (members.some((m) => m.email.toLowerCase() === email)) {
      return { success: false, error: "This user is already a member" };
    }

    // Validate email exists
    const checkResult = await checkEmailListExist([email]);
    if (!checkResult?.success || !checkResult.data?.[0]?.exist) {
      return { success: false, error: "User not found with this email" };
    }

    // Add to group
    const result = await addMembersToUserGroup(selectedGroupId, [email]);
    if (!result.success) {
      return { success: false, error: result.error || "Failed to add member" };
    }

    if (result.data?.added.length) {
      showAlert({
        title: "Member added",
        description: `Added ${email} to the group`,
        type: "success",
      });

      // Refresh members list
      const membersResult = await getUserGroupMembers(selectedGroupId);
      if (membersResult.success && membersResult.data) {
        setMembers(membersResult.data);
      }
      return { success: true };
    }

    return { success: false, error: "Failed to add member" };
  };

  const handleRemoveMember = async (member: Member) => {
    if (!selectedGroupId) return;

    const result = await removeMemberFromUserGroup(
      selectedGroupId,
      member.userId,
    );

    if (result.success) {
      showAlert({
        title: "Member removed",
        description: `Removed ${member.email} from the group`,
        type: "success",
      });
      setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
    } else {
      showAlert({
        title: "Failed to remove member",
        description: result.error || "",
        type: "error",
      });
    }
  };

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
    <div className="space-y-6">
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
            {/* Add Member Form */}
            <EmailAddForm onAdd={handleAddMember} label="Add Member by Email" />

            {/* Members List */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                Members ({members.length})
              </h3>
              {loadingMembers ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No members in this group
                </p>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <MemberListItem
                      key={member.userId}
                      type="user"
                      name={member.name || member.email}
                      email={member.name ? member.email : undefined}
                      onRemove={() => handleRemoveMember(member)}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!selectedGroupId && groups.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              You don&apos;t have any user groups yet.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Click &quot;Create User Group&quot; above to get started.
            </p>
          </CardContent>
        </Card>
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
