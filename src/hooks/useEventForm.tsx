import { useState } from "react";
import { eventFormSchema } from "@/lib/zod";
import { ZodError, ZodIssue } from "zod";
import { PermissionEntry } from "@/types/permission";

export interface FormState {
  title: string;
  description: string;
  fromTime: string;
  toTime: string;
  allDay: boolean;
  eventGroupId: string;
  perEventMembers: boolean;
}

interface FormErrors extends Record<string, string | undefined> {
  title?: string;
  description?: string;
  fromTime?: string;
  toTime?: string;
  eventGroupId?: string;
}

export const useEventForm = (prefillDateTime: string) => {
  const [formState, setFormState] = useState<FormState>({
    title: "",
    description: "",
    fromTime: prefillDateTime,
    toTime: prefillDateTime,
    allDay: false,
    eventGroupId: "",
    perEventMembers: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const setFormField = (field: keyof FormState, value: string | boolean) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = (permissions: PermissionEntry[] = []): boolean => {
    try {
      eventFormSchema.parse({
        title: formState.title,
        description: formState.description,
        fromTime: formState.fromTime,
        toTime: formState.toTime,
        eventGroupId: formState.eventGroupId,
        permissions,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const formErrors: FormErrors = {};
        error.issues.forEach((issue: ZodIssue) => {
          const path = issue.path[0] as keyof FormState;
          formErrors[path] = issue.message;
        });
        setErrors(formErrors);
      }
      return false;
    }
  };

  const isFormValid =
    formState.title.trim() !== "" &&
    formState.description.trim() !== "" &&
    formState.fromTime !== "" &&
    formState.eventGroupId !== "";

  return {
    formState,
    setFormState,
    setFormField,
    validateForm,
    errors,
    setErrors,
    isLoading,
    setIsLoading,
    isFormValid,
  };
};
