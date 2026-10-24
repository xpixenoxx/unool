// Type declaration shim for @cashfreepayments/cashfree-js
// The package doesn't ship TypeScript declarations, so we define the minimal surface we use.

declare module '@cashfreepayments/cashfree-js' {
  export interface CashfreeCheckoutResult {
    error?: {
      message: string;
      code?: string;
    };
    redirect?: boolean;
    paymentDetails?: Record<string, unknown>;
  }

  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: '_self' | '_blank' | '_modal' | HTMLElement;
    appearance?: {
      width?: string;
      height?: string;
      borderColor?: string;
      backgroundColor?: string;
      borderWidth?: string;
      borderRadius?: string;
    };
  }

  export interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): Promise<CashfreeCheckoutResult | void>;
  }

  export interface CashfreeLoadOptions {
    mode: 'sandbox' | 'production';
  }

  export function load(options: CashfreeLoadOptions): Promise<CashfreeInstance>;
}
