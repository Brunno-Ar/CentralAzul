import { RateLimiterMemory } from "rate-limiter-flexible";
import { NextRequest, NextResponse } from "next/server";

// SINGLETON rate limiters - shared across all requests
const limiters = {
  api: new RateLimiterMemory({ points: 100, duration: 60 }),      // 100 req/min
  auth: new RateLimiterMemory({ points: 10, duration: 60 }),       // 10 req/min
  mutation: new RateLimiterMemory({ points: 30, duration: 60 }),   // 30 req/min
  upload: new RateLimiterMemory({ points: 10, duration: 3600 }),   // 10/hour
};

async function getClientKey(request: NextRequest): Promise<string> {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();
    if (session?.user?.id) {
      return `user:${session.user.id}`;
    }
  } catch {
    // Ignore auth error, fallback to IP
  }

  const ip = request.headers.get("x-forwarded-for") || 
             request.headers.get("x-real-ip") || 
             "unknown";
  const ua = request.headers.get("user-agent") || "";
  return `${ip}:${ua.slice(0, 50)}`;
}

export async function rateLimit(
  request: NextRequest,
  limiterKey: keyof typeof limiters = "api"
): Promise<NextResponse | null> {
  const limiter = limiters[limiterKey];
  const clientKey = await getClientKey(request);
  
  try {
    await limiter.consume(clientKey);
    return null; // Success - no response means continue
  } catch (rateLimiterRes) {
    const retryAfter = Math.ceil((rateLimiterRes as { msBeforeNext: number }).msBeforeNext / 1000);
    return NextResponse.json(
      { 
        error: "Muitas requisições. Tente novamente mais tarde.",
        retryAfter 
      },
      { 
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limiter.points),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000 + retryAfter)),
        }
      }
    );
  }
}

// Wrapper for API handlers
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limiterKey: keyof typeof limiters = "api"
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const limitResponse = await rateLimit(request, limiterKey);
    if (limitResponse) return limitResponse;
    
    const response = await handler(request);
    
    // Add rate limit headers to successful responses
    const clientKey = await getClientKey(request);
    try {
      const result = await limiters[limiterKey].get(clientKey);
      if (result) {
        response.headers.set("X-RateLimit-Limit", String(limiters[limiterKey].points));
        response.headers.set("X-RateLimit-Remaining", String(result.remainingPoints));
        response.headers.set("X-RateLimit-Reset", String(Math.ceil(result.msBeforeNext / 1000 + Date.now() / 1000)));
      }
    } catch {
      // Key not found yet, skip headers
    }
    
    return response;
  };
}

// Auto-detect limiter based on path and method
export function getLimiterKey(request: NextRequest): keyof typeof limiters {
  const path = request.nextUrl.pathname;
  const method = request.method;
  
  if (path.startsWith("/api/auth/")) return "auth";
  if (path.startsWith("/api/upload")) return "upload";
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) return "mutation";
  return "api";
}