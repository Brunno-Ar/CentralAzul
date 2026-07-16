/**
 * SSRF Protection Module
 *
 * Prevents Server-Side Request Forgery by validating URLs before making requests.
 * This implementation resolves the hostname to an IP address at request time
 * (not just validation time) to prevent DNS rebinding TOCTOU attacks.
 */

import dns from "dns/promises";

/**
 * Private IP ranges to block (RFC 1918, RFC 3927, RFC 6598, loopback)
 */
const PRIVATE_IP_RANGES = [
  /^10\./,                    // 10.0.0.0/8
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12
  /^192\.168\./,              // 192.168.0.0/16
  /^127\./,                   // 127.0.0.0/8 (loopback)
  /^169\.254\./,              // 169.254.0.0/16 (link-local)
  /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\./, // 100.64.0.0/10 (CGNAT)
];

/**
 * Cloud metadata endpoints to block
 */
const METADATA_IPS = ["169.254.169.254", "169.254.169.254"];

/**
 * Allowed domains (hostnames that are always allowed)
 */
const ALLOWED_DOMAINS = [
  "drive.google.com",
  "docs.google.com",
  "sheets.google.com",
  "sharepoint.com",
  "onedrive.live.com",
  "youtube.com",
  "youtu.be",
  "vimeo.com",
];

/**
 * Validates an external URL to prevent SSRF
 * Resolves hostname to IP at validation time to prevent DNS rebinding
 *
 * @param url - The URL to validate
 * @returns boolean - true if URL is safe, false otherwise
 */
export async function validateExternalUrl(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);

    // Only allow HTTP/HTTPS
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname;

    // Block IP addresses directly (prevent bypass via IP literal)
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      return isPublicIp(hostname);
    }

    // Block IPv6 literals
    if (hostname.startsWith("[") && hostname.endsWith("]")) {
      return false;
    }

    // Block IP obfuscation formats (decimal, hex)
    if (/^\d+$/.test(hostname) || /^0x[0-9a-f]+$/i.test(hostname)) {
      return false;
    }

    // Allow known safe domains
    if (ALLOWED_DOMAINS.some((d) => hostname.endsWith(d))) {
      return true;
    }

    // Resolve hostname to IPs at validation time (mitigates TOCTOU)
    let ips: string[];
    try {
      const records = await dns.resolve4(hostname);
      ips = records;
    } catch {
      // If DNS resolution fails, deny the request
      return false;
    }

    // Check all resolved IPs against private ranges
    for (const ip of ips) {
      if (!isPublicIp(ip)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Synchronous version for backward compatibility (less secure - use async version)
 * @deprecated Use validateExternalUrl instead
 */
export function validateExternalUrlSync(url: string): boolean {
  try {
    const parsed = new URL(url);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname;

    // Check private IP ranges
    if (PRIVATE_IP_RANGES.some((regex) => regex.test(hostname))) {
      return false;
    }

    // Block loopback
    if (hostname === "::1" || hostname === "[::1]") {
      return false;
    }

    // Block cloud metadata IPs
    if (METADATA_IPS.includes(hostname)) {
      return false;
    }

    // Block IP obfuscation
    if (/^\d+$/.test(hostname) || /^0x[0-9a-f]+$/i.test(hostname)) {
      return false;
    }

    // Allow known safe domains
    if (ALLOWED_DOMAINS.some((d) => hostname.endsWith(d))) {
      return true;
    }

    // For sync version, we can't resolve DNS, so we do basic validation
    // In production, always use the async version
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if an IPv4 address is public (not in private ranges)
 */
function isPublicIp(ip: string): boolean {
  // Block cloud metadata endpoint
  if (METADATA_IPS.includes(ip)) {
    return false;
  }

  // Check against private ranges
  return !PRIVATE_IP_RANGES.some((regex) => regex.test(ip));
}

/**
 * Validates a URL and returns the resolved IPs for use in fetch
 * This ensures the same IPs checked are used for the actual request
 */
export async function validateAndResolveUrl(url: string): Promise<string[] | null> {
  try {
    const parsed = new URL(url);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    const hostname = parsed.hostname;

    // Allow known safe domains without DNS resolution
    if (ALLOWED_DOMAINS.some((d) => hostname.endsWith(d))) {
      return [hostname]; // Return hostname for allowed domains
    }

    // Resolve at request time
    const ips = await dns.resolve4(hostname);

    // Verify all IPs are public
    for (const ip of ips) {
      if (!isPublicIp(ip)) {
        return null;
      }
    }

    return ips;
  } catch {
    return null;
  }
}
