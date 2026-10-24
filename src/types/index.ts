// ---------------------------------------------------------------
// Shared domain types for the payment analytics platform.
// No payment credentials (card numbers, CVV, UPI PINs, account
// numbers) are ever modelled or stored.
// ---------------------------------------------------------------

export type PaymentMethod = 'UPI' | 'Card' | 'Wallet' | 'NetBanking';
export type TxnStatus = 'Success' | 'Failed' | 'Pending';
export type Device = 'Mobile App' | 'Web' | 'POS Terminal';

export const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Card', 'Wallet', 'NetBanking'];
export const TXN_STATUSES: TxnStatus[] = ['Success', 'Failed', 'Pending'];

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  UPI: 'UPI',
  Card: 'Cards',
  Wallet: 'Digital Wallets',
  NetBanking: 'Online Banking',
};

/** A record as it arrives from a data source, before validation. */
export interface RawTransaction {
  id?: string;
  timestamp?: string;
  customerId?: string;
  method?: string;
  amount?: number;
  status?: string;
  merchant?: string;
  category?: string;
  city?: string;
  device?: string;
  failureReason?: string;
  source?: string;
}

/** A validated, cleaned transaction used everywhere in the UI. */
export interface Transaction {
  id: string;
  timestamp: string; // ISO string
  customerId: string;
  method: PaymentMethod;
  amount: number;
  status: TxnStatus;
  merchant: string;
  category: string;
  city: string;
  device: Device;
  failureReason?: string;
  source: string;
}

export interface ProcessingReport {
  rawCount: number;
  validCount: number;
  rejectedCount: number;
  rejected: { reason: string; count: number }[];
  bySource: { source: string; count: number }[];
  processedAt: string;
}

export type Severity = 'High' | 'Medium' | 'Low';
export type AlertStatus = 'Open' | 'Under Review' | 'Resolved';
export type AlertRule = 'HIGH_VALUE' | 'RAPID_REPEAT' | 'REPEATED_FAILURE' | 'ODD_HOUR';

export interface Alert {
  id: string;
  rule: AlertRule;
  title: string;
  description: string;
  severity: Severity;
  timestamp: string;
  customerId: string;
  transactionIds: string[];
  amount: number;
  status: AlertStatus;
}

export interface Filters {
  from: string; // yyyy-mm-dd
  to: string; // yyyy-mm-dd
  method: PaymentMethod | 'All';
}

export interface Preferences {
  defaultRangeDays: 7 | 30 | 90 | 0; // 0 = all data
  rowsPerPage: number;
  compactNumbers: boolean;
  chartAnimations: boolean;
}

export interface Profile {
  name: string;
  email: string;
  role: string;
}
