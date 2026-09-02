/**
 * PesaJet Node.js & TypeScript SDK Automated Test Suite
 */

import crypto from "node:crypto";
import {
  PesaJet,
  PesaJetError,
  WebhookVerificationError,
} from "./dist/index.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ Passed: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ Failed: ${testName}${detail ? ` (${detail})` : ""}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("🧪 Testing @pesajet/sdk (Node.js & TypeScript)");
  console.log("=======================================================\n");

  // 1. Client Initialization Tests
  console.log("📦 1. Client Initialization:");
  try {
    const client = new PesaJet({
      apiKey: "pk_test_sample_12345",
      webhookSecret: "whsec_sample_secret_67890",
    });
    assert(
      client instanceof PesaJet,
      "Client instantiates successfully with API key",
    );
  } catch (err: any) {
    assert(false, "Client instantiates successfully", err.message);
  }

  try {
    // @ts-expect-error test missing key
    new PesaJet({});
    assert(false, "Rejects initialization when apiKey is missing");
  } catch (err: any) {
    assert(
      err instanceof PesaJetError && err.errorCode === "MISSING_API_KEY",
      "Rejects initialization with MISSING_API_KEY error code",
    );
  }

  // 2. Carrier Detection & Phone Utilities
  console.log("\n📱 2. Phone Utilities & Network Detection:");
  const pesajet = new PesaJet({ apiKey: "pk_test_demo" });

  assert(
    pesajet.utils.detectProvider("+256771234567") === "mtn",
    "Identifies MTN numbers (077...)",
  );
  assert(
    pesajet.utils.detectProvider("0781234567") === "mtn",
    "Identifies MTN numbers (078...)",
  );
  assert(
    pesajet.utils.detectProvider("+256701234567") === "airtel",
    "Identifies Airtel numbers (070...)",
  );
  assert(
    pesajet.utils.detectProvider("0751234567") === "airtel",
    "Identifies Airtel numbers (075...)",
  );
  assert(
    pesajet.utils.detectProvider("+254712345678") === null,
    "Returns null for non-Ugandan prefixes",
  );

  assert(
    pesajet.utils.formatPhoneNumber("0771234567") === "+256771234567",
    "Formats 077... to +25677...",
  );
  assert(
    pesajet.utils.formatPhoneNumber("256701234567") === "+256701234567",
    "Formats 25670... to +25670...",
  );
  assert(
    pesajet.utils.formatPhoneNumber("+256781234567") === "+256781234567",
    "Preserves existing +256 E.164",
  );

  // 3. Webhook Cryptographic Verification
  console.log("\n🔐 3. HMAC-SHA256 Webhook Verification:");
  const secret = "whsec_test_secret_99887766554433221100";
  const webhookClient = new PesaJet({
    apiKey: "pk_test_demo",
    webhookSecret: secret,
  });

  const rawPayload = {
    event: "payment.completed",
    transactionId: "550e8400-e29b-41d4-a716-446655440000",
    amount: 50000,
    currency: "UGX",
    status: "COMPLETED",
    provider: "mtn",
    reference: "ORD-9912",
    timestamp: "2026-08-28T21:30:00.000Z",
  };

  const payloadString = JSON.stringify(rawPayload);
  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(payloadString)
    .digest("hex");

  // Valid signature check
  const isValid = webhookClient.webhooks.verify(rawPayload, validSignature);
  assert(isValid === true, "Valid HMAC signature passes verification");

  // Tampered payload check
  const tamperedPayload = { ...rawPayload, amount: 999999 };
  const isTamperedValid = webhookClient.webhooks.verify(
    tamperedPayload,
    validSignature,
  );
  assert(
    isTamperedValid === false,
    "Tampered payload fails verification (anti-tamper invariant)",
  );

  // Invalid signature check
  const isBadSigValid = webhookClient.webhooks.verify(
    rawPayload,
    "bad_signature_0000000000000000000000000000000000000000000000000000000000000000",
  );
  assert(isBadSigValid === false, "Bogus signature string fails verification");

  // constructEvent helper check
  try {
    const event = webhookClient.webhooks.constructEvent(
      JSON.stringify(rawPayload),
      validSignature,
    );
    assert(
      event.event === "payment.completed",
      "constructEvent parses valid payload",
    );
  } catch (err: any) {
    assert(false, "constructEvent parses valid payload", err.message);
  }

  try {
    webhookClient.webhooks.constructEvent(
      JSON.stringify(tamperedPayload),
      validSignature,
    );
    assert(
      false,
      "constructEvent throws WebhookVerificationError on bad signature",
    );
  } catch (err: any) {
    assert(
      err instanceof WebhookVerificationError,
      "constructEvent throws WebhookVerificationError on bad signature",
    );
  }

  // Summary
  console.log("\n=======================================================");
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
