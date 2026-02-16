"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { formatLocalDateTime, parseLocalDateInput } from "@/utils/dateUtil";
import { useAlert } from "@/app/(alert)/AlertProvider";
import { useEventForm } from "@/hooks/useEventForm";
import { usePermissionManager } from "@/hooks/usePermissionManager";
import { FormFields } from "./FormFields";
import EventGroupField from "./EventGroupField";
import { PermissionManager } from "@/components/PermissionManager";
import { CreateEventGroupModal } from "@/components/CreateEventGroupModal";
import { CreateUserGroupModal } from "@/components/CreateUserGroupModal";
import { MESSAGES } from "./messages";
import { EventInput } from "@/types/event";
import { addEvent } from "@/server-actions/addEvent";
import {
  getAccessibleEventGroups,
  getOrCreatePersonalGroup,
} from "@/server-actions/eventGroup";
import { getAccessibleUserGroups } from "@/server-actions/userGroup";
import { EventGroup } from "@/types/eventGroup";
import { UserGroup } from "@/types/userGroup";

export default function AddEvent() {
  const params = useSearchParams();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { showAlert } = useAlert();

  // Event groups state
  const [eventGroups, setEventGroups] = useState<EventGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);

  // User groups state (for permission manager)
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);

  // Modal states
  const [isCreateEventGroupModalOpen, setIsCreateEventGroupModalOpen] =
    useState(false);
  const [isCreateUserGroupModalOpen, setIsCreateUserGroupModalOpen] =
    useState(false);

  const prefillDate = params.get("prefillDate");
  const prefillDateTime = prefillDate
    ? prefillDate + "T00:00"
    : formatLocalDateTime(new Date());

  const {
    formState,
    setFormState,
    setFormField,
    validateForm,
    errors,
    setErrors,
    isLoading,
    setIsLoading,
    isFormValid,
  } = useEventForm(prefillDateTime);

  const {
    permissions,
    isValidating,
    validationError,
    addMemberByEmail,
    addUserGroup,
    updateRole,
    removeEntry,
    clearValidationError,
  } = usePermissionManager([]);

  // Load event groups and user groups on mount
  useEffect(() => {
    const loadGroups = async () => {
      if (!session?.user?.id) return;

      setIsLoadingGroups(true);
      try {
        // Ensure user has a personal group
        await getOrCreatePersonalGroup();

        // Load event groups
        const eventGroupsResult = await getAccessibleEventGroups();
        if (eventGroupsResult.success && eventGroupsResult.data) {
          const groups = eventGroupsResult.data;
          setEventGroups(groups);
          // Auto-select Personal group if available and no selection
          setFormState((prev) => {
            if (!prev.eventGroupId) {
              const personalGroup = groups.find((g) => g.name === "Personal");
              if (personalGroup) {
                return { ...prev, eventGroupId: personalGroup.id };
              }
            }
            return prev;
          });
        }

        // Load user groups for permission manager
        const userGroupsResult = await getAccessibleUserGroups();
        if (userGroupsResult.success && userGroupsResult.data) {
          setUserGroups(userGroupsResult.data);
        }
      } catch (err) {
        console.error("Error loading groups:", err);
      } finally {
        setIsLoadingGroups(false);
      }
    };

    loadGroups();
  }, [session?.user?.id, setFormState]);

  // Handle new event group created
  const handleEventGroupCreated = (newGroup: EventGroup) => {
    setEventGroups((prev) => [...prev, newGroup]);
    setFormField("eventGroupId", newGroup.id);
    setIsCreateEventGroupModalOpen(false);
  };

  // Handle new user group created
  const handleUserGroupCreated = (newGroup: UserGroup) => {
    setUserGroups((prev) => [...prev, newGroup]);
    setIsCreateUserGroupModalOpen(false);
  };

  const handleAddEvent = async (
    e: React.SubmitEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();

    if (!session?.user?.email || !session?.user?.id) {
      showAlert(MESSAGES.ALERT.INVALID_SESSION);
      return;
    }

    if (!formState.eventGroupId) {
      setErrors((prev) => ({
        ...prev,
        eventGroupId: "Please select an event group",
      }));
      return;
    }

    if (!validateForm(permissions)) {
      return;
    }

    setIsLoading(true);

    try {
      const from = parseLocalDateInput(formState.fromTime);
      const to = formState.allDay
        ? null
        : formState.toTime
          ? parseLocalDateInput(formState.toTime)
          : null;

      if (to && !formState.allDay && from >= to) {
        showAlert({
          title: '"to" time can not be before "from" time',
          type: "warning",
        });
        setIsLoading(false);
        return;
      }

      if (new Date() >= from) {
        showAlert({
          title: "Can not add Event in the past",
          type: "warning",
          description: "",
        });
        setIsLoading(false);
        return;
      }

      const sendEvent: EventInput = {
        title: formState.title,
        description: formState.description,
        from,
        to,
        type: formState.allDay ? "allday" : "default",
        createdBy: session.user.id,
        eventGroupId: formState.eventGroupId,
        permissions: formState.perEventMembers ? permissions : [],
      };

      const response = await addEvent(sendEvent);

      if (!response.success || !response.data) {
        showAlert(MESSAGES.ALERT.EVENT_ADD_ERROR);
        setIsLoading(false);
        return;
      }

      showAlert(MESSAGES.ALERT.EVENT_ADD_SUCCESS);
      router.push(`/dashboard/events/${response.data.id}`);
    } catch (err) {
      console.error("Error adding event:", err);
      showAlert(MESSAGES.ALERT.EVENT_ADD_ERROR);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Go Back and Add buttons */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.back()}
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            ← Go Back
          </button>
          <button
            onClick={handleAddEvent}
            disabled={!isFormValid || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white disabled:text-zinc-300 font-semibold py-2 px-6 rounded-lg transition"
          >
            {isLoading ? "Adding Event..." : "Add Event"}
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800">
          <h1 className="text-3xl font-bold text-white mb-6">Create Event</h1>

          <form onSubmit={handleAddEvent} className="flex flex-col gap-6">
            <FormFields
              formState={formState}
              setFormField={setFormField}
              errors={errors}
            />

            {/* Event Group Selection */}
            <EventGroupField
              value={formState.eventGroupId}
              onChange={(value) => setFormField("eventGroupId", value)}
              groups={eventGroups}
              onCreateNew={() => setIsCreateEventGroupModalOpen(true)}
              isLoading={isLoadingGroups}
              error={errors.eventGroupId}
            />

            <div className="flex justify-start items-center gap-3">
              <label className="text-white text-sm font-medium">
                Add Per Event Members and Groups
              </label>
              <input
                type="checkbox"
                checked={formState.perEventMembers}
                onChange={() =>
                  setFormField("perEventMembers", !formState.perEventMembers)
                }
                className="px-4 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {formState.perEventMembers && (
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                <h3 className="text-white text-sm font-medium mb-4">
                  Event Permissions
                </h3>
                <p className="text-zinc-400 text-xs mb-4">
                  Add users or groups to give them access to this specific
                  event. If a user is added both individually and via a group,
                  the higher permission takes precedence.
                </p>
                <PermissionManager
                  permissions={permissions}
                  onAddEmail={addMemberByEmail}
                  onAddUserGroup={addUserGroup}
                  onUpdateRole={updateRole}
                  onRemoveEntry={removeEntry}
                  isValidating={isValidating}
                  validationError={validationError}
                  onClearError={clearValidationError}
                  availableUserGroups={userGroups}
                  allowUserGroups={true}
                  onCreateUserGroup={() => setIsCreateUserGroupModalOpen(true)}
                />
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Create Event Group Modal */}
      {session?.user?.id && (
        <CreateEventGroupModal
          isOpen={isCreateEventGroupModalOpen}
          onClose={() => setIsCreateEventGroupModalOpen(false)}
          onCreated={handleEventGroupCreated}
          userId={session.user.id}
          availableUserGroups={userGroups}
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
    </div>
  );
}
