export type Provider = "mtn" | "airtel";
export type TransactionType = "COLLECTION" | "DISBURSEMENT";
export type TransactionStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED";

export interface PesaJetConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  webhookSecret?: string;
}

export interface FeeBreakdown {
  version: number;
  totalFee: number;
  platformFee: number;
  ispTransferFee: number;
  platformFeePercentage: number;
  feeOverrideId?: string | null;
}

export interface CreatePaymentParams {
  type?: TransactionType;
  amount: number;
  currency?: string;
  phoneNumber: string;
  provider?: Provider;
  reference: string;
  description?: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

export interface Transaction {
  transactionId: string;
  providerReference?: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  provider: Provider;
  phoneNumber: string;
  reference: string;
  description?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
}

export interface FeePreviewParams {
  amount: number;
  provider: Provider;
  type?: TransactionType;
}

export interface FeePreviewResult {
  amount: number;
  provider: Provider;
  type: TransactionType;
  platformFee: number;
  providerFee: number;
  totalFee: number;
  netAmount: number;
  totalCost: number;
}

export interface WebhookPayload {
  event: "payment.completed" | "payment.failed" | "payment.expired" | "ping";
  transactionId?: string;
  providerReference?: string;
  amount?: number;
  currency?: string;
  status?: TransactionStatus;
  provider?: Provider;
  reference?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  signature?: string;
}
