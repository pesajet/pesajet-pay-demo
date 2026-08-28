import { generateWebhookSignature } from "./verify.ts";
import type { PesaJetWebhookPayload, WebhookEvent } from "./types.ts";

const PORT = process.env.PORT || "3000";
const SECRET =
  process.env.PESAJET_WEBHOOK_SECRET ||
  "whsec_demo_secret_key_change_me_in_production";
const TARGET_URL = `http://127.0.0.1:${PORT}/webhook`;

// Sample realistic mock payloads for each event type
const SAMPLE_PAYLOADS: Record<string, PesaJetWebhookPayload> = {
  completed: {
    event: "payment.completed",
    transactionId: `txn_${Date.now().toString(36)}_comp`,
    status: "COMPLETED",
    amount: 75000,
    currency: "UGX",
    provider: "MTN",
    reference: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
    providerReference: `MOMO-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    metadata: {
      customerId: "cust_89234",
      customerEmail: "alice@example.com",
      orderNotes: "Express delivery to Kampala",
    },
    timestamp: new Date().toISOString(),
  },

  failed: {
    event: "payment.failed",
    transactionId: `txn_${Date.now().toString(36)}_fail`,
    status: "FAILED",
    amount: 150000,
    currency: "UGX",
    provider: "AIRTEL",
    reference: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
    failureReason:
      "Payer cancelled transaction prompt on handset (Pin timeout)",
    metadata: {
      customerId: "cust_45120",
      cartId: "cart_89012",
    },
    timestamp: new Date().toISOString(),
  },

  expired: {
    event: "payment.expired",
    transactionId: `txn_${Date.now().toString(36)}_exp`,
    status: "EXPIRED",
    amount: 25000,
    currency: "UGX",
    provider: "MTN",
    reference: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
    failureReason:
      "Payment request expired after 10 minutes without customer initiation",
    timestamp: new Date().toISOString(),
  },

  test: {
    event: "webhook.test",
    transactionId: `test_txn_${Date.now().toString(36)}`,
    status: "COMPLETED",
    amount: 5000,
    currency: "UGX",
    provider: "SANDBOX",
    reference: "TEST-PING-001",
    metadata: {
      dispatchedBy: "Admin Diagnostic Test Tool",
      environment: "Sandbox/Live",
    },
    timestamp: new Date().toISOString(),
  },
};

async function runSimulator() {
  const arg = (process.argv[2] || "completed").toLowerCase();

  console.log(
    `\n📡 ================= PesaJet Webhook Simulator =================`,
  );
  console.log(`🎯 Target URL: ${TARGET_URL}`);
  console.log(`🔑 Using Secret: ${SECRET.slice(0, 10)}...`);

  let payload: PesaJetWebhookPayload;
  let signature: string;

  if (arg === "invalid" || arg === "invalid-signature") {
    payload = SAMPLE_PAYLOADS.completed;
    signature = "whsec_invalid_fake_signature_for_security_test_1234567890";
    console.log(`🧪 Testing Security: Sending intentional INVALID signature`);
  } else {
    payload = SAMPLE_PAYLOADS[arg] || SAMPLE_PAYLOADS.completed;
    signature = generateWebhookSignature(payload, SECRET);
    console.log(`📨 Event Type: ${payload.event}`);
    console.log(`🔐 Generated Signature: ${signature}`);
  }

  console.log(`\n📦 Request Body:\n${JSON.stringify(payload, null, 2)}\n`);

  const startTime = Date.now();

  try {
    const response = await fetch(TARGET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "User-Agent": "PesaJet-Webhook-Delivery/1.0",
      },
      body: JSON.stringify(payload),
    });

    const duration = Date.now() - startTime;
    const responseText = await response.text();
    let responseJson;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = responseText;
    }

    console.log(`⏱️ Response Time: ${duration}ms`);
    console.log(`📊 HTTP Status: ${response.status} ${response.statusText}`);
    console.log(`📬 Response Body:\n`, responseJson);

    if (response.ok) {
      console.log(`\n✅ Webhook simulated and acknowledged successfully!`);
    } else {
      console.log(
        `\n⚠️ Webhook rejected with HTTP ${response.status} as expected for invalid request.`,
      );
    }
  } catch (error: any) {
    console.error(`\n❌ Failed to connect to ${TARGET_URL}`);
    console.error(`   Error: ${error.message}`);
    console.error(
      `   Is your webhook server running? (Try running: pnpm dev in another terminal)`,
    );
  }

  console.log(
    `=================================================================\n`,
  );
}

runSimulator();
