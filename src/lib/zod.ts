import {
  object,
  email,
  string,
  array,
  number,
  enum as zenum,
  union,
} from "zod";

export const signInSchema = object({
  email: email({ error: "Email is required" }).min(1, "Email is required"),
  password: string({ error: "Password is required" })
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
});

// Role schema matching database values: 1 = read, 2 = read_write, 3 = admin
export const roleSchema = union([
  number().refine((n) => n === 1, { message: "Invalid role" }),
  number().refine((n) => n === 2, { message: "Invalid role" }),
  number().refine((n) => n === 3, { message: "Invalid role" }),
]).transform((n) => n as 1 | 2 | 3);

// Permission entry type
export const permissionEntryTypeSchema = zenum(["email", "userGroup"]);

// Individual permission entry schema
export const permissionEntrySchema = object({
  identifier: string().min(1, "Identifier is required"),
  type: permissionEntryTypeSchema,
  role: number().min(1).max(3),
  name: string().optional(),
});

// Array of permission entries
export const permissionArraySchema = array(permissionEntrySchema);

// Event group creation schema
export const eventGroupSchema = object({
  name: string()
    .min(1, "Group name is required")
    .max(100, "Group name must be less than 100 characters"),
  permissions: permissionArraySchema.optional().default([]),
});

// User group creation schema
export const userGroupSchema = object({
  name: string()
    .min(1, "Group name is required")
    .max(100, "Group name must be less than 100 characters"),
  memberEmails: array(email("Invalid email format")).optional().default([]),
});

export const eventFormSchema = object({
  title: string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  description: string()
    .min(1, "Description is required")
    .max(1000, "Description must be less than 1000 characters"),
  fromTime: string().min(1, "Start time is required"),
  toTime: string().optional().default(""),
  eventGroupId: string().min(1, "Event group is required"),
  permissions: permissionArraySchema.optional().default([]),
});

export const emailListSchema = object({
  emails: array(email("Invalid email format")).min(
    1,
    "At least one valid email is required",
  ),
});
