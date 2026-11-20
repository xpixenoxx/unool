import type SharpType from 'sharp';

export type SharpFn = typeof SharpType;

let cached: Promise<SharpFn | null> | null = null;

/**
 * `sharp` is a native Node module and cannot be loaded on Cloudflare Workers.
 * Import it lazily so it never runs at module-load time (which crashed every route
 * importing the platform adapters with error 1101). Returns null when unavailable;
 * callers should then publish the original media unchanged.
 */
export function loadSharp(): Promise<SharpFn | null> {
  if (!cached) {
    cached = import('sharp')
      .then((m) => ((m as { default?: SharpFn }).default ?? (m as unknown as SharpFn)))
      .catch(() => null);
  }
  return cached;
}
