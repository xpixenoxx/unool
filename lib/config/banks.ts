/**
 * Indian bank list for net-banking payment method UI.
 * Extracted from BillingClient.tsx for reusability.
 */

export interface BankEntry {
  code: string;
  name: string;
  short?: string;
  badgeColor?: string;
}

export const POPULAR_BANKS: BankEntry[] = [
  { code: '3021', name: 'HDFC Bank',            short: 'HDFC',  badgeColor: '#004C8F' },
  { code: '3022', name: 'ICICI Bank',           short: 'ICICI', badgeColor: '#B02A30' },
  { code: '3044', name: 'State Bank of India',  short: 'SBI',   badgeColor: '#225894' },
  { code: '3003', name: 'Axis Bank',            short: 'Axis',  badgeColor: '#97144D' },
  { code: '3032', name: 'Kotak Mahindra Bank',  short: 'Kotak', badgeColor: '#ED1C24' },
  { code: '3038', name: 'Punjab National Bank', short: 'PNB',   badgeColor: '#A21D22' },
];

export const ALL_OTHER_BANKS: BankEntry[] = [
  { code: '3005', name: 'Bank of Baroda' },
  { code: '3009', name: 'Canara Bank' },
  { code: '3028', name: 'IndusInd Bank' },
  { code: '3055', name: 'Union Bank of India' },
  { code: '3058', name: 'Yes Bank' },
  { code: '3023', name: 'IDBI Bank' },
  { code: '3006', name: 'Bank of India' },
  { code: '3011', name: 'Central Bank of India' },
  { code: '3026', name: 'Indian Bank' },
  { code: '3018', name: 'Federal Bank' },
  { code: '3039', name: 'RBL Bank' },
  { code: '3087', name: 'AU Small Finance Bank' },
  { code: '3043', name: 'Standard Chartered Bank' },
  { code: '3024', name: 'IDFC FIRST Bank' },
  { code: '3042', name: 'South Indian Bank' },
  { code: '3054', name: 'UCO Bank' },
];

