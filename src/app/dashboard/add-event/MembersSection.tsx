"use client";

interface MembersSectionProps {
  members: string[];
  sessionEmail: string | undefined;
  emailInput: string;
  onEmailInputChange: (value: string) => void;
  onAddMembers: () => void;
  onRemoveMember: (email: string) => void;
  isValidating: boolean;
}

export const MembersSection = ({
  members,
  sessionEmail,
  emailInput,
  onEmailInputChange,
  onAddMembers,
  onRemoveMember,
  isValidating,
}: MembersSectionProps) => {
  return (
    <div>
      <label className="text-white text-sm block mb-2 font-medium">
        Add Members
      </label>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={emailInput}
          onChange={(e) => onEmailInputChange(e.target.value)}
          placeholder="Enter emails separated by commas (e.g., user1@example.com, user2@example.com)"
          className="flex-1 px-4 py-2 rounded bg-zinc-800 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={onAddMembers}
          disabled={isValidating || !emailInput.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          {isValidating ? "Checking..." : "Add"}
        </button>
      </div>

      {/* Members List */}
      <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
        <p className="text-zinc-400 text-sm mb-3">
          Members ({members.length + 1})
        </p>
        <div className="flex flex-wrap gap-2">
          <div className="bg-zinc-700 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            <span className="text-xs text-blue-400">(You)</span>
          </div>
          {members.map((email) => (
            <div
              key={email}
              className="bg-zinc-700 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              <span>{email}</span>
              {email !== sessionEmail && (
                <button
                  type="button"
                  onClick={() => onRemoveMember(email)}
                  className="hover:text-red-400 transition"
                >
                  ×
                </button>
              )}
              {email === sessionEmail && (
                <span className="text-xs text-blue-400">(You)</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
