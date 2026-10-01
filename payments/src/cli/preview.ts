/**
 * CLI Runner: Calculate Fee Preview
 *
 * Usage:
 * pnpm preview [amount] [provider] [type]
 */

import { PesaJet } from "../pesajet";
import type { Provider, TransactionType } from "../types";

const API_KEY = process.env.PESAJET_API_KEY || "pk_test_demo";
const BASE_URL =
  process.env.PESAJET_API_BASE_URL || "http://localhost:3000/api/v1";

const amountArg = Number(process.argv[2]) || 50000;
const providerArg = (process.argv[3] || "mtn").toLowerCase() as Provider;
const typeArg = (
  process.argv[4] || "COLLECTION"
).toUpperCase() as TransactionType;

async function main() {
  console.log("\n=======================================================");
  console.log("🧮 PesaJet Payments CLI: Fee Preview & Net Breakdown");
  console.log("=======================================================");

  const pesajet = new PesaJet({
    apiKey: API_KEY,
    baseUrl: BASE_URL,
  });

  try {
    const preview = await pesajet.payments.preview({
      amount: amountArg,
      provider: providerArg,
      type: typeArg,
    });

    console.log(`📊 Transaction Type:   ${preview.type}`);
    console.log(`📱 Telecom Network:    ${preview.provider?.toUpperCase()}`);
    console.log(
      `💰 Base Amount:        UGX ${preview.amount.toLocaleString()}`,
    );
    console.log("-------------------------------------------------------");
    console.log(
      `🏷️ Platform Fee:       UGX ${preview.platformFee.toLocaleString()}`,
    );
    if (preview.providerFee) {
      console.log(
        `📡 Telecom Carrier Fee:UGX ${preview.providerFee.toLocaleString()}`,
      );
    }
    console.log(
      `💵 Total Deducted Fee: UGX ${preview.totalFee.toLocaleString()}`,
    );
    console.log("-------------------------------------------------------");
    if (preview.type === "COLLECTION") {
      console.log(
        `✅ Net Credited to Merchant: UGX ${preview.netAmount.toLocaleString()}`,
      );
    } else {
      console.log(
        `✅ Total Debited from Wallet: UGX ${preview.totalCost.toLocaleString()}`,
      );
    }
  } catch (err: any) {
    console.error(`❌ Fee preview calculation failed: ${err.message}`);
  }

  console.log("=======================================================\n");
}

main();
