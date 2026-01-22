/**
 * Utilities for public profile management.
 */

import { randomBytes, createHash } from "crypto";

/**
 * Generates an unguessable public profile ID.
 * Uses crypto.randomBytes for secure random generation.
 * 
 * @returns A random 32-character hex string (unguessable)
 */
export function generatePublicProfileId(): string {
  // Generate 16 random bytes (128 bits of entropy)
  // Convert to hex string (32 characters)
  return randomBytes(16).toString("hex");
}

/**
 * Validates that a public profile ID is in the correct format.
 * 
 * @param id The ID to validate
 * @returns true if valid format, false otherwise
 */
export function isValidPublicProfileId(id: string): boolean {
  // Should be 32-character hex string
  return /^[a-f0-9]{32}$/i.test(id);
}
