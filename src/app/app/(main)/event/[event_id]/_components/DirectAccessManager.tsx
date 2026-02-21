"use client";

import { Loader2 } from "lucide-react";
import EmailAddForm from "@/components/EmailAddForm";
import MemberListItem from "@/components/MemberListItem";
import { EventAccessResult } from "@/server-actions/event";

type DirectAccessManagerProps = {
  accessData: EventAccessResult | null;
  loading: boolean;
  onAddUser: (email: string) => Promise<{ success: boolean; error?: string }>;
  onRemoveUser: (userId: string, email: string) => void;
};

export default function DirectAccessManager({
  accessData,
  loading,
  onAddUser,
  onRemoveUser,
}: DirectAccessManagerProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Direct User Access</h3>
        <p className="text-sm text-muted-foreground">
          Add individual users in addition to the event group
        </p>
      </div>

      <EmailAddForm
        onAdd={onAddUser}
        label="Add User by Email"
        placeholder="Enter email address"
      />

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div>
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
                  onRemove={() => onRemoveUser(user.userId, user.email)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
