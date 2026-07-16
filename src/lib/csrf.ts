/**
 * CSRF Protection Module
 *
 * Implements Double Submit Cookie pattern for CSRF protection.
 * NextAuth v5 with JWT strategy doesn't automatically provide CSRF protection
 * for API routes, so we implement our own.
 *
 * The token is stored in an HttpOnly cookie and also sent in a custom header
 * or form field. Both must match for the request to be valid.
 */

import { cookies } from "next/headers";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generates a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Sets the CSRF token cookie
 */
export async function setCsrfTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

/**
 * Gets the CSRF token from the cookie
 */
export async function getCsrfTokenFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

/**
 * Validates the CSRF token from the request
 * Checks both the header and the cookie
 */
export async function validateCsrf(request: Request): Promise<boolean> {
  // Only validate mutating requests
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    return true;
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!cookieToken) {
    return false;
  }

  // Check header first (for fetch/ajax requests)
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  // Check form data (for form submissions)
  let formToken: string | null = null;
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.clone().formData();
      formToken = formData.get("csrf_token") as string | null;
    } catch {
      // Ignore form parsing errors
    }
  }

  const providedToken = headerToken || formToken;

  if (!providedToken) {
    return false;
  }

  // Use timing-safe comparison
  return timingSafeEqual(cookieToken, providedToken);
}

/**
 * Validates CSRF token and throws if invalid
 */
export async function validateCsrfOrThrow(request: Request): Promise<void> {
  const isValid = await validateCsrf(request);
  if (!isValid) {
    throw new Error("CSRF token invalido ou ausente");
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Middleware helper to add CSRF token to response headers
 * for client-side access
 */
export async function addCsrfTokenToResponse(): Promise<string> {
  const token = generateCsrfToken();
  await setCsrfTokenCookie(token);
  return token;
}
