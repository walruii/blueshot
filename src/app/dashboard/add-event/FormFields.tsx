"use client";

import { FormState } from "@/hooks/useEventForm";

interface FormFieldsProps {
  formState: FormState;
  setFormField: (field: keyof FormState, value: string) => void;
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
      <div>
        <label className="text-white text-sm block mb-2 font-medium">
          Event Title *
        </label>
        <input
          type="text"
          value={formState.title}
          onChange={(e) => setFormField("title", e.target.value)}
          placeholder="Enter event title"
          className={`w-full px-4 py-2 rounded bg-zinc-800 text-white placeholder-zinc-500 outline-none focus:ring-2 ${
            errors.title
              ? "focus:ring-red-500 border border-red-500"
              : "focus:ring-blue-500"
          }`}
        />
        {errors.title && (
          <p className="text-red-400 text-sm mt-1">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="text-white text-sm block mb-2 font-medium">
          Description *
        </label>
        <textarea
          value={formState.description}
          onChange={(e) => setFormField("description", e.target.value)}
          placeholder="Enter event description"
          rows={4}
          className={`w-full px-4 py-2 rounded bg-zinc-800 text-white placeholder-zinc-500 outline-none focus:ring-2 resize-none ${
            errors.description
              ? "focus:ring-red-500 border border-red-500"
              : "focus:ring-blue-500"
          }`}
        />
        {errors.description && (
          <p className="text-red-400 text-sm mt-1">{errors.description}</p>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="text-white text-sm block mb-2 font-medium">
          Date *
        </label>
        <input
          type="date"
          value={formState.date}
          onChange={(e) => setFormField("date", e.target.value)}
          className={`w-full px-4 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 ${
            errors.date
              ? "focus:ring-red-500 border border-red-500"
              : "focus:ring-blue-500"
          }`}
        />
        {errors.date && (
          <p className="text-red-400 text-sm mt-1">{errors.date}</p>
        )}
      </div>

      {/* Time Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-white text-sm block mb-2 font-medium">
            From (Time) *
          </label>
          <input
            type="time"
            value={formState.fromTime}
            onChange={(e) => setFormField("fromTime", e.target.value)}
            className={`w-full px-4 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 ${
              errors.fromTime
                ? "focus:ring-red-500 border border-red-500"
                : "focus:ring-blue-500"
            }`}
          />
          {errors.fromTime && (
            <p className="text-red-400 text-sm mt-1">{errors.fromTime}</p>
          )}
        </div>
        <div>
          <label className="text-white text-sm block mb-2 font-medium">
            To (Time)
          </label>
          <input
            type="time"
            value={formState.toTime}
            onChange={(e) => setFormField("toTime", e.target.value)}
            className="w-full px-4 py-2 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </>
  );
};
