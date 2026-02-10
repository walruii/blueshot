import { useState } from "react";
import { eventFormSchema } from "@/lib/zod";
import { ZodError, ZodIssue } from "zod";

export interface FormState {
  title: string;
  description: string;
  date: string;
  fromTime: string;
  toTime: string;
}

interface FormErrors extends Record<string, string | undefined> {
  title?: string;
  description?: string;
  date?: string;
  fromTime?: string;
  toTime?: string;
}

export const useEventForm = (prefillDate: string) => {
  const [formState, setFormState] = useState<FormState>({
    title: "",
    description: "",
    date: prefillDate,
    fromTime: "",
    toTime: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const setFormField = (field: keyof FormState, value: string) => {
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

  const validateForm = (): boolean => {
    try {
      eventFormSchema.parse({
        title: formState.title,
        description: formState.description,
        date: formState.date,
        fromTime: formState.fromTime,
        toTime: formState.toTime,
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
    formState.date !== "" &&
    formState.fromTime !== "";

  return {
    formState,
    setFormField,
    validateForm,
    errors,
    isLoading,
    setIsLoading,
    isFormValid,
  };
};
