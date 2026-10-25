/**
 * Payment Error Sanitizer
 * Prevents internal gateway debug info, sandbox test accounts, employee emails,
 * and confidential phone numbers from ever leaking to the end user.
 */

export function sanitizePaymentError(
  rawError: unknown,
  fallback: string = 'Payment processing failed. Please try again.'
): string {
  if (!rawError) return fallback;

  const message = typeof rawError === 'string'
    ? rawError
    : (rawError as any)?.message || (rawError as any)?.error || String(rawError);

  const lower = message.toLowerCase();

  // Cashfree sandbox UPI test account whitelist dump leakage
  if (
    lower.includes('upi_id for sandbox should be') ||
    lower.includes('@gocash') ||
    lower.includes('@cosb') ||
    lower.includes('@axis') ||
    lower.includes('sandbox') ||
    /\b\d{10}@(paytm|axis|cosb|upi)\b/i.test(message) ||
    /[a-zA-Z0-9._%+-]+@(axis|cosb|gocash|payu)/i.test(message)
  ) {
    return 'Unable to process payment with this UPI ID. Please check your UPI ID and try again.';
  }

  // Card specific sanitized errors
  if (lower.includes('invalid card') || lower.includes('card_number') || lower.includes('card number')) {
    return 'The card number entered is invalid. Please check and try again.';
  }
  if (lower.includes('expiry') || lower.includes('expired')) {
    return 'The card expiry date is invalid or the card has expired.';
  }
  if (lower.includes('cvv') || lower.includes('cvc')) {
    return 'The CVV/CVC entered is invalid.';
  }
  if (lower.includes('insufficient') || lower.includes('funds')) {
    return 'Insufficient funds on this payment method. Please try another card or account.';
  }
  if (lower.includes('declined') || lower.includes('do not honor')) {
    return 'Transaction was declined by your bank or card issuer. Please contact your bank.';
  }
  if (lower.includes('user_dropped') || lower.includes('cancelled') || lower.includes('user dropped')) {
    return 'Payment was cancelled.';
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'Payment verification timed out. Please try again.';
  }

  // Check for any accidental email addresses or 10-digit phone numbers in the error message
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(message) || /\b\d{10}\b/.test(message)) {
    return 'Payment could not be processed with the provided details. Please verify your information and try again.';
  }

  // If the error message is clean and short, return it; otherwise fallback
  if (message.length < 120 && !/[{}[\]<>]/.test(message) && !lower.includes('internal') && !lower.includes('sql') && !lower.includes('supabase')) {
    return message;
  }

  return fallback;
}
