import { EventGroup } from "@/types/eventGroup";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

interface EventGroupFieldProps {
  value: string;
  onChange: (value: string) => void;
  groups: EventGroup[];
  onCreateNew: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function EventGroupField({
  value,
  onChange,
  groups,
  onCreateNew,
  isLoading = false,
  error,
}: EventGroupFieldProps) {
  return (
    <div className="sm:col-span-2 space-y-2">
      <Label>Event Group</Label>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onChange} disabled={isLoading}>
          <SelectTrigger className="flex-1">
            <SelectValue
              placeholder={
                isLoading
                  ? "Loading groups..."
                  : groups.length === 0
                    ? "No groups available"
                    : "Select a group"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" onClick={onCreateNew} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Group
        </Button>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
