import { PesaJetError } from "./errors.js";
import type {
  CreatePaymentParams,
  FeePreviewParams,
  FeePreviewResult,
  PesaJetConfig,
  Transaction,
} from "./types.js";

export class PaymentsClient {
  private config: Required<PesaJetConfig>;

  constructor(config: Required<PesaJetConfig>) {
    this.config = config;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-API-Key": this.config.apiKey,
      ...(options.headers as Record<string, string>),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: responseText };
      }

      if (!response.ok) {
        throw new PesaJetError(
          data.message || data.error || `HTTP ${response.status} Error`,
          response.status,
          data.errorCode,
          data
        );
      }

      return data as T;
    } catch (error: any) {
      if (error instanceof PesaJetError) {
        throw error;
      }
      if (error.name === "AbortError") {
        throw new PesaJetError(`Request timed out after ${this.config.timeoutMs}ms`, 408, "TIMEOUT");
      }
      throw new PesaJetError(error.message || "Network request failed", 500, "NETWORK_ERROR", error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Initiate Mobile Money Collection or Payout
   */
  public async create(params: CreatePaymentParams): Promise<Transaction> {
    const payload = {
      type: params.type || "COLLECTION",
      amount: params.amount,
      currency: params.currency || "UGX",
      phoneNumber: params.phoneNumber,
      provider: params.provider,
      reference: params.reference,
      description: params.description,
      metadata: params.metadata,
    };

    const headers: Record<string, string> = {};
    if (params.idempotencyKey) {
      headers["Idempotency-Key"] = params.idempotencyKey;
    }

    return this.request<Transaction>("/payments", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  }

  /**
   * Get transaction details by ID
   */
  public async get(transactionId: string): Promise<Transaction> {
    return this.request<Transaction>(`/payments/${transactionId}`, {
      method: "GET",
    });
  }

  /**
   * Calculate transaction fee preview
   */
  public async preview(params: FeePreviewParams): Promise<FeePreviewResult> {
    const type = params.type || "COLLECTION";
    const query = new URLSearchParams({
      amount: String(params.amount),
      provider: params.provider,
      type,
    });
    return this.request<FeePreviewResult>(`/payments/preview?${query.toString()}`, {
      method: "GET",
    });
  }

  /**
   * Helper: Poll transaction until it reaches a terminal status (COMPLETED / FAILED / EXPIRED)
   */
  public async pollUntilComplete(
    transactionId: string,
    options: { intervalMs?: number; maxAttempts?: number } = {}
  ): Promise<Transaction> {
    const intervalMs = options.intervalMs || 2500;
    const maxAttempts = options.maxAttempts || 24; // 1 minute default

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const txn = await this.get(transactionId);
      if (txn.status === "COMPLETED" || txn.status === "FAILED" || txn.status === "EXPIRED") {
        return txn;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new PesaJetError(`Polling timed out for transaction ${transactionId}`, 408, "POLL_TIMEOUT");
  }
}
