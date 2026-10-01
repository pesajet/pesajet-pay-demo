/**
 * Automated Unit & Integration Self-Tests for PesaJet Payments SDK & Demo
 */

import { PesaJet, PesaJetError } from "./pesajet.ts";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ Passed: ${testName}`);
    passed++;
  } else {
    console.error(`❌ Failed: ${testName}${detail ? ` (${detail})` : ""}`);
    failed++;
  }
}

async function runTests() {
  console.log(
    "\n🧪 Starting PesaJet Payments SDK Unit & Integration Tests...\n",
  );

  // Test 1: SDK Initialization
  try {
    const pesajet = new PesaJet({ apiKey: "pk_test_sample_key_123" });
    assert(
      pesajet instanceof PesaJet,
      "SDK Client initializes successfully with valid config",
    );
  } catch (err: any) {
    assert(false, "SDK Client initializes successfully", err.message);
  }

  // Test 2: Missing API Key rejection
  try {
    new PesaJet({ apiKey: "" });
    assert(false, "SDK rejects missing API key");
  } catch (err: any) {
    assert(
      err instanceof PesaJetError,
      "SDK rejects missing API key with PesaJetError",
    );
  }

  // Test 3: Phone number carrier detection
  const pesajet = new PesaJet({ apiKey: "pk_test_key" });
  assert(
    pesajet.utils.detectProvider("+256771234567") === "mtn",
    "Auto-detects MTN numbers (077...)",
  );
  assert(
    pesajet.utils.detectProvider("0781234567") === "mtn",
    "Auto-detects MTN numbers (078...)",
  );
  assert(
    pesajet.utils.detectProvider("0791234567") === "mtn",
    "Auto-detects MTN numbers (079...)",
  );
  assert(
    pesajet.utils.detectProvider("+256701234567") === "airtel",
    "Auto-detects Airtel numbers (070...)",
  );
  assert(
    pesajet.utils.detectProvider("0751234567") === "airtel",
    "Auto-detects Airtel numbers (075...)",
  );
  assert(
    pesajet.utils.detectProvider("0731234567") === null,
    "Returns null for 073... (cuts across MTN and Airtel)",
  );
  assert(
    pesajet.utils.detectProvider("+254712345678") === null,
    "Returns null for unsupported international formats",
  );

  // Test 4: E.164 phone formatting
  assert(
    pesajet.utils.formatPhoneNumber("0771234567") === "+256771234567",
    "Formats local 077... to +25677...",
  );
  assert(
    pesajet.utils.formatPhoneNumber("256701234567") === "+256701234567",
    "Formats 25670... to +25670...",
  );
  assert(
    pesajet.utils.formatPhoneNumber("+256781234567") === "+256781234567",
    "Preserves existing +256 E.164",
  );

  // Test 5: Live API Connectivity & Error handling
  try {
    // Testing mock request handling
    const customClient = new PesaJet({
      apiKey: "pk_invalid_key_for_test",
      baseUrl: "http://127.0.0.1:9999/api/v1",
      timeoutMs: 1000,
    });
    await customClient.payments.get("txn_123");
    assert(false, "Handles connection failure gracefully");
  } catch (err: any) {
    assert(
      err instanceof PesaJetError,
      "Catches network/connection errors and wraps in PesaJetError",
    );
  }

  console.log(`\n=======================================================`);
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`=======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
