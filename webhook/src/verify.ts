import crypto from "node:crypto";
import type { SignatureVerificationResult } from "./types.ts";

/**
 * Computes the HMAC-SHA256 signature for a given payload and signing secret.
 *
 * @param payload - The raw JSON string or object sent in the webhook body
 * @param secret - Your PesaJet webhook signing secret (e.g. whsec_...)
 * @returns Hex-encoded HMAC-SHA256 signature
 */
export function generateWebhookSignature(
  payload: string | object | unknown,
  secret: string,
): string {
  let cleanPayload = payload;

  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload);
      if (parsed && typeof parsed === "object" && "signature" in parsed) {
        const { signature: _, ...rest } = parsed;
        cleanPayload = rest;
      }
    } catch {
      // Not a JSON string, retain original string
    }
  } else if (
    typeof payload === "object" &&
    payload !== null &&
    !Array.isArray(payload) &&
    "signature" in payload
  ) {
    const { signature: _, ...rest } = payload as Record<string, unknown>;
    cleanPayload = rest;
  }

  const payloadString =
    typeof cleanPayload === "string"
      ? cleanPayload
      : JSON.stringify(cleanPayload);

  console.log("Hashed Payload String:", payloadString);

  return crypto
    .createHmac("sha256", secret)
    .update(payloadString)
    .digest("hex");
}

/**
 * Verifies that a received webhook payload was authentically dispatched by PesaJet
 * using constant-time HMAC-SHA256 verification to prevent timing side-channel attacks.
 *
 * @param payload - The body of the webhook (string or parsed JSON object)
 * @param signature - The signature from the `X-Webhook-Signature` HTTP header
 * @param secret - Your PesaJet signing secret from your merchant dashboard
 * @returns SignatureVerificationResult containing validation status
 */
export function verifyWebhookSignature(
  payload: string | object | unknown,
  signature: string | string[] | undefined,
  secret: string | undefined,
): SignatureVerificationResult {
  // 1. Guard against missing parameters
  if (!secret) {
    return {
      isValid: false,
      reason: "Server is missing PESAJET_WEBHOOK_SECRET environment variable",
    };
  }

  if (!signature) {
    return {
      isValid: false,
      reason: "Missing X-Webhook-Signature HTTP header",
    };
  }

  // Handle possible array header from Express
  const rawSignature = Array.isArray(signature) ? signature[0] : signature;

  if (!rawSignature || typeof rawSignature !== "string") {
    return {
      isValid: false,
      reason: "Invalid signature header format",
    };
  }

  // 2. Compute the expected HMAC signature
  const expectedSignature = generateWebhookSignature(payload, secret);

  console.log("\n--- 🔐 Webhook Signature Debug ---");
  console.log("Received Header Signature:", rawSignature);
  console.log("Computed Expected Signature:", expectedSignature);
  console.log(
    "Secret Loaded:",
    secret ? `${secret.slice(0, 15)}... (len: ${secret.length})` : "MISSING",
  );

  // 3. Length comparison to prevent buffer length mismatch errors in timingSafeEqual
  const signatureBuffer = Buffer.from(rawSignature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (signatureBuffer.length !== expectedBuffer.length) {
    console.error(
      "❌ Length mismatch: received",
      signatureBuffer.length,
      "vs expected",
      expectedBuffer.length,
    );
    return {
      isValid: false,
      reason: "Signature length mismatch (invalid signature)",
      expectedSignature,
    };
  }

  // 4. Timing-safe comparison to prevent timing side-channel attacks
  const isMatch = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  console.log("Signature Match Status:", isMatch ? "✅ VALID" : "❌ MISMATCH");
  console.log("-----------------------------------\n");

  return {
    isValid: isMatch,
    reason: isMatch ? undefined : "Cryptographic signature mismatch",
    expectedSignature,
  };
}
