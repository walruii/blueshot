"use client";

import CrossIcon from "@/svgs/CrossIcon";

interface MemberListItemProps {
  type: "user" | "userGroup";
  name: string;
  email?: string;
  onRemove: () => void;
  disabled?: boolean;
}

export default function MemberListItem({
  type,
  name,
  email,
  onRemove,
  disabled = false,
}: MemberListItemProps) {
  const isUser = type === "user";

  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
            isUser
              ? "bg-blue-900 text-blue-300"
              : "bg-purple-900 text-purple-300"
          }`}
        >
          {isUser ? "U" : "G"}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{name}</p>
          {email && isUser && <p className="text-xs text-zinc-400">{email}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        title={`Remove ${isUser ? "user" : "user group"}`}
      >
        <CrossIcon size={16} />
      </button>
    </div>
  );
}
