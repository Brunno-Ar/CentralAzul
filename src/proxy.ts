import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { SessionUser } from "@/types/auth";
import { randomUUID } from "crypto";
import { generateCsrfToken } from "@/lib/csrf";

// In-memory rate limit store
const limiterStore = new Map<string, { count: number; resetTime: number }>();

function getClientKey(request: Request): string {
  const ip = request.headers.get("x-forwarded-for") || 
             request.headers.get("x-real-ip") || 
             "unknown";
  const ua = request.headers.get("user-agent") || "";
  return `${ip}:${ua.slice(0, 50)}`;
}

function checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = limiterStore.get(key);
  
  if (!record || now > record.resetTime) {
    limiterStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
  }
  
  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  record.count++;
  return { allowed: true, remaining: limit - record.count, resetTime: record.resetTime };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of limiterStore.entries()) {
    if (now > record.resetTime) {
      limiterStore.delete(key);
    }
  }
}, 60000);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Rate limiting for auth endpoints (before auth check)
  if (nextUrl.pathname.startsWith("/api/auth/")) {
    const clientKey = getClientKey(req);
    const isSigninOrCallback = nextUrl.pathname.includes("/signin") || nextUrl.pathname.includes("/callback");
    const limit = process.env.NODE_ENV !== "production" 
      ? 1000 
      : (isSigninOrCallback ? 50 : 100);
    const windowMs = 60000; // 1 minute
    
    const { allowed, remaining, resetTime } = checkRateLimit(clientKey, limit, windowMs);
    
    if (!allowed) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      return new NextResponse(
        JSON.stringify({ error: "Muitas requisições. Tente novamente mais tarde.", retryAfter }),
        { 
          status: 429, 
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(resetTime / 1000)),
          } 
        }
      );
    }
    
    // Add rate limit headers and continue
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(limit));
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetTime / 1000)));
    return response;
  }


  // Dashboard routes (need login)
  const isDashboardPath = nextUrl.pathname.startsWith("/dashboard");

  // Admin routes (need level 1)
  const isAdminPath = 
    nextUrl.pathname.startsWith("/dashboard/seguranca") ||
    nextUrl.pathname.startsWith("/dashboard/empresas");

  const user = req.auth?.user as SessionUser | undefined;
  const userLevel = user?.hierarchyLevel;
  const isAdmin = userLevel === 1 || user?.role === "ADMIN";

  // Not logged in trying to access dashboard
  if (!isLoggedIn && isDashboardPath) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(
      new URL(`/api/auth/signin?callbackUrl=${callbackUrl}`, nextUrl.origin)
    );
  }

  // Non-admin trying to access admin area
  if (isAdminPath && !isAdmin) {
    return NextResponse.redirect(
      new URL("/dashboard?error=unauthorized", nextUrl.origin)
    );
  }

  // Security headers
  const nonce = randomUUID();
  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = isDev
    ? `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' 'strict-dynamic'`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;
  const styleSrc = `style-src 'self' 'unsafe-inline'`;
  const cspHeader = `default-src 'self'; ${scriptSrc}; ${styleSrc}; img-src 'self' blob: data: https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`;

  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  req.headers.set("x-nonce", nonce);

  // Double-submit CSRF cookie: set on GET responses so the client has a token
  // to echo back via X-CSRF-Token header on POST/PUT/DELETE requests.
  if (req.method === "GET") {
    const csrfToken = generateCsrfToken();
    response.cookies.set("csrfToken", csrfToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return response;
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};