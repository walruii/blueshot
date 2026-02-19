"use client";

import { EventGroup } from "@/types/eventGroup";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EventGroupSectionProps = {
  eventGroups: EventGroup[];
  selectedEventGroupId: string;
  originalEventGroupId: string;
  savingEventGroup: boolean;
  onSelect: (value: string) => void;
  onSave: () => void;
};

export default function EventGroupSection({
  eventGroups,
  selectedEventGroupId,
  originalEventGroupId,
  savingEventGroup,
  onSelect,
  onSave,
}: EventGroupSectionProps) {
  return (
    <div className="space-y-2">
      <Label>Event Group</Label>
      <div className="flex gap-2">
        <Select
          value={selectedEventGroupId}
          onValueChange={onSelect}
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
        {selectedEventGroupId !== originalEventGroupId && (
          <Button
            onClick={onSave}
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
  );
}
