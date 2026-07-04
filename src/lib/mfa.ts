/**
 * MFA/TOTP helper functions using otplib v13.
 *
 * Provides secret generation, token verification, and otpauth URI building
 * for the optional multi-factor authentication feature.
 *
 * When SystemConfig.mfaEnabled is true, users with a registered TOTP secret
 * must provide a valid 6-digit code after password validation.
 */

import { generateSecret, verify, generateURI } from "otplib";

/**
 * Generate a new base32-encoded TOTP secret.
 * Used during MFA setup to create a unique secret per user.
 */
export function generateTotpSecret(): string {
  return generateSecret();
}

/**
 * Verify a TOTP token against the stored secret.
 * Returns true if the token is valid within the current time window.
 */
export async function verifyTotp(token: string, secret: string): Promise<boolean> {
  const result = await verify({ secret, token });
  return result?.valid ?? false;
}

/**
 * Build an otpauth:// URI for QR code generation.
 * The URI is compatible with Google Authenticator, Microsoft Authenticator, etc.
 */
export function getTotpUri(userEmail: string, secret: string): string {
  return generateURI({
    issuer: "Central Azul",
    label: userEmail,
    secret,
  });
}
