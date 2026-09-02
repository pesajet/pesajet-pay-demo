# @pesajet/sdk (Node.js & TypeScript)

Official Node.js and TypeScript SDK for **PesaJet Pay**.

---

## 📦 Installation

```bash
npm install @pesajet/sdk
# or
pnpm add @pesajet/sdk
```

---

## 🚀 Quickstart

### 1. Initialize Client

```typescript
import { PesaJet } from "@pesajet/sdk";

const pesajet = new PesaJet({
  apiKey: process.env.PESAJET_API_KEY!,
  webhookSecret: process.env.PESAJET_WEBHOOK_SECRET, // optional, for webhook verification
});
```

---

### 2. Initiate Mobile Money Payment Prompt

```typescript
const payment = await pesajet.payments.create({
  amount: 25000,
  currency: "UGX",
  phoneNumber: "+256771234567",
  provider: "mtn", // "mtn" | "airtel"
  reference: "INV-2026-001",
  description: "E-Commerce Checkout",
});

console.log("Transaction ID:", payment.transactionId);
console.log("Status:", payment.status); // PENDING
```

---

### 3. Verify Webhooks (Express Example)

```typescript
import express from "express";

const app = express();

app.post("/webhook", express.json(), (req, res) => {
  const signature = req.headers["x-webhook-signature"] as string;

  // Cryptographically verify HMAC-SHA256 signature
  const isValid = pesajet.webhooks.verify(req.body, signature);

  if (!isValid) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const { event, transactionId, status, amount } = req.body;
  if (event === "payment.completed") {
    console.log(`Payment ${transactionId} succeeded for UGX ${amount}`);
  }

  res.json({ received: true });
});
```

---

### 4. Send Payouts / Disbursements

```typescript
const payout = await pesajet.payments.create({
  type: "DISBURSEMENT",
  amount: 50000,
  currency: "UGX",
  phoneNumber: "+256701234567",
  provider: "airtel",
  reference: "PAYOUT-8891",
  description: "Affiliate commission",
});
```
