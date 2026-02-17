"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  onCreateUserGroup?: () => void;
}

export default function UserGroupDropdown({
  groups,
  excludedIds = [],
  onSelect,
  placeholder = "Search user groups...",
  label = "Add User Group",
  onCreateUserGroup,
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
    <div className="relative space-y-2" ref={containerRef}>
      {label && <Label>{label}</Label>}
      <Input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
      />
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-popover shadow-lg">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => handleSelect(group)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
              >
                {group.name}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No groups found
            </div>
          )}
          {onCreateUserGroup && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onCreateUserGroup();
              }}
              className="w-full border-t px-3 py-2 text-left text-sm font-medium text-primary hover:bg-accent"
            >
              + Create New User Group
            </button>
          )}
        </div>
      )}
    </div>
  );
}
