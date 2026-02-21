import { useCallback } from "react";
import {
  UserGroupMemberChange,
  AddMemberChange,
  RemoveMemberChange,
} from "@/types/pendingChanges";
import { checkEmailListExist } from "@/server-actions/addEvent";

let changeIdCounter = 0;
const generateChangeId = () => `change-${++changeIdCounter}`;

interface Member {
  userId: string;
  email: string;
  name: string;
}

interface UserGroupFormState {
  originalMembers: Member[];
  pendingChanges: UserGroupMemberChange[];
}

/**
 * User group-specific form logic for managing members (no roles).
 * Handles: adding/removing members, duplicate detection, email validation.
 */
export function useUserGroupForm(
  selectedGroupId: string,
  state: UserGroupFormState,
  onAddChange: (change: UserGroupMemberChange) => void,
  onRemoveChange: (changeId: string) => void,
) {
  // Add a member with email validation
  const handleAddMember = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      if (!selectedGroupId)
        return { success: false, error: "No group selected" };

      const normalizedEmail = email.toLowerCase();

      // Check if already in original data
      if (
        state.originalMembers.some(
          (m) => m.email.toLowerCase() === normalizedEmail,
        )
      ) {
        return { success: false, error: "This user is already a member" };
      }

      // Check if already pending
      if (
        state.pendingChanges.some(
          (c) =>
            c.type === "add-member" &&
            (c as AddMemberChange).email.toLowerCase() === normalizedEmail,
        )
      ) {
        return {
          success: false,
          error: "This user is already pending addition",
        };
      }

      // Validate email exists
      const checkResult = await checkEmailListExist([email]);
      if (!checkResult?.success || !checkResult.data?.[0]?.exist) {
        return { success: false, error: "User not found with this email" };
      }

      const userData = checkResult.data[0];

      const change: AddMemberChange = {
        id: generateChangeId(),
        type: "add-member",
        email: userData.email,
        userId: userData.userId!,
        name: userData.name || userData.email,
      };

      onAddChange(change);
      return { success: true };
    },
    [selectedGroupId, state, onAddChange],
  );

  // Remove a member
  const handleRemoveMember = useCallback(
    (member: Member) => {
      // Check if pending add - just remove the change
      const pendingAddIndex = state.pendingChanges.findIndex(
        (c) =>
          c.type === "add-member" &&
          (c as AddMemberChange).userId === member.userId,
      );
      if (pendingAddIndex !== -1) {
        onRemoveChange(state.pendingChanges[pendingAddIndex].id);
        return;
      }

      // Check if already pending removal
      if (
        state.pendingChanges.some(
          (c) =>
            c.type === "remove-member" &&
            (c as RemoveMemberChange).userId === member.userId,
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

      onAddChange(change);
    },
    [state.pendingChanges, onAddChange, onRemoveChange],
  );

  return {
    handleAddMember,
    handleRemoveMember,
  };
}
