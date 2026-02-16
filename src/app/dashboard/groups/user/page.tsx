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
import LoadingCircle from "@/svgs/LoadingCircle";
import EmailAddForm from "@/components/EmailAddForm";
import MemberListItem from "@/components/MemberListItem";

interface Member {
  userId: string;
  email: string;
  name: string;
}

export default function ManageUserGroupsPage() {
  const { showAlert } = useAlert();

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

  if (loadingGroups) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingCircle />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Group Selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          Select User Group
        </label>
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="w-full rounded-lg border border-zinc-600 bg-zinc-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">-- Select a group --</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Group Details */}
      {selectedGroup && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">
            {selectedGroup.name}
          </h2>

          {/* Add Member Form */}
          <EmailAddForm onAdd={handleAddMember} label="Add Member by Email" />

          {/* Members List */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-zinc-300">
              Members ({members.length})
            </h3>
            {loadingMembers ? (
              <div className="flex justify-center py-4">
                <LoadingCircle />
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-zinc-500">No members in this group</p>
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
        </div>
      )}

      {/* Empty state */}
      {!selectedGroupId && groups.length === 0 && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-8 text-center">
          <p className="text-zinc-400">
            You don&apos;t have any user groups yet.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Create a user group when adding an event to get started.
          </p>
        </div>
      )}
    </div>
  );
}
