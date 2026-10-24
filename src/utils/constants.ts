import type { AlertStatus, PaymentMethod, Severity, TxnStatus } from '../types';

export const METHOD_COLORS: Record<PaymentMethod, string> = {
  UPI: '#2fb33c',
  Card: '#9ad99f',
  Wallet: '#5f8f6b',
  NetBanking: '#e0b84f',
};

export const STATUS_COLORS: Record<TxnStatus, string> = {
  Success: '#2fb33c',
  Failed: '#e05353',
  Pending: '#e0a33a',
};

export const SEVERITY_ORDER: Record<Severity, number> = { High: 3, Medium: 2, Low: 1 };

export const ALERT_STATUSES: AlertStatus[] = ['Open', 'Under Review', 'Resolved'];
export const SEVERITIES: Severity[] = ['High', 'Medium', 'Low'];
