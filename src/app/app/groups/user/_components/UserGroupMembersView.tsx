import { MembersListSection } from "../../_components/MembersListSection";

interface Member {
  userId: string;
  email: string;
  name: string;
}

interface UserGroupMembersViewProps {
  members: Member[];
  removedIds: Set<string>;
  addedIds: Set<string>;
  loading: boolean;
  onRemove: (member: Member) => void;
}

export function UserGroupMembersView({
  members,
  removedIds,
  addedIds,
  loading,
  onRemove,
}: UserGroupMembersViewProps) {
  return (
    <MembersListSection
      title="Members"
      members={members}
      removedIds={removedIds}
      addedIds={addedIds}
      loading={loading}
      emptyMessage="No members in this group"
      onRemove={onRemove}
    />
  );
}
