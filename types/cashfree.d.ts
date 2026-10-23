// Type declaration shim for @cashfreepayments/cashfree-js
// The package doesn't ship TypeScript declarations, so we define the minimal surface we use.

declare module '@cashfreepayments/cashfree-js' {
  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: '_self' | '_blank' | '_modal';
  }

  export interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): Promise<void>;
  }

  export interface CashfreeLoadOptions {
    mode: 'sandbox' | 'production';
  }

  export function load(options: CashfreeLoadOptions): Promise<CashfreeInstance>;
}
