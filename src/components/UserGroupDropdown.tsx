"use client";

import { useState, useRef, useEffect } from "react";

interface UserGroupOption {
  id: string;
  name: string;
}

interface UserGroupDropdownProps {
  groups: UserGroupOption[];
  excludedIds?: string[];
  onSelect: (group: UserGroupOption) => void;
  placeholder?: string;
  label?: string;
}

export default function UserGroupDropdown({
  groups,
  excludedIds = [],
  onSelect,
  placeholder = "Search user groups...",
  label = "Add User Group",
}: UserGroupDropdownProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter groups by search and exclude already added
  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) &&
      !excludedIds.includes(g.id),
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (group: UserGroupOption) => {
    onSelect(group);
    setSearch("");
    setIsOpen(false);
  };

  return (
    <div className="relative mb-4" ref={containerRef}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-zinc-600 bg-zinc-700 shadow-lg">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => handleSelect(group)}
                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-zinc-600"
              >
                {group.name}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-zinc-400">
              No groups found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
