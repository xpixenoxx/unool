/**
 * SSRF Protection - URL validation to prevent server-side request forgery
 * Blocks private IPs, localhost, internal hostnames, and metadata endpoints
 */

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  ip?: string;
}

// Private IP ranges (IPv4)
const PRIVATE_IPV4_RANGES: Array<{ start: number; end: number }> = [
  { start: ipToNumber('10.0.0.0'), end: ipToNumber('10.255.255.255') },       // 10.0.0.0/8
  { start: ipToNumber('172.16.0.0'), end: ipToNumber('172.31.255.255') },       // 172.16.0.0/12
  { start: ipToNumber('192.168.0.0'), end: ipToNumber('192.168.255.255') },     // 192.168.0.0/16
  { start: ipToNumber('169.254.0.0'), end: ipToNumber('169.254.255.255') },     // 169.254.0.0/16 (metadata)
  { start: ipToNumber('127.0.0.0'), end: ipToNumber('127.255.255.255') },       // 127.0.0.0/8 (loopback)
  { start: ipToNumber('0.0.0.0'), end: ipToNumber('0.255.255.255') },           // 0.0.0.0/8
];

// Private IPv6 ranges
const PRIVATE_IPV6_PREFIXES = [
  '::1',           // loopback
  'fe80::',        // link-local
  'fc00::',        // unique local (fc00::/7)
  'fd00::',        // unique local
  '::ffff:0:',     // IPv4-mapped
];

// Blocked hostnames
const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  'metadata',
  'metadata.google.internal',
  '169.254.169.254',  // AWS/GCP/Azure metadata
  '.local',         // .local domains (mDNS)
  '.internal',      // .internal domains
  '.corp',          // corporate domains
];

// Cloud metadata endpoints
const METADATA_IPS = [
  '169.254.169.254',  // AWS, GCP, Azure
  '169.254.169.253',  // GCP
];

// Allowed domains for profile extraction (optional allowlist)
const ALLOWED_EXTRACTION_DOMAINS = [
  'linkedin.com',
  'github.com',
  'twitter.com',
  'x.com',
  'threads.net',
  'medium.com',
  'substack.com',
];

/**
 * Validates a URL for safe fetching (SSRF protection)
 * Returns validation result with reason if blocked
 */
export async function validateUrlForFetch(url: string): Promise<ValidationResult> {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return { allowed: false, reason: 'Invalid URL format' };
  }

  // Only allow http/https
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { allowed: false, reason: `Protocol ${parsed.protocol} not allowed` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check blocked hostnames
  for (const blocked of BLOCKED_HOSTNAMES) {
    if (blocked.startsWith('.')) {
      if (hostname.endsWith(blocked) || hostname === blocked.slice(1)) {
        return { allowed: false, reason: `Blocked hostname pattern: ${blocked}` };
      }
    } else if (hostname === blocked) {
      return { allowed: false, reason: `Blocked hostname: ${blocked}` };
    }
  }

  // Check metadata IPs directly
  if (METADATA_IPS.includes(hostname)) {
    return { allowed: false, reason: 'Metadata endpoint blocked' };
  }

  // If hostname is already an IP literal (IPv4 or IPv6), validate directly without DNS lookup
  if (isValidIpv4(hostname) || isValidIpv6(hostname)) {
    if (isPrivateIp(hostname)) {
      return { allowed: false, reason: `Private IP address blocked: ${hostname}` };
    }
    return { allowed: true, ip: hostname.replace(/^\[|\]$/g, '') };
  }

  // Resolve hostname to IP for further validation
  let ips: string[];
  try {
    const { addresses } = await resolveHostname(hostname);
    ips = addresses;
  } catch {
    return { allowed: false, reason: 'Failed to resolve hostname' };
  }

  if (!ips || ips.length === 0) {
    return { allowed: false, reason: 'Failed to resolve hostname to any IP address' };
  }

  // Validate each resolved IP (fail closed if any address is invalid or private)
  for (const rawIp of ips) {
    const ip = rawIp.replace(/^\[|\]$/g, '');
    if (!isValidIpv4(ip) && !isValidIpv6(ip)) {
      return { allowed: false, reason: `Unrecognized or unresolvable address: ${ip}` };
    }

    if (isPrivateIp(ip)) {
      return { allowed: false, reason: `Private IP address blocked: ${ip}` };
    }
  }

  return { allowed: true, ip: ips[0] };
}

