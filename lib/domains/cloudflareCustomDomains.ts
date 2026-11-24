import { promises as nodeDns } from 'dns';
import { logger } from '@/lib/logger';

const CLOUDFLARE_DOH_ENDPOINT = 'https://cloudflare-dns.com/dns-query';
const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

export type CustomDomainSslStatus =
  | 'active'
  | 'pending_validation'
  | 'pending_issuance'
  | 'pending_deployment'
  | 'initializing'
  | 'dns_only'
  | 'unverified';

export interface CloudflareCustomHostnameInfo {
  id: string;
  hostname: string;
  status: string;
  sslStatus: CustomDomainSslStatus;
  ownershipVerificationTxt?: {
    name: string;
    value: string;
  } | null;
}

interface DohAnswer {
  name?: string;
  type?: number;
  data?: string;
}

function unquoteTxtData(raw: string): string {
  // DNS-over-HTTPS returns TXT strings wrapped in quotes (potentially multi-segment: `"part1" "part2"`)
  const trimmed = raw.trim();
  if (!trimmed.includes('"')) return trimmed;
  const matches = trimmed.match(/"([^"]*)"/g);
  if (!matches) return trimmed.replace(/^"+|"+$/g, '');
  return matches.map((segment) => segment.slice(1, -1)).join('').trim();
}

/**
 * Queries Cloudflare 1.1.1.1 DNS-over-HTTPS (`application/dns-json`).
 * Works natively inside Cloudflare Workers / Edge isolates without Node `dns` sockets.
 */
