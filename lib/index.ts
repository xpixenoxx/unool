/**
 * lib/ barrel export.
 * Exports only safe, side-effect-free utilities.
 * Do NOT export supabase, billing, cashfree, or other service clients here —
 * those carry side effects and should be imported directly.
 *
 * @example
 * import { cn, logger } from '@/lib';
 */
export { cn } from './utils';
export { logger } from './logger';

