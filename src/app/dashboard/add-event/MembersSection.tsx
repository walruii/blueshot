"use client";

interface MembersSectionProps {
  members: string[];
  input: string;
  onInputChange: (value: string) => void;
  onAddMembers: () => void;
  onRemoveMember: (member: string) => void;
  isValidating: boolean;
  type: string;
}

export const MembersSection = ({
  members,
  input,
  onInputChange,
  onAddMembers,
  onRemoveMember,
  isValidating,
  type,
}: MembersSectionProps) => {
  return (
    <div>
      <label className="text-white text-sm block mb-2 font-medium">
        Add {type}
      </label>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={`Enter ${type} separated by commas (e.g., user1@example.com, user2@example.com)`}
          className="flex-1 px-4 py-2 rounded bg-zinc-800 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={onAddMembers}
          disabled={isValidating || !input.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          {isValidating ? "Checking..." : "Add"}
        </button>
      </div>

      {/* Members List */}
      <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
        <p className="text-zinc-400 text-sm mb-3">
          {type} ({members.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <div
              key={member}
              className="bg-zinc-700 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              <span>{member}</span>
              <button
                type="button"
                onClick={() => onRemoveMember(member)}
                className="hover:text-red-400 transition"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
