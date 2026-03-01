import { z } from "zod";

export const profileSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(50, "First name must be under 50 characters"),
  last_name: z
    .string()
    .trim()
    .max(50, "Last name must be under 50 characters")
    .optional()
    .default(""),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .refine((v) => !/\.{2,}/.test(v), "Email contains invalid characters")
    .refine((v) => /\.[a-z]{2,}$/i.test(v), "Email domain looks incomplete"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine(
      (v) => v.replace(/\D/g, "").length === 10,
      "Enter a valid 10-digit phone number"
    ),
});

export type ProfileFormErrors = Partial<Record<keyof z.infer<typeof profileSchema>, string>>;

export function validateField(
  field: keyof z.infer<typeof profileSchema>,
  value: string
): string | null {
  const result = profileSchema.shape[field].safeParse(value);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? "Invalid";
}

export function validateAll(data: {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}): ProfileFormErrors {
  const result = profileSchema.safeParse(data);
  if (result.success) return {};
  const errors: ProfileFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof ProfileFormErrors;
    if (!errors[field]) errors[field] = issue.message;
  }
  return errors;
}
