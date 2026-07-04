import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  // Extract IP from headers (X-Forwarded-For or X-Real-IP fallback)
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ipAddress = forwardedFor?.split(",")[0] || realIp || "unknown";
  
  // Log the honeypot hit
  await db.addLog(
    "system", // Use "system" as the userId since this is a security event
    "HONEYPOT_HIT",
    JSON.stringify({
      timestamp: new Date().toISOString(),
      entity: "admin/debug",
      ipAddress,
      userAgent: req.headers.get("user-agent") || "unknown",
      method: "GET",
      path: "/api/admin/debug",
    }),
    ipAddress,
    req.headers.get("user-agent") || undefined,
  );
  
  // Return 404 to make it look like a normal not-found endpoint
  return new Response(null, { status: 404 });
}