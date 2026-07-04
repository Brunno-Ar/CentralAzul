/**
 * Validates an external URL to prevent Server-Side Request Forgery (SSRF).
 *
 * This function blocks private IP ranges, IPv6 loopback, cloud metadata
 * endpoints, and various IP obfuscation techniques. It allows known safe
 * public domains (Google Drive, SharePoint, YouTube, etc.).
 *
 * IMPORTANT LIMITATION - DNS Rebinding TOCTOU:
 * This validation parses the URL string and checks the hostname. A
 * determined attacker could use DNS rebinding: the hostname resolves to a
 * safe public IP at validation time, but to a private IP at request time.
 * To fully mitigate this, the URL must be resolved to an IP and that IP
 * must be checked at the moment the HTTP request is made (not before).
 * This is a Time-Of-Check-Time-Of-Use (TOCTOU) race condition inherent
 * to hostname-based validation.
 */
export function validateExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname;

    const ipv4Private = /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|169\.254\.)/;
    if (ipv4Private.test(hostname)) {
      return false;
    }

    if (hostname === "::1" || hostname === "[::1]") {
      return false;
    }

    const metadataIPs = ["169.254.169.254"];
    if (metadataIPs.includes(hostname)) {
      return false;
    }

    if (/^\d+$/.test(hostname) || /^0x[0-9a-f]+$/i.test(hostname)) {
      return false;
    }

    const allowedDomains = [
      "drive.google.com",
      "docs.google.com",
      "sheets.google.com",
      "sharepoint.com",
      "onedrive.live.com",
      "youtube.com",
      "youtu.be",
      "vimeo.com",
    ];

    if (allowedDomains.some((d) => hostname.endsWith(d))) {
      return true;
    }

    return true;
  } catch {
    return false;
  }
}
