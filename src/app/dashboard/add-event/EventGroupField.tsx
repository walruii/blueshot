import { EventGroup } from "@/types/eventGroup";

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
    <div className="sm:col-span-2">
      <label className="text-white text-sm mb-2 font-medium block">
        Event Group
      </label>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? (
            <option value="">Loading groups...</option>
          ) : groups.length === 0 ? (
            <option value="">No groups available</option>
          ) : (
            <>
              <option value="">Select a group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </>
          )}
        </select>
        <button
          type="button"
          onClick={onCreateNew}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 whitespace-nowrap"
        >
          + Add Group
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
}
