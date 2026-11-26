import crypto from "crypto";
export { normalizeSriLankanPhone } from "./phone";

/**
 * Generates a cryptographically secure random hex token.
 */
export function generateRawToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Hashes a raw token using SHA-256 for safe database storage.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
