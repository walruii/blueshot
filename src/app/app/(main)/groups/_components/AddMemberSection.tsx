import EmailAddForm from "@/components/EmailAddForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Role, RoleValue } from "@/types/permission";

interface AddMemberSectionProps {
  label?: string;
  onAdd: (email: string) => Promise<{ success: boolean; error?: string }>;
  showRoleSelect?: boolean;
  defaultRole?: RoleValue;
  onRoleChange?: (role: RoleValue) => void;
}

export function AddMemberSection({
  label = "Add Member by Email",
  onAdd,
  showRoleSelect = false,
  defaultRole = Role.READ,
  onRoleChange,
}: AddMemberSectionProps) {
  return (
    <div className="space-y-4">
      <EmailAddForm onAdd={onAdd} label={label} />

      {showRoleSelect && (
        <div className="space-y-2">
          <Label htmlFor="role-select">Default Role</Label>
          <Select
            value={String(defaultRole)}
            onValueChange={(value) =>
              onRoleChange?.(Number(value) as RoleValue)
            }
          >
            <SelectTrigger id="role-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={String(Role.READ)}>Read</SelectItem>
              <SelectItem value={String(Role.READ_WRITE)}>
                Read/Write
              </SelectItem>
              <SelectItem value={String(Role.ADMIN)}>Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
