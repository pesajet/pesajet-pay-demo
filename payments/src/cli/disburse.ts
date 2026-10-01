/**
 * CLI Runner: Initiate Mobile Money Payout / Disbursement
 *
 * Usage:
 * pnpm disburse [amount] [phone] [provider]
 */

import { PesaJet } from "../pesajet";
import type { Provider } from "../types";

const API_KEY = process.env.PESAJET_API_KEY || "pk_test_demo";
const BASE_URL =
  process.env.PESAJET_API_BASE_URL || "http://localhost:3000/api/v1";

const amountArg = Number(process.argv[2]) || 25000;
const phoneArg = process.argv[3] || "+256771234567";
const providerArg = (process.argv[4] || "mtn").toLowerCase() as Provider;

async function main() {
  console.log("\n=======================================================");
  console.log("💸 PesaJet Payments CLI: Mobile Money Disbursement / Payout");
  console.log("=======================================================");
  console.log(`🌐 Base URL:   ${BASE_URL}`);
  console.log(`🔑 API Key:    ${API_KEY.slice(0, 10)}...`);
  console.log(`💰 Amount:     UGX ${amountArg.toLocaleString()}`);
  console.log(`📞 Recipient:  ${phoneArg} (${providerArg.toUpperCase()})`);

  const pesajet = new PesaJet({
    apiKey: API_KEY,
    baseUrl: BASE_URL,
  });

  try {
    console.log("\n⏳ 1. Requesting fee calculation for payout...");
    try {
      const preview = await pesajet.payments.preview({
        amount: amountArg,
        provider: providerArg,
        type: "DISBURSEMENT",
      });
      console.log(
        `   Disbursement Fee:    UGX ${preview.totalFee.toLocaleString()}`,
      );
      console.log(
        `   Total Wallet Deduct: UGX ${preview.totalCost.toLocaleString()}`,
      );
    } catch {
      console.log("   (Fee preview skipped)");
    }

    console.log("\n⏳ 2. Dispatching disbursement request...");
    const payoutRef = `PAYOUT-${Math.floor(100000 + Math.random() * 900000)}`;

    const transaction = await pesajet.payments.create({
      type: "DISBURSEMENT",
      amount: amountArg,
      currency: "UGX",
      phoneNumber: phoneArg,
      provider: providerArg,
      reference: payoutRef,
      description: `Disbursement transfer ${payoutRef}`,
    });

    console.log("\n✅ Disbursement Dispatched!");
    console.log("-------------------------------------------------------");
    console.log(`🆔 Transaction ID:  ${transaction.transactionId}`);
    console.log(`📊 Status:          ${transaction.status}`);
    console.log(`📑 Reference:       ${transaction.reference}`);
    console.log("-------------------------------------------------------");
  } catch (error: any) {
    console.error(`\n❌ Error initiating disbursement: ${error.message}`);
    if (error.statusCode)
      console.error(`   HTTP Status: ${error.statusCode} (${error.errorCode})`);
  }

  console.log("=======================================================\n");
}

main();
