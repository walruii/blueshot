import { useState } from "react";
import { checkEmailListExist } from "@/server-actions/supa";

interface ValidationError {
  validEmails: string[];
  invalidEmails: string[];
}

export const useMemberManagement = () => {
  const [members, setMembers] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] =
    useState<ValidationError | null>(null);

  const addMembers = async (
    emailList: string[],
  ): Promise<ValidationError | null> => {
    if (emailList.length === 0) return null;

    setIsValidating(true);
    setValidationError(null);

    try {
      const res = await checkEmailListExist(emailList);

      if (!res?.success || !res.data) {
        return null;
      }

      const validEmailList: string[] = [];
      const invalidEmailList: string[] = [];

      res.data.forEach((e) => {
        if (e.exist) validEmailList.push(e.email);
        else invalidEmailList.push(e.email);
      });

      if (validEmailList.length > 0) {
        setMembers((prev) => [...prev, ...validEmailList]);
        setEmailInput("");
      }

      if (invalidEmailList.length > 0) {
        setValidationError({
          validEmails: validEmailList,
          invalidEmails: invalidEmailList,
        });
      }

      return {
        validEmails: validEmailList,
        invalidEmails: invalidEmailList,
      };
    } finally {
      setIsValidating(false);
    }
  };

  const removeMember = (email: string) => {
    setMembers((prev) => prev.filter((m) => m !== email));
  };

  const clearValidationError = () => {
    setValidationError(null);
  };

  return {
    members,
    emailInput,
    setEmailInput,
    addMembers,
    removeMember,
    isValidating,
    validationError,
    clearValidationError,
  };
};
