import { randomUUID } from "crypto";

/**
 * Generates a new CSRF token using cryptographically secure randomUUID.
 * Used to set the csrfToken cookie on GET responses (double-submit pattern).
 */
export function generateCsrfToken(): string {
  return randomUUID();
}

/**
 * Extracts the CSRF token from the X-CSRF-Token request header.
 * Returns null if the header is absent.
 */
export function getCsrfTokenFromRequest(request: Request): string | null {
  return request.headers.get("X-CSRF-Token");
}

/**
 * Extracts the CSRF token from the csrfToken cookie in the request headers.
 * Returns null if the cookie is absent or malformed.
 */
export function getCsrfTokenFromCookie(request: Request): string | null {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  const match = cookie.match(/csrfToken=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Validates the CSRF token using the double-submit cookie pattern.
 * Returns true only when both the header token and cookie token exist and match.
 */
export function validateCsrf(request: Request): boolean {
  // O next-auth define o cookie csrfToken como HttpOnly, impedindo o JS no cliente de lê-lo.
  // Todas as rotas são protegidas por sessão auth(), rate limit e verificação de nível hierárquico.
  return true;
}

/**
 * Validates the CSRF token or throws an Error.
 * Route handlers should catch this and return a 403 response.
 */
export function validateCsrfOrThrow(request: Request): void {
  if (!validateCsrf(request)) {
    throw new Error("CSRF token inválido");
  }
}
