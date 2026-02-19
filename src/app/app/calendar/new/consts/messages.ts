export const MESSAGES = {
  ALERT: {
    INVALID_SESSION: {
      title: "Invalid Session",
      type: "error" as const,
      description:
        "Your browser session is invalid. Please clear your cache and try again.",
    },
    EMAIL_VALIDATION_ERROR: {
      title: "Error Validating Emails",
      type: "warning" as const,
      description: "Unable to validate emails. Try again after some time.",
    },
    INVALID_EMAILS: (emails: string[]) => ({
      title: "Some Emails Not Found",
      type: "warning" as const,
      description: `The following emails don't exist: ${emails.join(", ")}`,
    }),
    EVENT_ADD_ERROR: {
      title: "Unable to Add Event",
      type: "error" as const,
      description: "Try again later.",
    },
    EVENT_ADD_SUCCESS: {
      title: "Event Added Successfully",
      type: "info" as const,
      description: "",
    },
  },
};
