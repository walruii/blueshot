"use client";

import { Event } from "@/types/event";
import { CreateUserGroupModal } from "@/components/CreateUserGroupModal";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import EventGroupSection from "./EventGroupSection";
import DirectAccessManager from "./DirectAccessManager";
import UserGroupManager from "./UserGroupManager";
import { useEventEdit } from "../_hooks/useEventEdit";

interface EventEditModeProps {
  event: Event;
}

export default function EventEditMode({ event }: EventEditModeProps) {
  const {
    sessionUserId,
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
  } = useEventEdit(event);

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
          <EventGroupSection
            eventGroups={eventGroups}
            selectedEventGroupId={selectedEventGroupId}
            originalEventGroupId={event.eventGroupId}
            savingEventGroup={savingEventGroup}
            onSelect={setSelectedEventGroupId}
            onSave={handleEventGroupChange}
          />

          <div className="border-t pt-6 space-y-6">
            <DirectAccessManager
              accessData={accessData}
              loading={loadingAccess}
              onAddUser={handleAddUser}
              onRemoveUser={handleRemoveUser}
            />

            <UserGroupManager
              accessData={accessData}
              loading={loadingAccess}
              availableUserGroups={availableUserGroups}
              excludedUserGroupIds={excludedUserGroupIds}
              onAddUserGroup={handleAddUserGroup}
              onRemoveUserGroup={handleRemoveUserGroup}
              onCreateUserGroup={() => setIsCreateUserGroupModalOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Create User Group Modal */}
      {sessionUserId && (
        <CreateUserGroupModal
          isOpen={isCreateUserGroupModalOpen}
          onClose={() => setIsCreateUserGroupModalOpen(false)}
          onCreated={handleUserGroupCreated}
          userId={sessionUserId}
        />
      )}
    </div>
  );
}
