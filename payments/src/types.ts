/**
 * PesaJet Payments Integration Types & Interfaces
 */

export type Provider = "mtn" | "airtel";

export type TransactionType = "COLLECTION" | "DISBURSEMENT";

export type TransactionStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED"
  | "REVERSED";

export interface CreatePaymentOptions {
  /** Transaction amount in local currency (e.g. 10000) */
  amount: number;
  /** Customer mobile money phone number in E.164 format (e.g. +256770000000) */
  phoneNumber: string;
  /** Three-letter currency code (ISO 4217). Defaults to UGX. */
  currency?: string;
  /** Mobile money telecom provider (mtn or airtel). Auto-detected if omitted. */
  provider?: Provider;
  /** Type of transaction: COLLECTION (receiving money) or DISBURSEMENT (payout) */
  type?: TransactionType;
  /** Your unique merchant order/invoice reference */
  reference?: string;
  /** Optional customer-facing description of the payment */
  description?: string;
  /** Unique key to prevent double charging on network retries */
  idempotencyKey?: string;
  /** Custom key-value pairs to attach to this transaction */
  metadata?: Record<string, unknown>;
}

export interface PaymentTransaction {
  transactionId: string;
  status: TransactionStatus;
  amount: number;
  currency: string;
  phoneNumber: string;
  provider: Provider;
  reference: string;
  description?: string;
  providerReference?: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  expiresAt?: string;
}

export interface FeePreviewOptions {
  amount: number;
  provider: Provider;
  type: TransactionType;
}

export interface FeePreviewResult {
  amount: number;
  currency: string;
  provider: string;
  type: TransactionType;
  platformFee: number;
  providerFee?: number;
  totalFee: number;
  netAmount: number;
  totalCost: number;
}

export interface ListTransactionsOptions {
  page?: number;
  limit?: number;
  status?: TransactionStatus;
  provider?: Provider;
  type?: TransactionType;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedTransactions {
  data: PaymentTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PesaJetConfig {
  /** Merchant API key (starts with pk_...) */
  apiKey: string;
  /** Base URL for PesaJet API (defaults to http://localhost:3000/api/v1) */
  baseUrl?: string;
  /** Request timeout in milliseconds (defaults to 30000) */
  timeoutMs?: number;
}