export async function resolveDnsOverHttps(
  hostname: string,
  recordType: 'TXT' | 'CNAME'
): Promise<string[]> {
  try {
    const url = `${CLOUDFLARE_DOH_ENDPOINT}?name=${encodeURIComponent(hostname)}&type=${recordType}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/dns-json' },
    });
    if (!res.ok) return [];
    const data = (await res.json().catch(() => null)) as { Answer?: DohAnswer[] } | null;
    if (!Array.isArray(data?.Answer)) return [];

    const expectedType = recordType === 'TXT' ? 16 : 5;
    return data.Answer.filter((ans) => !ans.type || ans.type === expectedType)
      .map((ans) => (typeof ans.data === 'string' ? ans.data : ''))
      .filter(Boolean)
      .map((val) =>
        recordType === 'TXT' ? unquoteTxtData(val) : val.trim().toLowerCase().replace(/\.$/, '')
      );
  } catch {
    return [];
  }
}

/**
 * Verifies whether `expectedTxt` is present at `_unool-challenge.<domain>` or `<domain>`.
 * Tries Node `dns.resolveTxt` first (fast in Node/tests) and falls back to Cloudflare DoH
 * so verification works reliably on Cloudflare Workers edge runtime.
 */
export async function verifyCustomDomainTxtRecord(
  domain: string,
  expectedTxt: string,
  options?: { forceDoh?: boolean }
): Promise<boolean> {
  const cleanDomain = domain.trim().toLowerCase();
  const targetValue = expectedTxt.trim();
  const hostsToCheck = [`_unool-challenge.${cleanDomain}`, cleanDomain];

  if (!options?.forceDoh && typeof nodeDns?.resolveTxt === 'function') {
    for (const host of hostsToCheck) {
      try {
        const records = await nodeDns.resolveTxt(host);
        if (Array.isArray(records) && records.some((parts) => parts.join('').trim() === targetValue)) {
          return true;
        }
      } catch {
        // Ignore ENOTFOUND / ENODATA / edge ERR_METHOD_NOT_IMPLEMENTED and continue
      }
    }
  }

  for (const host of hostsToCheck) {
    const dohTxt = await resolveDnsOverHttps(host, 'TXT');
    if (dohTxt.some((val) => val === targetValue)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether the domain's CNAME points to the expected Unool target (best-effort informational check).
 */
export async function checkCustomDomainCname(
  domain: string,
  expectedCnameTarget: string,
  options?: { forceDoh?: boolean }
): Promise<boolean> {
  const cleanDomain = domain.trim().toLowerCase();
  const cleanTarget = expectedCnameTarget.trim().toLowerCase().replace(/\.$/, '');

  if (!options?.forceDoh && typeof nodeDns?.resolveCname === 'function') {
    try {
      const cnames = await nodeDns.resolveCname(cleanDomain);
      if (
        Array.isArray(cnames) &&
        cnames.some((c) => c.trim().toLowerCase().replace(/\.$/, '') === cleanTarget)
      ) {
        return true;
      }
    } catch {
      // Fall through to DoH
    }
  }

  const dohCnames = await resolveDnsOverHttps(cleanDomain, 'CNAME');
  return dohCnames.some((c) => c === cleanTarget);
}

function getCloudflareSaasCredentials(): { zoneId: string; apiToken: string } | null {
  const zoneId = (process.env.CLOUDFLARE_ZONE_ID || '').trim();
  const apiToken = (process.env.CLOUDFLARE_API_TOKEN || '').trim();
  if (!zoneId || !apiToken) return null;
  return { zoneId, apiToken };
}

function mapSslStatus(rawSslStatus?: string | null): CustomDomainSslStatus {
  const s = (rawSslStatus || '').toLowerCase();
  if (s === 'active') return 'active';
  if (s === 'pending_validation') return 'pending_validation';
  if (s === 'pending_issuance') return 'pending_issuance';
  if (s === 'pending_deployment') return 'pending_deployment';
  return 'initializing';
}

function mapHostnamePayload(item: Record<string, any>): CloudflareCustomHostnameInfo {
  const ov = item.ownership_verification;
  return {
    id: String(item.id || ''),
    hostname: String(item.hostname || ''),
    status: String(item.status || 'pending'),
    sslStatus: mapSslStatus(item.ssl?.status),
    ownershipVerificationTxt:
      ov?.type === 'txt' && ov?.name && ov?.value
        ? { name: String(ov.name), value: String(ov.value) }
        : null,
  };
}

/**
 * Fetches an existing Cloudflare for SaaS Custom Hostname record if configured.
 */
export async function getCloudflareCustomHostnameStatus(
  hostname: string
): Promise<CloudflareCustomHostnameInfo | null> {
  const creds = getCloudflareSaasCredentials();
  if (!creds) return null;

  try {
    const url = `${CLOUDFLARE_API_BASE}/zones/${encodeURIComponent(creds.zoneId)}/custom_hostnames?hostname=${encodeURIComponent(hostname.trim().toLowerCase())}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${creds.apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return null;
    const json = (await res.json().catch(() => null)) as { result?: Array<Record<string, any>> } | null;
    const match = json?.result?.[0];
    return match ? mapHostnamePayload(match) : null;
  } catch (err) {
    logger.warn('Cloudflare custom hostname status lookup failed', { hostname, error: err });
    return null;
  }
}

/**
 * Idempotently provisions a Cloudflare for SaaS Custom Hostname with DV TLS 1.2+ SSL.
 * Returns null gracefully when Cloudflare SaaS env vars are not configured.
 */
export async function provisionCloudflareCustomHostname(
  hostname: string
): Promise<CloudflareCustomHostnameInfo | null> {
  const creds = getCloudflareSaasCredentials();
  if (!creds) return null;

  const cleanHost = hostname.trim().toLowerCase();
  const existing = await getCloudflareCustomHostnameStatus(cleanHost);
  if (existing) return existing;

  try {
    const url = `${CLOUDFLARE_API_BASE}/zones/${encodeURIComponent(creds.zoneId)}/custom_hostnames`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hostname: cleanHost,
        ssl: {
          method: 'http',
          type: 'dv',
          settings: {
            min_tls_version: '1.2',
            http2: 'on',
          },
        },
      }),
    });

    const json = (await res.json().catch(() => null)) as {
      success?: boolean;
      result?: Record<string, any>;
    } | null;

    if (res.ok && json?.result) {
      return mapHostnamePayload(json.result);
    }

    // If duplicate race (409 / 1406), fetch existing record
    return await getCloudflareCustomHostnameStatus(cleanHost);
  } catch (err) {
    logger.warn('Cloudflare custom hostname provisioning skipped due to API error', {
      hostname: cleanHost,
      error: err,
    });
    return null;
  }
}

/**
 * Removes a Cloudflare for SaaS Custom Hostname when a user disconnects their domain.
 */
export async function removeCloudflareCustomHostname(hostname: string): Promise<boolean> {
  const creds = getCloudflareSaasCredentials();
  if (!creds) return false;

  try {
    const existing = await getCloudflareCustomHostnameStatus(hostname);
    if (!existing?.id) return false;

    const url = `${CLOUDFLARE_API_BASE}/zones/${encodeURIComponent(creds.zoneId)}/custom_hostnames/${encodeURIComponent(existing.id)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${creds.apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    return res.ok;
  } catch (err) {
    logger.warn('Cloudflare custom hostname removal failed', { hostname, error: err });
    return false;
  }
}
