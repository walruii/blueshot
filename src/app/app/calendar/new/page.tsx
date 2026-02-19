"use client";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { formatLocalDateTime, parseLocalDateInput } from "@/utils/dateUtil";
import { useAlert } from "@/components/AlertProvider";
import { useEventForm } from "@/hooks/useEventForm";
import { usePermissionManager } from "@/hooks/usePermissionManager";
import { PermissionManager } from "@/components/PermissionManager";
import { CreateEventGroupModal } from "@/components/CreateEventGroupModal";
import { CreateUserGroupModal } from "@/components/CreateUserGroupModal";
import { EventInput } from "@/types/event";
import { addEvent } from "@/server-actions/addEvent";
import {
  getWritableEventGroups,
  getOrCreatePersonalGroup,
} from "@/server-actions/eventGroup";
import { getAccessibleUserGroups } from "@/server-actions/userGroup";
import { EventGroup } from "@/types/eventGroup";
import { UserGroup } from "@/types/userGroup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { MESSAGES } from "./consts/messages";
import { FormFields } from "./_components/FormFields";
import EventGroupField from "./_components/EventGroupField";

function AddEvent() {
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
  } = usePermissionManager({
    initialPermissions: [],
    excludedEmails: session?.user?.email ? [session.user.email] : [],
  });

  // Load event groups and user groups on mount
  useEffect(() => {
    const loadGroups = async () => {
      if (!session?.user?.id) return;

      setIsLoadingGroups(true);
      try {
        // Ensure user has a personal group
        await getOrCreatePersonalGroup();

        // Load event groups (only those with write access)
        const eventGroupsResult = await getWritableEventGroups();
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
      router.push(`/app/event/${response.data.id}`);
    } catch (err) {
      console.error("Error adding event:", err);
      showAlert(MESSAGES.ALERT.EVENT_ADD_ERROR);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Go Back and Add buttons */}
        <div className="flex justify-between items-center mb-8">
          <Button onClick={() => router.back()} variant="secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={handleAddEvent} disabled={!isFormValid || isLoading}>
            {isLoading ? "Adding Event..." : "Add Event"}
          </Button>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Create Event</CardTitle>
          </CardHeader>
          <CardContent>
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

              <div className="flex items-center gap-3">
                <Checkbox
                  id="perEventMembers"
                  checked={formState.perEventMembers}
                  onCheckedChange={() =>
                    setFormField("perEventMembers", !formState.perEventMembers)
                  }
                />
                <Label htmlFor="perEventMembers">
                  Add Per Event Members and Groups
                </Label>
              </div>

              {formState.perEventMembers && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h3 className="text-sm font-medium mb-4">
                    Event Permissions
                  </h3>
                  <p className="text-muted-foreground text-xs mb-4">
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
                    onCreateUserGroup={() =>
                      setIsCreateUserGroupModalOpen(true)
                    }
                  />
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Create Event Group Modal */}
      {session?.user?.id && (
        <CreateEventGroupModal
          isOpen={isCreateEventGroupModalOpen}
          onClose={() => setIsCreateEventGroupModalOpen(false)}
          onCreated={handleEventGroupCreated}
          userId={session.user.id}
          userEmail={session.user.email}
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

export default function Page() {
  return (
    <Suspense>
      <AddEvent />
    </Suspense>
  );
}
