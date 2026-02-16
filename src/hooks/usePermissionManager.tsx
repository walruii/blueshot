import { useState, useCallback } from "react";
import { PermissionEntry, Role, RoleValue } from "@/types/permission";
import { checkEmailListExist } from "@/server-actions/addEvent";

interface UsePermissionManagerOptions {
  initialPermissions?: PermissionEntry[];
  excludedEmails?: string[]; // Emails that cannot be added (e.g., creator's email)
}

interface UsePermissionManagerReturn {
  permissions: PermissionEntry[];
  setPermissions: React.Dispatch<React.SetStateAction<PermissionEntry[]>>;
  emailInput: string;
  setEmailInput: (value: string) => void;
  isValidating: boolean;
  validationError: string | null;
  addMemberByEmail: (email: string) => Promise<boolean>;
  addMembersByEmailList: (
    emails: string[],
  ) => Promise<{ valid: string[]; invalid: string[] }>;
  addUserGroup: (groupId: string, groupName: string) => void;
  updateRole: (identifier: string, newRole: RoleValue) => void;
  removeEntry: (identifier: string) => void;
  clearValidationError: () => void;
  hasEntry: (identifier: string) => boolean;
}

export const usePermissionManager = (
  optionsOrInitialPermissions:
    | UsePermissionManagerOptions
    | PermissionEntry[] = [],
): UsePermissionManagerReturn => {
  // Support both old signature (array) and new signature (options object)
  const options: UsePermissionManagerOptions = Array.isArray(
    optionsOrInitialPermissions,
  )
    ? { initialPermissions: optionsOrInitialPermissions }
    : optionsOrInitialPermissions;

  const { initialPermissions = [], excludedEmails = [] } = options;
  const excludedEmailsSet = new Set(excludedEmails.map((e) => e.toLowerCase()));

  const [permissions, setPermissions] =
    useState<PermissionEntry[]>(initialPermissions);
  const [emailInput, setEmailInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const hasEntry = useCallback(
    (identifier: string): boolean => {
      return permissions.some((p) => p.identifier === identifier);
    },
    [permissions],
  );

  const isExcludedEmail = useCallback(
    (email: string): boolean => {
      return excludedEmailsSet.has(email.toLowerCase());
    },
    [excludedEmailsSet],
  );

  const addMemberByEmail = useCallback(
    async (email: string): Promise<boolean> => {
      const trimmedEmail = email.trim().toLowerCase();

      if (!trimmedEmail) {
        setValidationError("Email is required");
        return false;
      }

      if (isExcludedEmail(trimmedEmail)) {
        setValidationError("Cannot add yourself or the event creator");
        return false;
      }

      if (hasEntry(trimmedEmail)) {
        setValidationError("This email is already added");
        return false;
      }

      setIsValidating(true);
      setValidationError(null);

      try {
        const result = await checkEmailListExist([trimmedEmail]);

        if (!result?.success || !result.data) {
          setValidationError("Failed to validate email");
          return false;
        }

        const emailResult = result.data[0];
        if (!emailResult.exist) {
          setValidationError("User not found with this email");
          return false;
        }

        setPermissions((prev) => [
          ...prev,
          {
            identifier: trimmedEmail,
            type: "email",
            role: Role.READ,
            name: trimmedEmail,
          },
        ]);

        setEmailInput("");
        return true;
      } catch {
        setValidationError("Failed to validate email");
        return false;
      } finally {
        setIsValidating(false);
      }
    },
    [hasEntry, isExcludedEmail],
  );

  const addMembersByEmailList = useCallback(
    async (
      emails: string[],
    ): Promise<{ valid: string[]; invalid: string[] }> => {
      const uniqueEmails = [
        ...new Set(emails.map((e) => e.trim().toLowerCase())),
      ];
      // Filter out already added emails and excluded emails (like creator's email)
      const newEmails = uniqueEmails.filter(
        (e) => e && !hasEntry(e) && !isExcludedEmail(e),
      );

      if (newEmails.length === 0) {
        return { valid: [], invalid: [] };
      }

      setIsValidating(true);
      setValidationError(null);

      try {
        const result = await checkEmailListExist(newEmails);

        if (!result?.success || !result.data) {
          setValidationError("Failed to validate emails");
          return { valid: [], invalid: newEmails };
        }

        const valid: string[] = [];
        const invalid: string[] = [];

        result.data.forEach((e) => {
          if (e.exist) {
            valid.push(e.email);
          } else {
            invalid.push(e.email);
          }
        });

        if (valid.length > 0) {
          setPermissions((prev) => [
            ...prev,
            ...valid.map((email) => ({
              identifier: email,
              type: "email" as const,
              role: Role.READ,
              name: email,
            })),
          ]);
        }

        if (invalid.length > 0) {
          setValidationError(`Users not found: ${invalid.join(", ")}`);
        }

        return { valid, invalid };
      } catch {
        setValidationError("Failed to validate emails");
        return { valid: [], invalid: newEmails };
      } finally {
        setIsValidating(false);
      }
    },
    [hasEntry, isExcludedEmail],
  );

  const addUserGroup = useCallback(
    (groupId: string, groupName: string) => {
      if (hasEntry(groupId)) {
        setValidationError("This group is already added");
        return;
      }

      setPermissions((prev) => [
        ...prev,
        {
          identifier: groupId,
          type: "userGroup",
          role: Role.READ,
          name: groupName,
        },
      ]);
      setValidationError(null);
    },
    [hasEntry],
  );

  const updateRole = useCallback((identifier: string, newRole: RoleValue) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.identifier === identifier ? { ...p, role: newRole } : p,
      ),
    );
  }, []);

  const removeEntry = useCallback((identifier: string) => {
    setPermissions((prev) => prev.filter((p) => p.identifier !== identifier));
  }, []);

  const clearValidationError = useCallback(() => {
    setValidationError(null);
  }, []);

  return {
    permissions,
    setPermissions,
    emailInput,
    setEmailInput,
    isValidating,
    validationError,
    addMemberByEmail,
    addMembersByEmailList,
    addUserGroup,
    updateRole,
    removeEntry,
    clearValidationError,
    hasEntry,
  };
};
