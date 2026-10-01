/**
 * CLI Runner: Query Transaction Status
 *
 * Usage:
 * pnpm status <transactionId>
 */

import { PesaJet } from "../pesajet";

const API_KEY = process.env.PESAJET_API_KEY || "pk_test_demo";
const BASE_URL =
  process.env.PESAJET_API_BASE_URL || "http://localhost:3000/api/v1";

const transactionIdArg = process.argv[2];

async function main() {
  console.log("\n=======================================================");
  console.log("🔍 PesaJet Payments CLI: Transaction Status Inquiry");
  console.log("=======================================================");

  const pesajet = new PesaJet({
    apiKey: API_KEY,
    baseUrl: BASE_URL,
  });

  if (!transactionIdArg) {
    console.log("\n📋 Fetching latest 5 transactions for account...");
    try {
      const list = await pesajet.payments.list({ limit: 5 });
      console.log(`Found ${list.pagination.total} total transactions:\n`);
      list.data.forEach((tx) => {
        console.log(`• [${tx.status}] ID: ${tx.transactionId}`);
        console.log(
          `  Amount: ${tx.amount} ${tx.currency} | Provider: ${tx.provider} | Phone: ${tx.phoneNumber}`,
        );
        console.log(`  Ref: ${tx.reference} | Date: ${tx.createdAt}\n`);
      });
      console.log(
        "Tip: Run `pnpm status <transactionId>` to inspect a specific record.",
      );
    } catch (err: any) {
      console.error(`❌ Failed to list transactions: ${err.message}`);
    }
    return;
  }

  console.log(`🔎 Inquiring on Transaction: ${transactionIdArg}\n`);
  try {
    const txn = await pesajet.payments.get(transactionIdArg);
    console.log("-------------------------------------------------------");
    console.log(`🆔 Transaction ID:     ${txn.transactionId}`);
    console.log(`📊 Current Status:      ${txn.status}`);
    console.log(`💰 Amount:             ${txn.amount} ${txn.currency}`);
    console.log(`📞 Customer Phone:     ${txn.phoneNumber}`);
    console.log(`📱 Telecom Gateway:    ${txn.provider?.toUpperCase()}`);
    console.log(`📑 Order Reference:    ${txn.reference}`);
    console.log(
      `⚡ Telecom Reference:  ${txn.providerReference || "Pending carrier generation"}`,
    );
    if (txn.failureReason) {
      console.log(`⚠️ Failure Reason:     ${txn.failureReason}`);
    }
    console.log(`📅 Created At:         ${txn.createdAt}`);
    console.log(`🏁 Completed At:       ${txn.completedAt || "Pending"}`);
    console.log("-------------------------------------------------------");
  } catch (err: any) {
    console.error(`❌ Failed to retrieve transaction: ${err.message}`);
  }

  console.log("=======================================================\n");
}

main();