/**
 * Checks if a URL's domain is in the allowed extraction domains list
 */
export function isAllowedExtractionDomain(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_EXTRACTION_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Quick synchronous check for obviously bad URLs (before DNS resolution)
 * Use this as a first pass, then call validateUrlForFetch for full check
 */
export function quickUrlValidation(url: string): ValidationResult {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { allowed: false, reason: `Protocol ${parsed.protocol} not allowed` };
    }

    for (const blocked of BLOCKED_HOSTNAMES) {
      if (blocked.startsWith('.')) {
        if (hostname.endsWith(blocked) || hostname === blocked.slice(1)) {
          return { allowed: false, reason: `Blocked hostname pattern: ${blocked}` };
        }
      } else if (hostname === blocked) {
        return { allowed: false, reason: `Blocked hostname: ${blocked}` };
      }
    }

    if (METADATA_IPS.includes(hostname)) {
      return { allowed: false, reason: 'Metadata endpoint blocked' };
    }

    // Check if hostname IS an IP address
    if (isValidIpv4(hostname) || isValidIpv6(hostname)) {
      if (isPrivateIp(hostname)) {
        return { allowed: false, reason: `Private IP address: ${hostname}` };
      }
    }

    return { allowed: true };
  } catch {
    return { allowed: false, reason: 'Invalid URL format' };
  }
}

function isPrivateIp(ip: string): boolean {
  const cleanIp = ip.replace(/^\[|\]$/g, '').toLowerCase();

  // Check IPv4
  if (isValidIpv4(cleanIp)) {
    const num = ipToNumber(cleanIp);
    for (const range of PRIVATE_IPV4_RANGES) {
      if (num >= range.start && num <= range.end) {
        return true;
      }
    }
    return false;
  }

  // Check IPv6
  if (isValidIpv6(cleanIp)) {
    for (const prefix of PRIVATE_IPV6_PREFIXES) {
      if (cleanIp.startsWith(prefix)) {
        return true;
      }
    }
    // Check IPv4-mapped IPv6 addresses (dotted quad ::ffff:127.0.0.1 or hex ::ffff:7f00:1)
    if (cleanIp.startsWith('::ffff:')) {
      const mapped = cleanIp.slice(7);
      if (isValidIpv4(mapped)) {
        return isPrivateIp(mapped);
      }
      const hexMatch = mapped.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
      if (hexMatch) {
        const hi = parseInt(hexMatch[1], 16);
        const lo = parseInt(hexMatch[2], 16);
        const ipv4 = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
        return isPrivateIp(ipv4);
      }
    }
    return false;
  }

  return false;
}

function isValidIpv4(ip: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) &&
    ip.split('.').every((octet) => parseInt(octet, 10) <= 255);
}

function isValidIpv6(ip: string): boolean {
  const clean = ip.replace(/^\[|\]$/g, '').toLowerCase();
  if (!clean.includes(':')) return false;
  if (clean.startsWith('::ffff:')) {
    const mapped = clean.slice(7);
    if (isValidIpv4(mapped)) return true;
  }
  return /^[0-9a-f:]+$/.test(clean);
}

function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

async function resolveHostname(hostname: string): Promise<{ addresses: string[] }> {
  // Use Node.js dns.promises for DNS resolution
  // In Edge runtime, this will use the fallback
  try {
    const { promises: dnsPromises } = await import('dns');
    const addresses = await dnsPromises.resolve4(hostname).catch(() => []);
    const addresses6 = await dnsPromises.resolve6(hostname).catch(() => []);
    return { addresses: [...addresses, ...addresses6] };
  } catch {
    // Fallback for Edge runtime or when dns is not available
    // In production, ensure DNS resolution is configured
    return { addresses: [hostname] };
  }
}