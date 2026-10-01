/**
 * Official PesaJet Node.js & TypeScript SDK Client
 *
 * Plug-and-play client library for initiating mobile money collections,
 * payouts, fee estimations, and status inquiries across MTN & Airtel.
 */

import type {
  CreatePaymentOptions,
  FeePreviewOptions,
  FeePreviewResult,
  ListTransactionsOptions,
  PaginatedTransactions,
  PaymentTransaction,
  PesaJetConfig,
  Provider,
} from "./types";

export class PesaJetError extends Error {
  public statusCode?: number;
  public errorCode?: string;
  public details?: unknown;

  constructor(
    message: string,
    statusCode?: number,
    errorCode?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "PesaJetError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export class PesaJet {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: PesaJetConfig) {
    if (!config.apiKey) {
      throw new PesaJetError(
        "PesaJet API key is required. Pass { apiKey: 'pk_...' }",
      );
    }
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || "http://localhost:3000/api/v1").replace(
      /\/$/,
      "",
    );
    this.timeoutMs = config.timeoutMs || 30000;
  }

  /**
   * Internal authenticated HTTP dispatcher
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      "X-API-Key": this.apiKey,
      "User-Agent": "PesaJet-NodeSDK/1.0",
      ...(options.headers || {}),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      const responseText = await response.text();
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { message: responseText };
      }

      if (!response.ok) {
        const errorMessage =
          responseData?.error?.message ||
          responseData?.message ||
          `HTTP Error ${response.status}: ${response.statusText}`;
        const errorCode =
          responseData?.error?.code || responseData?.statusCode || "API_ERROR";
        throw new PesaJetError(
          errorMessage,
          response.status,
          errorCode,
          responseData,
        );
      }

      return responseData as T;
    } catch (error: any) {
      if (error instanceof PesaJetError) throw error;
      if (error.name === "AbortError") {
        throw new PesaJetError(
          `Request timeout after ${this.timeoutMs}ms`,
          408,
          "TIMEOUT",
        );
      }
      throw new PesaJetError(
        error.message || "Network request failed",
        0,
        "NETWORK_ERROR",
        error,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  public readonly payments = {
    /**
     * Initiates a new mobile money payment (Collection or Disbursement).
     *
     * @example
     * const payment = await pesajet.payments.create({
     *   amount: 15000,
     *   phoneNumber: "+256771234567",
     *   provider: "mtn",
     *   reference: "ORDER-9921",
     *   description: "E-commerce order fulfillment"
     * });
     */
    create: async (
      options: CreatePaymentOptions,
    ): Promise<PaymentTransaction> => {
      const payload = {
        type: options.type || "COLLECTION",
        amount: Number(options.amount),
        currency: options.currency || "UGX",
        phoneNumber: options.phoneNumber,
        provider:
          options.provider || this.utils.detectProvider(options.phoneNumber),
        reference: options.reference || `REF-${Date.now()}`,
        description: options.description,
        idempotencyKey:
          options.idempotencyKey ||
          `idem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        metadata: options.metadata,
      };

      return this.request<PaymentTransaction>("/payments", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    /**
     * Retrieves current status and carrier diagnostics for a transaction.
     */
    get: async (transactionId: string): Promise<PaymentTransaction> => {
      if (!transactionId) {
        throw new PesaJetError("transactionId is required");
      }
      return this.request<PaymentTransaction>(`/payments/${transactionId}`, {
        method: "GET",
      });
    },

    /**
     * Lists recent transactions with optional filtering and pagination.
     */
    list: async (
      options: ListTransactionsOptions = {},
    ): Promise<PaginatedTransactions> => {
      const params = new URLSearchParams();
      if (options.page) params.append("page", String(options.page));
      if (options.limit) params.append("limit", String(options.limit));
      if (options.status) params.append("status", options.status);
      if (options.provider) params.append("provider", options.provider);
      if (options.type) params.append("type", options.type);
      if (options.search) params.append("search", options.search);
      if (options.startDate) params.append("startDate", options.startDate);
      if (options.endDate) params.append("endDate", options.endDate);

      const qs = params.toString();
      return this.request<PaginatedTransactions>(
        `/payments${qs ? `?${qs}` : ""}`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Calculates fee breakdown and net amounts before executing a transaction.
     */
    preview: async (options: FeePreviewOptions): Promise<FeePreviewResult> => {
      const params = new URLSearchParams({
        amount: String(options.amount),
        provider: options.provider,
        type: options.type,
      });
      return this.request<FeePreviewResult>(
        `/payments/preview?${params.toString()}`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Polls transaction status until a terminal state (COMPLETED, FAILED, EXPIRED) is reached.
     * Useful for synchronous checkout flows when waiting for customer USSD PIN entry.
     */
    pollUntilComplete: async (
      transactionId: string,
      pollOptions: {
        maxAttempts?: number;
        intervalMs?: number;
        onPoll?: (txn: PaymentTransaction) => void;
      } = {},
    ): Promise<PaymentTransaction> => {
      const maxAttempts = pollOptions.maxAttempts || 30; // 30 attempts * 2s = 60s
      const intervalMs = pollOptions.intervalMs || 2000;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const txn = await this.payments.get(transactionId);
        if (pollOptions.onPoll) pollOptions.onPoll(txn);

        if (
          txn.status === "COMPLETED" ||
          txn.status === "FAILED" ||
          txn.status === "EXPIRED"
        ) {
          return txn;
        }

        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }

      throw new PesaJetError(
        `Polling timed out for transaction ${transactionId}`,
        408,
        "POLL_TIMEOUT",
      );
    },
  };

  public readonly utils = {
    /**
     * Automatically detects whether a Ugandan phone number belongs to MTN or Airtel.
     * Note: 079 is MTN. 073 cuts across both MTN and Airtel networks, so returns null
     * and the caller must explicitly provide the provider.
     */
    detectProvider: (phoneNumber: string): Provider | null => {
      const cleaned = phoneNumber.replace(/[\s\-\+]/g, "");
      // Formats: 25677..., 25678..., 25676..., 25679..., 25639... => MTN
      // Formats: 25670..., 25675..., 25674... => Airtel
      // Note: 25673... cuts across MTN & Airtel, so provider cannot be auto-detected (returns null).
      if (/^(256|0)?(77|78|76|79|39)\d{7}$/.test(cleaned)) {
        return "mtn";
      }
      if (/^(256|0)?(70|75|74)\d{7}$/.test(cleaned)) {
        return "airtel";
      }
      return null;
    },

    /**
     * Formats any phone number into standard E.164 (+256...)
     */
    formatPhoneNumber: (phoneNumber: string): string => {
      let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, "");
      if (cleaned.startsWith("0")) {
        cleaned = "+256" + cleaned.slice(1);
      } else if (cleaned.startsWith("256")) {
        cleaned = "+" + cleaned;
      } else if (!cleaned.startsWith("+")) {
        cleaned = "+256" + cleaned;
      }
      return cleaned;
    },
  };
}
