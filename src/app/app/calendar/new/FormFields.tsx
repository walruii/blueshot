"use client";

import { FormState } from "@/hooks/useEventForm";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface FormFieldsProps {
  formState: FormState;
  setFormField: (field: keyof FormState, value: string | boolean) => void;
  errors?: Record<string, string | undefined>;
}

export const FormFields = ({
  formState,
  setFormField,
  errors = {},
}: FormFieldsProps) => {
  return (
    <>
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Event Title *</Label>
        <Input
          id="title"
          type="text"
          value={formState.title}
          onChange={(e) => setFormField("title", e.target.value)}
          placeholder="Enter event title"
          className={
            errors.title
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }
        />
        {errors.title && (
          <p className="text-destructive text-sm">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formState.description}
          onChange={(e) => setFormField("description", e.target.value)}
          placeholder="Enter event description"
          rows={4}
          className={
            errors.description
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }
        />
        {errors.description && (
          <p className="text-destructive text-sm">{errors.description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="allDay"
          checked={formState.allDay}
          onCheckedChange={(checked) => setFormField("allDay", !!checked)}
        />
        <Label htmlFor="allDay" className="cursor-pointer">
          All Day Event
        </Label>
      </div>

      {/* Date Range */}
      <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fromTime">From *</Label>
          <Input
            id="fromTime"
            type="datetime-local"
            value={formState.fromTime}
            onChange={(e) => setFormField("fromTime", e.target.value)}
            className={
              errors.fromTime
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }
          />
          {errors.fromTime && (
            <p className="text-destructive text-sm">{errors.fromTime}</p>
          )}
        </div>
        {!formState.allDay && (
          <div className="space-y-2">
            <Label htmlFor="toTime">To</Label>
            <Input
              id="toTime"
              type="datetime-local"
              value={formState.toTime}
              onChange={(e) => setFormField("toTime", e.target.value)}
            />
          </div>
        )}
      </div>
    </>
  );
};
