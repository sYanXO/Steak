import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().trim().min(3, "Group name is too short.").max(80),
  slug: z
    .string()
    .trim()
    .min(3, "Group slug is too short.")
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only.")
});

export const joinGroupSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3, "Enter a valid group slug.")
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only.")
});
