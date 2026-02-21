import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";

interface Member {
  userId: string;
  email: string;
  name: string;
}

interface GroupSettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  currentUserId: string;
  members: Member[];
  removedMemberIds: Set<string>;
  selectedNewOwnerId: string;
  onNewOwnerSelect: (id: string) => void;
  isTransferring: boolean;
  onTransferOwnership: () => void;
  isDeleteConfirmOpen: boolean;
  onDeleteConfirmOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  onDeleteGroup: () => void;
}

export function GroupSettingsModal({
  isOpen,
  onOpenChange,
  groupName,
  currentUserId,
  members,
  removedMemberIds,
  selectedNewOwnerId,
  onNewOwnerSelect,
  isTransferring,
  onTransferOwnership,
  isDeleteConfirmOpen,
  onDeleteConfirmOpenChange,
  isDeleting,
  onDeleteGroup,
}: GroupSettingsModalProps) {
  const availableMembers = members.filter(
    (m) => !removedMemberIds.has(m.userId) && m.userId !== currentUserId,
  );

  return (
    <>
      {/* Settings Modal */}
      <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Group Settings</AlertDialogTitle>
            <AlertDialogDescription>
              Manage advanced settings for this group.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {/* Transfer Ownership Section */}
            <div className="space-y-3 border-b pb-4">
              <h4 className="text-sm font-medium">Transfer Ownership</h4>
              <Select
                value={selectedNewOwnerId}
                onValueChange={onNewOwnerSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose new owner..." />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={onTransferOwnership}
                disabled={!selectedNewOwnerId || isTransferring}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {isTransferring ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Transfer Ownership
              </Button>
            </div>

            {/* Delete Group Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-destructive">
                Delete Group
              </h4>
              <p className="text-xs text-muted-foreground">
                Permanently delete this group and all its data. This action
                cannot be undone.
              </p>
              <Button
                onClick={() => onDeleteConfirmOpenChange(true)}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Group
              </Button>
            </div>
          </div>

          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={onDeleteConfirmOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{groupName}&quot;? This will
              permanently delete the group and all its data. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDeleteGroup}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Delete
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
