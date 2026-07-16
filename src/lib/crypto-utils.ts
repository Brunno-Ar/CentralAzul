/**
 * Secure cryptographic utilities
 * Uses Web Crypto API for cryptographically secure random values
 */

/**
 * Generates a cryptographically secure random token
 * @param length - Length of the token in bytes (default: 32 bytes = 64 hex chars)
 * @returns Hex-encoded random string
 */
export function generateSecureToken(length: number = 32): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback for environments without crypto.getRandomValues (should not happen in modern browsers)
  const array = new Uint8Array(length);
  // eslint-disable-next-line no-restricted-globals
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates a shorter secure token for CSRF (16 bytes = 32 hex chars)
 */
export function generateCsrfToken(): string {
  return generateSecureToken(16);
}

/**
 * Generates a secure ID prefix for database entities
 * @param prefix - Prefix for the ID (e.g., "user-", "panel-", "ann-")
 * @returns Secure prefixed ID
 */
export function generateSecureId(prefix: string): string {
  const randomPart = generateSecureToken(9); // 9 bytes = 18 hex chars
  return `${prefix}${randomPart}`;
}
