import crypto from "node:crypto";
import { Buffer } from "node:buffer";
import { WebhookVerificationError } from "./errors.js";
import type { WebhookPayload } from "./types.js";

export class WebhookClient {
  private defaultSecret?: string;

  constructor(defaultSecret?: string) {
    this.defaultSecret = defaultSecret;
  }

  /**
   * Verify HMAC-SHA256 signature of an incoming webhook payload
   */
  public verify(
    rawBodyOrPayload: string | Record<string, any>,
    receivedSignature?: string,
    secretOverride?: string,
  ): boolean {
    const secret = secretOverride || this.defaultSecret;
    if (!secret) {
      throw new WebhookVerificationError(
        "Webhook signing secret is required for verification",
      );
    }

    let payloadString = "";
    let signatureToMatch = receivedSignature;

    if (typeof rawBodyOrPayload === "string") {
      try {
        const parsed = JSON.parse(rawBodyOrPayload);
        if (!signatureToMatch && parsed.signature) {
          signatureToMatch = parsed.signature;
        }
        const { signature: _omitted, ...cleanPayload } = parsed;
        payloadString = JSON.stringify(cleanPayload);
      } catch {
        payloadString = rawBodyOrPayload;
      }
    } else {
      const { signature: _omitted, ...cleanPayload } = rawBodyOrPayload;
      if (!signatureToMatch && rawBodyOrPayload.signature) {
        signatureToMatch = rawBodyOrPayload.signature;
      }
      payloadString = JSON.stringify(cleanPayload);
    }

    if (!signatureToMatch) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payloadString)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(signatureToMatch, "utf8");

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  }

  /**
   * Parse and verify payload, throwing WebhookVerificationError on failure
   */
  public constructEvent(
    rawBody: string,
    signature: string,
    secret?: string,
  ): WebhookPayload {
    const isValid = this.verify(rawBody, signature, secret);
    if (!isValid) {
      throw new WebhookVerificationError(
        "Webhook signature verification failed",
      );
    }
    return JSON.parse(rawBody) as WebhookPayload;
  }
}
