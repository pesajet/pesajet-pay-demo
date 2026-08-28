import type { PesaJetWebhookPayload } from "./types.ts";

// In-memory idempotency store to prevent duplicate processing if PesaJet retries a delivery.
// In production, replace this with your database or Redis (e.g. redis.set(`webhook:${txnId}`, '1', 'EX', 86400, 'NX')).
const processedTransactions = new Set<string>();

/**
 * Handle successful payment collection or disbursement
 */
export async function handlePaymentCompleted(
  payload: PesaJetWebhookPayload,
): Promise<void> {
  console.log(
    `\n🎉 [EVENT: payment.completed] Transaction ${payload.transactionId} SUCCEEDED`,
  );
  console.log(
    `   Amount: ${payload.currency} ${payload.amount.toLocaleString()}`,
  );
  console.log(
    `   Provider: ${payload.provider} (Ref: ${payload.providerReference || "N/A"})`,
  );
  console.log(`   Merchant Order Reference: ${payload.reference}`);
  if (payload.metadata) {
    console.log(`   Metadata:`, JSON.stringify(payload.metadata));
  }

  // --- Real-world Merchant Actions ---
  // 1. Mark order as PAID in your database:
  //    await db.orders.update({ where: { orderId: payload.reference }, data: { status: 'PAID' } });
  // 2. Deliver digital goods or trigger warehouse fulfillment.
  // 3. Dispatch customer receipt email / SMS confirmation.
}

/**
 * Handle failed payment attempt
 */
export async function handlePaymentFailed(
  payload: PesaJetWebhookPayload,
): Promise<void> {
  console.log(
    `\n❌ [EVENT: payment.failed] Transaction ${payload.transactionId} FAILED`,
  );
  console.log(
    `   Amount: ${payload.currency} ${payload.amount.toLocaleString()}`,
  );
  console.log(
    `   Reason: ${payload.failureReason || "User declined or insufficient balance"}`,
  );
  console.log(`   Merchant Order Reference: ${payload.reference}`);

  // --- Real-world Merchant Actions ---
  // 1. Update order status to PAYMENT_FAILED in database.
  // 2. Restore reserved items to inventory if necessary.
  // 3. Notify customer with payment retry link.
}

/**
 * Handle expired payment request (USSD prompt timed out without customer PIN)
 */
export async function handlePaymentExpired(
  payload: PesaJetWebhookPayload,
): Promise<void> {
  console.log(
    `\n⏳ [EVENT: payment.expired] Transaction ${payload.transactionId} EXPIRED`,
  );
  console.log(`   Merchant Order Reference: ${payload.reference}`);

  // --- Real-world Merchant Actions ---
  // 1. Release held reservations or release abandoned checkout sessions.
}

/**
 * Handle live diagnostic test webhook ping from PesaJet Merchant Dashboard or Admin Portal
 */
export async function handleWebhookTest(
  payload: PesaJetWebhookPayload,
): Promise<void> {
  console.log(
    `\n🔍 [EVENT: webhook.test] Diagnostic Ping Received from PesaJet`,
  );
  console.log(`   Transaction ID: ${payload.transactionId}`);
  console.log(`   Timestamp: ${payload.timestamp}`);
}

/**
 * Main Webhook Event Dispatcher
 */
export async function processWebhookEvent(
  payload: PesaJetWebhookPayload,
): Promise<{ processed: boolean; duplicate?: boolean }> {
  const eventKey = `${payload.event}:${payload.transactionId}`;

  // Check idempotency (skip duplicate processing if already handled)
  if (payload.event !== "webhook.test" && processedTransactions.has(eventKey)) {
    console.log(
      `ℹ️ [IDEMPOTENCY] Transaction ${payload.transactionId} already processed. Skipping duplicate handler.`,
    );
    return { processed: true, duplicate: true };
  }

  // Route event to corresponding business handler
  switch (payload.event) {
    case "payment.completed":
      await handlePaymentCompleted(payload);
      break;

    case "payment.failed":
      await handlePaymentFailed(payload);
      break;

    case "payment.expired":
      await handlePaymentExpired(payload);
      break;

    case "webhook.test":
      await handleWebhookTest(payload);
      break;

    default:
      console.warn(
        `⚠️ [WARNING] Unhandled webhook event type: ${(payload as any).event}`,
      );
      break;
  }

  // Record transaction key as processed
  if (payload.event !== "webhook.test") {
    processedTransactions.add(eventKey);
  }

  return { processed: true, duplicate: false };
}
