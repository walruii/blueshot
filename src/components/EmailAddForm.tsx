"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

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
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="email"
            value={emailInput}
            onChange={(e) => {
              setEmailInput(e.target.value);
              setEmailError(null);
            }}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isValidating}
          />
          {isValidating && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="size-4 animate-spin" />
            </div>
          )}
        </div>
        <Button
          type="button"
          onClick={handleAdd}
          disabled={disabled || isValidating || !emailInput.trim()}
        >
          Add
        </Button>
      </div>
      {emailError && <p className="text-sm text-destructive">{emailError}</p>}
    </div>
  );
}
