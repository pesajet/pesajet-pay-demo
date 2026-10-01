/**
 * PesaJet Integration Example: Node.js / Express
 *
 * Demonstrates:
 * 1. Initiating a mobile money payment prompt
 * 2. Querying transaction status
 */

const API_KEY = process.env.PESAJET_API_KEY || "pk_live_your_api_key_here";
const BASE_URL = "http://localhost:3000/api/v1";

async function collectPayment() {
  const paymentPayload = {
    type: "COLLECTION",
    amount: 25000,
    currency: "UGX",
    phoneNumber: "+256771234567",
    provider: "mtn", // or "airtel"
    reference: `ORD-${Date.now()}`,
    description: "Annual Subscription - Pro Plan",
    metadata: {
      customerId: "user_8821",
      customerEmail: "sarah@company.com",
    },
  };

  console.log("Initiating PesaJet payment...");

  const response = await fetch(`${BASE_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify(paymentPayload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Payment initiation failed:", data);
    return;
  }

  console.log("✅ Payment Initiated successfully!");
  console.log("Transaction ID:", data.transactionId);
  console.log("Status:", data.status);
  console.log("Customer phone prompted for PIN.");

  // Later, query status if needed:
  // const statusRes = await fetch(`${BASE_URL}/payments/${data.transactionId}`, {
  //   headers: { "X-API-Key": API_KEY },
  // });
  // const statusData = await statusRes.json();
  // console.log("Updated status:", statusData.status);
}

collectPayment();
