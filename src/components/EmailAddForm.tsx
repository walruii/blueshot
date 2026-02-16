"use client";

import { useState } from "react";
import LoadingCircle from "@/svgs/LoadingCircle";

interface EmailAddFormProps {
  onAdd: (email: string) => Promise<{ success: boolean; error?: string }>;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

export default function EmailAddForm({
  onAdd,
  placeholder = "Enter email address",
  disabled = false,
  label = "Add User by Email",
}: EmailAddFormProps) {
  const [emailInput, setEmailInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!emailInput.trim() || isValidating) return;

    const email = emailInput.trim().toLowerCase();
    setIsValidating(true);
    setEmailError(null);

    try {
      const result = await onAdd(email);
      if (result.success) {
        setEmailInput("");
      } else {
        setEmailError(result.error || "Failed to add user");
      }
    } catch {
      setEmailError("Failed to add user");
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => {
              setEmailInput(e.target.value);
              setEmailError(null);
            }}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            className="w-full rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={disabled || isValidating}
          />
          {isValidating && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <LoadingCircle />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || isValidating || !emailInput.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-600"
        >
          Add
        </button>
      </div>
      {emailError && <p className="mt-1 text-sm text-red-500">{emailError}</p>}
    </div>
  );
}
