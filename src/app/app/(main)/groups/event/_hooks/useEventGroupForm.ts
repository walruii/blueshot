import { useCallback } from "react";
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
import { checkEmailListExist } from "@/server-actions/addEvent";

let changeIdCounter = 0;
const generateChangeId = () => `change-${++changeIdCounter}`;

interface EventGroupFormState {
  originalAccessData?: {
    users: Array<{
      userId: string;
      email: string;
      name: string;
      role: RoleValue;
    }>;
    userGroups: Array<{ id: string; name: string; role: RoleValue }>;
  };
  pendingChanges: EventGroupChange[];
}

/**
 * Event-specific form logic for managing users and user groups with roles.
 * Handles: adding/removing users and groups, role changes, duplicate detection.
 */
export function useEventGroupForm(
  selectedGroupId: string,
  state: EventGroupFormState,
  onAddChange: (
    change: EventGroupChange,
    shouldAdd?: (
      changes: EventGroupChange[],
      newChange: EventGroupChange,
    ) => boolean,
  ) => void,
  onRemoveChange: (changeId: string) => void,
  onUpdateChange: (changeId: string, updated: EventGroupChange) => void,
) {
  // Add a user with email validation
  const handleAddUser = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      if (!selectedGroupId)
        return { success: false, error: "No group selected" };

      const normalizedEmail = email.toLowerCase();

      // Check if already in original data
      if (
        state.originalAccessData?.users.some(
          (u) => u.email.toLowerCase() === normalizedEmail,
        )
      ) {
        return { success: false, error: "This user already has access" };
      }

      // Check if already pending
      if (
        state.pendingChanges.some(
          (c) =>
            c.type === "add-user" &&
            (c as AddUserChange).email.toLowerCase() === normalizedEmail,
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

      const change: AddUserChange = {
        id: generateChangeId(),
        type: "add-user",
        email: userData.email,
        userId: userData.userId!,
        name: userData.name || userData.email,
        role: Role.READ,
      };

      onAddChange(change);
      return { success: true };
    },
    [selectedGroupId, state, onAddChange],
  );

  // Add a user group with validation
  const handleAddUserGroup = useCallback(
    (
      userGroup: { id: string; name: string },
      onError: (msg: string) => void,
    ) => {
      if (!selectedGroupId) return;

      // Check if already in original data
      if (
        state.originalAccessData?.userGroups.some((g) => g.id === userGroup.id)
      ) {
        onError("This user group already has access");
        return;
      }

      // Check if already pending
      if (
        state.pendingChanges.some(
          (c) =>
            c.type === "add-user-group" &&
            (c as AddUserGroupChange).userGroupId === userGroup.id,
        )
      ) {
        onError("This user group is already pending addition");
        return;
      }

      const change: AddUserGroupChange = {
        id: generateChangeId(),
        type: "add-user-group",
        userGroupId: userGroup.id,
        name: userGroup.name,
        role: Role.READ,
      };

      onAddChange(change);
    },
    [selectedGroupId, state, onAddChange],
  );

  // Remove a user
  const handleRemoveUser = useCallback(
    (userId: string, email: string) => {
      // Check if pending add - just remove the change
      const pendingAddIndex = state.pendingChanges.findIndex(
        (c) => c.type === "add-user" && (c as AddUserChange).userId === userId,
      );
      if (pendingAddIndex !== -1) {
        onRemoveChange(state.pendingChanges[pendingAddIndex].id);
        return;
      }

      // Check if already pending removal
      if (
        state.pendingChanges.some(
          (c) =>
            c.type === "remove-user" &&
            (c as RemoveUserChange).userId === userId,
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

      onAddChange(change);
    },
    [state.pendingChanges, onAddChange, onRemoveChange],
  );

  // Remove a user group
  const handleRemoveUserGroup = useCallback(
    (userGroupId: string, name: string) => {
      // Check if pending add - just remove the change
      const pendingAddIndex = state.pendingChanges.findIndex(
        (c) =>
          c.type === "add-user-group" &&
          (c as AddUserGroupChange).userGroupId === userGroupId,
      );
      if (pendingAddIndex !== -1) {
        onRemoveChange(state.pendingChanges[pendingAddIndex].id);
        return;
      }

      // Check if already pending removal
      if (
        state.pendingChanges.some(
          (c) =>
            c.type === "remove-user-group" &&
            (c as RemoveUserGroupChange).userGroupId === userGroupId,
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

      onAddChange(change);
    },
    [state.pendingChanges, onAddChange, onRemoveChange],
  );

  // Update user role with original role tracking
  const handleUpdateUserRole = useCallback(
    (
      userId: string,
      email: string,
      currentRole: RoleValue,
      newRole: RoleValue,
    ) => {
      if (currentRole === newRole) return;

      // Check if already pending
      const existingChangeIndex = state.pendingChanges.findIndex(
        (c) =>
          c.type === "update-user-role" &&
          (c as UpdateUserRoleChange).userId === userId,
      );

      // Get original role
      const originalUser = state.originalAccessData?.users.find(
        (u) => u.userId === userId,
      );
      const originalRole = originalUser?.role as RoleValue | undefined;

      // If reverting to original, remove pending change
      if (originalRole !== undefined && newRole === originalRole) {
        if (existingChangeIndex !== -1) {
          onRemoveChange(state.pendingChanges[existingChangeIndex].id);
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
        onUpdateChange(state.pendingChanges[existingChangeIndex].id, change);
      } else {
        onAddChange(change);
      }
    },
    [state, onAddChange, onRemoveChange, onUpdateChange],
  );

  // Update user group role with original role tracking
  const handleUpdateUserGroupRole = useCallback(
    (
      userGroupId: string,
      name: string,
      currentRole: RoleValue,
      newRole: RoleValue,
    ) => {
      if (currentRole === newRole) return;

      // Check if already pending
      const existingChangeIndex = state.pendingChanges.findIndex(
        (c) =>
          c.type === "update-user-group-role" &&
          (c as UpdateUserGroupRoleChange).userGroupId === userGroupId,
      );

      // Get original role
      const originalGroup = state.originalAccessData?.userGroups.find(
        (g) => g.id === userGroupId,
      );
      const originalRole = originalGroup?.role as RoleValue | undefined;

      // If reverting to original, remove pending change
      if (originalRole !== undefined && newRole === originalRole) {
        if (existingChangeIndex !== -1) {
          onRemoveChange(state.pendingChanges[existingChangeIndex].id);
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
        onUpdateChange(state.pendingChanges[existingChangeIndex].id, change);
      } else {
        onAddChange(change);
      }
    },
    [state, onAddChange, onRemoveChange, onUpdateChange],
  );

  return {
    handleAddUser,
    handleAddUserGroup,
    handleRemoveUser,
    handleRemoveUserGroup,
    handleUpdateUserRole,
    handleUpdateUserGroupRole,
  };
}
