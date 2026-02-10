import { object, email, string, array } from "zod";

export const signInSchema = object({
  email: email({ error: "Email is required" }).min(1, "Email is required"),
  password: string({ error: "Password is required" })
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
});

export const eventFormSchema = object({
  title: string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  description: string()
    .min(1, "Description is required")
    .max(1000, "Description must be less than 1000 characters"),
  date: string().min(1, "Date is required"),
  fromTime: string().min(1, "Start time is required"),
  toTime: string().optional().default(""),
});

export const emailListSchema = object({
  emails: array(email("Invalid email format")).min(
    1,
    "At least one valid email is required",
  ),
});
