"use client";

import { useState, useEffect } from "react";
import { useAlert } from "@/app/(alert)/AlertProvider";
import { useRouter } from "next/navigation";
import { Event } from "@/types/event";
import { EventGroup } from "@/types/eventGroup";
import { UserGroup } from "@/types/userGroup";
import {
  getEventAccess,
  addAccessToEvent,
  removeAccessFromEvent,
  updateEventGroup,
  EventAccessResult,
} from "@/server-actions/event";
import { getAccessibleEventGroups } from "@/server-actions/eventGroup";
import { getAccessibleUserGroups } from "@/server-actions/userGroup";
import { checkEmailListExist } from "@/server-actions/addEvent";
import { Role } from "@/types/permission";
import EmailAddForm from "@/components/EmailAddForm";
import UserGroupDropdown from "@/components/UserGroupDropdown";
import MemberListItem from "@/components/MemberListItem";
import { CreateUserGroupModal } from "@/components/CreateUserGroupModal";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, X } from "lucide-react";

interface EventEditModeProps {
  event: Event;
}

export default function EventEditMode({ event }: EventEditModeProps) {
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

    setSavingEventGroup(true);
    const result = await updateEventGroup(event.id, selectedEventGroupId);

    if (result.success) {
      showAlert({
        title: "Event group updated",
        description: "The event group has been changed",
        type: "success",
      });
      router.refresh();
    } else {
      showAlert({
        title: "Failed to update event group",
        description: result.error || "",
        type: "error",
      });
      setSelectedEventGroupId(event.eventGroupId);
    }
    setSavingEventGroup(false);
  };

  const handleAddUser = async (
    email: string,
  ): Promise<{ success: boolean; error?: string }> => {
    // Check if already has access
    if (accessData?.users.some((u) => u.email.toLowerCase() === email)) {
      return { success: false, error: "This user already has direct access" };
    }

    try {
      const checkResult = await checkEmailListExist([email]);
      if (!checkResult?.success || !checkResult.data?.[0]?.exist) {
        return { success: false, error: "User not found with this email" };
      }

      const result = await addAccessToEvent(event.id, [
        { identifier: email, type: "email", role: Role.READ, name: email },
      ]);

      if (!result.success) {
        return { success: false, error: result.error || "Failed to add user" };
      }

      if (result.data?.added) {
        showAlert({
          title: "User added",
          description: `Added ${email} to the event`,
          type: "success",
        });
        await refreshAccess();
        return { success: true };
      } else {
        return { success: false, error: "Failed to add user" };
      }
    } catch {
      return { success: false, error: "Failed to add user" };
    }
  };

  const handleAddUserGroup = async (userGroup: {
    id: string;
    name: string;
  }) => {
    const result = await addAccessToEvent(event.id, [
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
        description: `Added "${userGroup.name}" to the event`,
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
    const result = await removeAccessFromEvent(event.id, userId, undefined);

    if (result.success) {
      showAlert({
        title: "User removed",
        description: `Removed ${email} from the event`,
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
    const result = await removeAccessFromEvent(
      event.id,
      undefined,
      userGroupId,
    );

    if (result.success) {
      showAlert({
        title: "User group removed",
        description: `Removed "${name}" from the event`,
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

  // IDs of user groups that already have access
  const excludedUserGroupIds = accessData?.userGroups.map((g) => g.id) || [];

  const handleUserGroupCreated = (newGroup: UserGroup) => {
    setAvailableUserGroups((prev) => [...prev, newGroup]);
    setIsCreateUserGroupModalOpen(false);
  };

  if (!isEditing) {
    return (
      <Button onClick={() => setIsEditing(true)} className="w-full mt-5">
        Edit Permissions
      </Button>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6 mt-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Edit Permissions</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(false)}
          className="h-8 w-8"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Event Group Selection */}
          <div className="space-y-2">
            <Label>Event Group</Label>
            <div className="flex gap-2">
              <Select
                value={selectedEventGroupId}
                onValueChange={setSelectedEventGroupId}
                disabled={savingEventGroup}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEventGroupId !== event.eventGroupId && (
                <Button
                  onClick={handleEventGroupChange}
                  disabled={savingEventGroup}
                  variant="secondary"
                >
                  {savingEventGroup ? "Saving..." : "Save"}
                </Button>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Changing the event group will update who can see this event
            </p>
          </div>

          {/* Direct Access Section */}
          <div className="border-t pt-6">
            <h3 className="mb-4 text-lg font-medium">
              Direct Access (in addition to event group)
            </h3>

            {/* Add User Form */}
            <div className="mb-4">
              <EmailAddForm
                onAdd={handleAddUser}
                label="Add User by Email"
                placeholder="Enter email address"
              />
            </div>

            {/* Add User Group */}
            <div className="mb-4">
              <UserGroupDropdown
                groups={availableUserGroups}
                excludedIds={excludedUserGroupIds}
                onSelect={handleAddUserGroup}
                label="Add User Group"
                onCreateUserGroup={() => setIsCreateUserGroupModalOpen(true)}
              />
            </div>

            {loadingAccess ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Users with Direct Access */}
                <div className="mb-4">
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                    Users ({accessData?.users.length || 0})
                  </h4>
                  {!accessData?.users.length ? (
                    <p className="text-sm text-muted-foreground">
                      No individual users have direct access
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

                {/* User Groups with Direct Access */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                    User Groups ({accessData?.userGroups.length || 0})
                  </h4>
                  {!accessData?.userGroups.length ? (
                    <p className="text-sm text-muted-foreground">
                      No user groups have direct access
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
    </div>
  );
}
