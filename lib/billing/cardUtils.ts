/**
 * Card utility functions for billing/payment UI.
 * Extracted from BillingClient.tsx for reusability.
 */

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }
  return digits;
}

export function getCardBrand(num: string): {
  name: string;
  brand: 'visa' | 'mastercard' | 'rupay' | 'amex' | 'generic';
  color: string;
} {
  const clean = num.replace(/\s+/g, '');
  if (/^4/.test(clean)) return { name: 'Visa', brand: 'visa', color: '#1A1F71' };
  if (/^(5[1-5]|2[2-7])/.test(clean)) return { name: 'Mastercard', brand: 'mastercard', color: '#EB001B' };
  if (/^(60|65|81|82)/.test(clean)) return { name: 'RuPay', brand: 'rupay', color: '#097939' };
  if (/^3[47]/.test(clean)) return { name: 'Amex', brand: 'amex', color: '#006FCF' };
  return { name: 'Card', brand: 'generic', color: '#7A7265' };
}

export function formatSubscriptionDate(dateStr?: string | null): string {
  if (!dateStr) return '\u2014';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '\u2014';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '\u2014';
  }
}

