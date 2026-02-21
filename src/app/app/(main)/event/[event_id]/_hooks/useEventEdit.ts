"use client";

import { useEffect, useState } from "react";
import { useAlert } from "@/components/AlertProvider";
import { useRouter } from "next/navigation";
import { Event } from "@/types/event";
import { EventGroup } from "@/types/eventGroup";
import { UserGroup } from "@/types/userGroup";
import {
  addAccessToEvent,
  EventAccessResult,
  getEventAccess,
  removeAccessFromEvent,
  updateEventGroup,
} from "@/server-actions/event";
import { getAccessibleEventGroups } from "@/server-actions/eventGroup";
import { getAccessibleUserGroups } from "@/server-actions/userGroup";
import { checkEmailListExist } from "@/server-actions/addEvent";
import { Role } from "@/types/permission";
import { authClient } from "@/lib/auth-client";

type ActionResult<T> = { success: boolean; error?: string; data?: T };

type RunActionOptions<T> = {
  action: () => Promise<ActionResult<T>>;
  setLoading?: (value: boolean) => void;
  successAlert?: { title: string; description: string };
  errorAlert?: { title: string; description?: string };
  onSuccess?: (result: ActionResult<T>) => Promise<void> | void;
  showErrorAlert?: boolean;
  showSuccessAlert?: boolean;
};

