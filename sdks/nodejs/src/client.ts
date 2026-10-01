import { PesaJetError } from "./errors.js";
import { PaymentsClient } from "./payments.js";
import type { PesaJetConfig, Provider } from "./types.js";
import { WebhookClient } from "./webhooks.js";

export class PesaJet {
  public readonly payments: PaymentsClient;
  public readonly webhooks: WebhookClient;

  public readonly utils = {
    /**
     * Detect carrier network from Ugandan phone number.
     * Note: 079 is MTN. 073 cuts across both MTN and Airtel networks, so returns null
     * and the caller must explicitly provide the provider.
     */
    detectProvider(phoneNumber: string): Provider | null {
      const cleaned = phoneNumber.replace(/[\s\-\+]/g, "");
      // 079 is MTN. 073 cuts across MTN & Airtel (shared/ported), so provider cannot be auto-detected and returns null.
      if (/^(256|0)?(77|78|76|79|39)\d{7}$/.test(cleaned)) return "mtn";
      if (/^(256|0)?(70|75|74)\d{7}$/.test(cleaned)) return "airtel";
      return null;
    },
    formatPhoneNumber(phoneNumber: string): string {
      let cleaned = phoneNumber.replace(/[\s\-]/g, "");
      if (cleaned.startsWith("0")) cleaned = `+256${cleaned.slice(1)}`;
      else if (cleaned.startsWith("256")) cleaned = `+${cleaned}`;
      else if (!cleaned.startsWith("+")) cleaned = `+${cleaned}`;
      return cleaned;
    },
  };

  constructor(config: PesaJetConfig) {
    if (!config?.apiKey) {
      throw new PesaJetError(
        "PesaJet API key (apiKey) is required to initialize client",
        401,
        "MISSING_API_KEY",
      );
    }

    const resolvedConfig: Required<PesaJetConfig> = {
      apiKey: config.apiKey,
      baseUrl: (
        config.baseUrl || "https://payments.pesajet.com/api/v1"
      ).replace(/\/$/, ""),
      timeoutMs: config.timeoutMs || 30000,
      webhookSecret: config.webhookSecret || "",
    };

    this.payments = new PaymentsClient(resolvedConfig);
    this.webhooks = new WebhookClient(resolvedConfig.webhookSecret);
  }
}
