import { z } from "zod";

/** Shared password policy: min 8 chars, at least one letter and one number. */
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

export const signupSchema = z.object({
  email: z.string().email("Enter a valid email").max(255),
  password,
  name: z.string().min(1).max(120).optional(),
  companyName: z.string().min(1).max(200).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(10),
  password,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
