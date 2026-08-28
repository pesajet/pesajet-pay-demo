/**
 * PesaJet Webhook Event Types
 */
export type WebhookEvent =
  | "payment.completed"
  | "payment.failed"
  | "payment.expired"
  | "webhook.test";

/**
 * Underlying Transaction Lifecycle Status
 */
export type TransactionStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED";

/**
 * Mobile Money / Banking Providers Supported
 */
export type PaymentProvider =
  | "MTN"
  | "AIRTEL"
  | "STANBIC"
  | "EQUITY"
  | "SANDBOX"
  | string;

/**
 * PesaJet Webhook JSON Payload Schema
 * Sent via HTTP POST to the merchant's configured webhook URL.
 */
export interface PesaJetWebhookPayload<TMetadata = Record<string, unknown>> {
  /** The specific event type triggered */
  event: WebhookEvent;

  /** PesaJet unique transaction identifier (e.g. txn_01j7abc...) */
  transactionId: string;

  /** Current lifecycle status of the transaction */
  status: TransactionStatus;

  /** Transaction amount (in minor units or major currency, e.g. 50000) */
  amount: number;

  /** ISO 4217 Currency Code (e.g. UGX, USD, KES) */
  currency: string;

  /** Telecom or banking provider used */
  provider: PaymentProvider;

  /** Merchant's external order / transaction reference */
  reference: string;

  /** Provider-specific financial transaction ID (e.g. MTN MoMo Financial Transaction ID) */
  providerReference?: string;

  /** Error or decline reason if the transaction failed */
  failureReason?: string;

  /** Optional custom metadata passed during transaction initiation */
  metadata?: TMetadata;

  /** ISO 8601 Timestamp of event occurrence */
  timestamp: string;
}

/**
 * Result of webhook HMAC-SHA256 signature verification
 */
export interface SignatureVerificationResult {
  isValid: boolean;
  reason?: string;
  expectedSignature?: string;
}
