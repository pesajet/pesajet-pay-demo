/**
 * CLI Runner: Initiate Mobile Money Collection (MTN / Airtel)
 *
 * Usage:
 * pnpm collect:mtn [amount] [phone]
 * pnpm collect:airtel [amount] [phone]
 */

import { PesaJet } from "../pesajet";
import type { Provider } from "../types";

const API_KEY = process.env.PESAJET_API_KEY || "pk_test_demo";
const BASE_URL =
  process.env.PESAJET_API_BASE_URL || "http://localhost:3000/api/v1";

const providerArg = (process.argv[2] || "mtn").toLowerCase() as Provider;
const amountArg = Number(process.argv[3]) || 10000;
const phoneArg =
  process.argv[4] ||
  (providerArg === "airtel" ? "+256701234567" : "+256771234567");

async function main() {
  console.log("\n=======================================================");
  console.log("🚀 PesaJet Payments CLI: Mobile Money Collection");
  console.log("=======================================================");
  console.log(`🌐 Base URL:   ${BASE_URL}`);
  console.log(`🔑 API Key:    ${API_KEY.slice(0, 10)}...`);
  console.log(`📱 Provider:   ${providerArg.toUpperCase()}`);
  console.log(`💰 Amount:     UGX ${amountArg.toLocaleString()}`);
  console.log(`📞 Phone:      ${phoneArg}`);

  const pesajet = new PesaJet({
    apiKey: API_KEY,
    baseUrl: BASE_URL,
  });

  try {
    console.log("\n⏳ 1. Requesting fee preview...");
    try {
      const preview = await pesajet.payments.preview({
        amount: amountArg,
        provider: providerArg,
        type: "COLLECTION",
      });
      console.log(
        `   Estimated Platform Fee: UGX ${preview.platformFee.toLocaleString()}`,
      );
      console.log(
        `   Net Merchant Credit:   UGX ${preview.netAmount.toLocaleString()}`,
      );
    } catch {
      console.log("   (Fee preview skipped)");
    }

    console.log("\n⏳ 2. Initiating collection request (USSD Push)...");
    const orderRef = `CLI-ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const transaction = await pesajet.payments.create({
      type: "COLLECTION",
      amount: amountArg,
      currency: "UGX",
      phoneNumber: phoneArg,
      provider: providerArg,
      reference: orderRef,
      description: `CLI Test Collection for ${orderRef}`,
      metadata: {
        channel: "CLI",
        initiatedAt: new Date().toISOString(),
      },
    });

    console.log("\n✅ Payment Initiated Successfully!");
    console.log("-------------------------------------------------------");
    console.log(`🆔 Transaction ID:    ${transaction.transactionId}`);
    console.log(`📊 Status:            ${transaction.status}`);
    console.log(`📑 Order Reference:   ${transaction.reference}`);
    console.log(`📅 Created At:        ${transaction.createdAt}`);
    console.log("-------------------------------------------------------");
    console.log(
      `💡 The customer's handset (${phoneArg}) has been prompted for their Mobile Money PIN.`,
    );

    console.log(
      "\n⏳ 3. Polling live transaction status (Press Ctrl+C to exit)...",
    );
    let pollCount = 0;
    const finalTxn = await pesajet.payments.pollUntilComplete(
      transaction.transactionId,
      {
        maxAttempts: 15,
        intervalMs: 2000,
        onPoll: (t) => {
          pollCount++;
          process.stdout.write(
            `   [Poll #${pollCount}] Status: ${t.status}...\r`,
          );
        },
      },
    );

    console.log(`\n\n🎯 Final Transaction Status: ${finalTxn.status}`);
    if (finalTxn.status === "COMPLETED") {
      console.log("🎉 Payment completed successfully! Funds credited.");
    } else if (finalTxn.status === "FAILED") {
      console.log(
        `❌ Payment failed. Reason: ${finalTxn.failureReason || "Declined by user"}`,
      );
    }
  } catch (error: any) {
    console.error(`\n❌ Error initiating payment: ${error.message}`);
    if (error.statusCode)
      console.error(`   HTTP Status: ${error.statusCode} (${error.errorCode})`);
  }

  console.log("=======================================================\n");
}

main();