export const useEventEdit = (event: Event) => {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCreateUserGroupModalOpen, setIsCreateUserGroupModalOpen] =
    useState(false);

  // Event group state
  const [eventGroups, setEventGroups] = useState<EventGroup[]>([]);
  const [selectedEventGroupId, setSelectedEventGroupId] = useState(
    event.eventGroupId,
  );
  const [savingEventGroup, setSavingEventGroup] = useState(false);

  // Access state
  const [accessData, setAccessData] = useState<EventAccessResult | null>(null);
  const [loadingAccess, setLoadingAccess] = useState(false);

  // Available user groups
  const [availableUserGroups, setAvailableUserGroups] = useState<UserGroup[]>(
    [],
  );

  useEffect(() => {
    setSelectedEventGroupId(event.eventGroupId);
  }, [event.eventGroupId]);

  const runAction = async <T>({
    action,
    setLoading: setIsLoading,
    successAlert,
    errorAlert,
    onSuccess,
    showErrorAlert = true,
    showSuccessAlert = true,
  }: RunActionOptions<T>) => {
    if (setIsLoading) setIsLoading(true);
    const result = await action();

    if (result.success) {
      if (showSuccessAlert && successAlert) {
        showAlert({
          title: successAlert.title,
          description: successAlert.description,
          type: "success",
        });
      }
      if (onSuccess) {
        await onSuccess(result);
      }
    } else if (showErrorAlert && errorAlert) {
      showAlert({
        title: errorAlert.title,
        description: result.error || errorAlert.description || "",
        type: "error",
      });
    }

    if (setIsLoading) setIsLoading(false);
    return result;
  };

  // Load data when editing is toggled on
  useEffect(() => {
    if (!isEditing) return;

    async function loadData() {
      setLoading(true);
      const [groupsResult, userGroupsResult] = await Promise.all([
        getAccessibleEventGroups(),
        getAccessibleUserGroups(),
      ]);

      if (groupsResult.success && groupsResult.data) {
        setEventGroups(groupsResult.data);
      }
      if (userGroupsResult.success && userGroupsResult.data) {
        setAvailableUserGroups(userGroupsResult.data);
      }
      setLoading(false);
    }
    loadData();
  }, [isEditing]);

  // Load access data
  useEffect(() => {
    if (!isEditing) return;

    async function loadAccess() {
      setLoadingAccess(true);
      const result = await getEventAccess(event.id);
      if (result.success && result.data) {
        setAccessData(result.data);
      }
      setLoadingAccess(false);
    }
    loadAccess();
  }, [isEditing, event.id]);

  const refreshAccess = async () => {
    const result = await getEventAccess(event.id);
    if (result.success && result.data) {
      setAccessData(result.data);
    }
  };

  const handleEventGroupChange = async () => {
    if (selectedEventGroupId === event.eventGroupId) return;

    const result = await runAction({
      action: () => updateEventGroup(event.id, selectedEventGroupId),
      setLoading: setSavingEventGroup,
      successAlert: {
        title: "Event group updated",
        description: "The event group has been changed",
      },
      errorAlert: {
        title: "Failed to update event group",
      },
      onSuccess: () => {
        router.refresh();
      },
    });

    if (!result.success) {
      setSelectedEventGroupId(event.eventGroupId);
    }
  };

  const handleAddUser = async (
    email: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (accessData?.users.some((u) => u.email.toLowerCase() === email)) {
      return { success: false, error: "This user already has direct access" };
    }

    try {
      const checkResult = await checkEmailListExist([email]);
      if (!checkResult?.success || !checkResult.data?.[0]?.exist) {
        return { success: false, error: "User not found with this email" };
      }

      const result = await runAction({
        action: async () => {
          const addResult = await addAccessToEvent(event.id, [
            { identifier: email, type: "email", role: Role.READ, name: email },
          ]);

          if (addResult.success && !addResult.data?.added) {
            return { success: false, error: "Failed to add user" };
          }

          return addResult;
        },
        successAlert: {
          title: "User added",
          description: `Added ${email} to the event`,
        },
        errorAlert: {
          title: "Failed to add user",
        },
        onSuccess: refreshAccess,
        showErrorAlert: false,
      });

      if (!result.success) {
        return { success: false, error: result.error || "Failed to add user" };
      }

      return { success: true };
    } catch {
      return { success: false, error: "Failed to add user" };
    }
  };

  const handleAddUserGroup = async (userGroup: {
    id: string;
    name: string;
  }) => {
    await runAction({
      action: () =>
        addAccessToEvent(event.id, [
          {
            identifier: userGroup.id,
            type: "userGroup",
            role: Role.READ,
            name: userGroup.name,
          },
        ]),
      successAlert: {
        title: "User group added",
        description: `Added "${userGroup.name}" to the event`,
      },
      errorAlert: {
        title: "Failed to add user group",
      },
      onSuccess: refreshAccess,
    });
  };

  const handleRemoveUser = async (userId: string, email: string) => {
    await runAction({
      action: () => removeAccessFromEvent(event.id, userId, undefined),
      successAlert: {
        title: "User removed",
        description: `Removed ${email} from the event`,
      },
      errorAlert: {
        title: "Failed to remove user",
      },
      onSuccess: refreshAccess,
    });
  };

  const handleRemoveUserGroup = async (userGroupId: string, name: string) => {
    await runAction({
      action: () => removeAccessFromEvent(event.id, undefined, userGroupId),
      successAlert: {
        title: "User group removed",
        description: `Removed "${name}" from the event`,
      },
      errorAlert: {
        title: "Failed to remove user group",
      },
      onSuccess: refreshAccess,
    });
  };

  const excludedUserGroupIds = accessData?.userGroups.map((g) => g.id) || [];

  const handleUserGroupCreated = (newGroup: UserGroup) => {
    setAvailableUserGroups((prev) => [...prev, newGroup]);
    setIsCreateUserGroupModalOpen(false);
  };

  return {
    sessionUserId: session?.user?.id,
    isEditing,
    setIsEditing,
    loading,
    eventGroups,
    selectedEventGroupId,
    setSelectedEventGroupId,
    savingEventGroup,
    handleEventGroupChange,
    accessData,
    loadingAccess,
    handleAddUser,
    handleAddUserGroup,
    handleRemoveUser,
    handleRemoveUserGroup,
    availableUserGroups,
    excludedUserGroupIds,
    isCreateUserGroupModalOpen,
    setIsCreateUserGroupModalOpen,
    handleUserGroupCreated,
  };
};
