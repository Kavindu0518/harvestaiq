import { z } from "zod";

/**
 * Strong password policy: 8-128 chars with uppercase, lowercase, digit, and symbol.
 */
export const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .max(128, "Password must be at most 128 characters long.")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter.")
  .regex(/[a-z]/, "Password must include at least one lowercase letter.")
  .regex(/[0-9]/, "Password must include at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must include at least one special character.");

export const emailSchema = z
  .string()
  .trim()
  .email("Please provide a valid email address.")
  .transform((value) => value.toLowerCase());

export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid user identifier.");
