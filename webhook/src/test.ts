import assert from "node:assert";
import { generateWebhookSignature, verifyWebhookSignature } from "./verify.ts";
import { processWebhookEvent } from "./handlers.ts";
import type { PesaJetWebhookPayload } from "./types.ts";

const SECRET = "whsec_test_secret_key_1234567890abcdef";

console.log("🧪 Starting PesaJet Webhook Unit & Integration Self-Tests...\n");

// Test 1: Signature generation and verification
{
  const payload: PesaJetWebhookPayload = {
    event: "payment.completed",
    transactionId: "txn_001",
    status: "COMPLETED",
    amount: 50000,
    currency: "UGX",
    provider: "MTN",
    reference: "ORD-1001",
    timestamp: new Date().toISOString(),
  };

  const signature = generateWebhookSignature(payload, SECRET);
  assert.ok(
    typeof signature === "string" && signature.length === 64,
    "Signature must be 64 hex chars",
  );

  const result = verifyWebhookSignature(payload, signature, SECRET);
  assert.strictEqual(
    result.isValid,
    true,
    "Valid signature must verify successfully",
  );
  console.log(
    "✅ Test 1 Passed: Valid HMAC-SHA256 signature generated and verified.",
  );
}

// Test 2: Tampered payload rejection
{
  const payload: PesaJetWebhookPayload = {
    event: "payment.completed",
    transactionId: "txn_002",
    status: "COMPLETED",
    amount: 50000,
    currency: "UGX",
    provider: "MTN",
    reference: "ORD-1002",
    timestamp: new Date().toISOString(),
  };

  const signature = generateWebhookSignature(payload, SECRET);

  // Tamper with the amount
  const tamperedPayload = { ...payload, amount: 100000 };
  const result = verifyWebhookSignature(tamperedPayload, signature, SECRET);
  assert.strictEqual(
    result.isValid,
    false,
    "Tampered payload must be rejected",
  );
  console.log("✅ Test 2 Passed: Tampered payload rejected as invalid.");
}

// Test 3: Wrong secret rejection
{
  const payload: PesaJetWebhookPayload = {
    event: "payment.completed",
    transactionId: "txn_003",
    status: "COMPLETED",
    amount: 50000,
    currency: "UGX",
    provider: "MTN",
    reference: "ORD-1003",
    timestamp: new Date().toISOString(),
  };

  const signature = generateWebhookSignature(payload, "whsec_attacker_secret");
  const result = verifyWebhookSignature(payload, signature, SECRET);
  assert.strictEqual(
    result.isValid,
    false,
    "Signature with wrong secret must be rejected",
  );
  console.log(
    "✅ Test 3 Passed: Signature computed with different secret rejected.",
  );
}

// Test 4: Missing or malformed signature header
{
  const payload = { event: "payment.completed" };
  const res1 = verifyWebhookSignature(payload, undefined, SECRET);
  assert.strictEqual(res1.isValid, false);
  assert.strictEqual(res1.reason, "Missing X-Webhook-Signature HTTP header");

  const res2 = verifyWebhookSignature(payload, "too_short", SECRET);
  assert.strictEqual(res2.isValid, false);
  assert.strictEqual(
    res2.reason,
    "Signature length mismatch (invalid signature)",
  );
  console.log(
    "✅ Test 4 Passed: Missing and malformed signature headers handled gracefully.",
  );
}

// Test 5: Event handlers and idempotency
async function testHandlers() {
  const payload: PesaJetWebhookPayload = {
    event: "payment.completed",
    transactionId: "txn_idempotency_001",
    status: "COMPLETED",
    amount: 120000,
    currency: "UGX",
    provider: "AIRTEL",
    reference: "ORD-999",
    timestamp: new Date().toISOString(),
  };

  // First delivery
  const res1 = await processWebhookEvent(payload);
  assert.strictEqual(res1.processed, true);
  assert.strictEqual(res1.duplicate, false);

  // Second delivery (simulated retry)
  const res2 = await processWebhookEvent(payload);
  assert.strictEqual(res2.processed, true);
  assert.strictEqual(
    res2.duplicate,
    true,
    "Duplicate delivery must be flagged",
  );

  console.log(
    "✅ Test 5 Passed: Event processing and idempotency deduplication verified.",
  );
}

testHandlers().then(() => {
  console.log("\n🎉 ALL 5 SELF-TESTS PASSED SUCCESSFULLY!\n");
});
