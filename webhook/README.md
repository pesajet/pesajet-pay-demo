# 🚀 PesaJet Webhook Integration Reference & Demo

This repository is the official reference implementation and developer guide for receiving, verifying, and processing **PesaJet Payment Webhooks** in real-time.

---

## 📖 Overview

PesaJet dispatches real-time HTTPS `POST` notifications to your configured webhook URL whenever a transaction's lifecycle status updates (e.g. mobile money collection completes, payment fails, or prompt expires).

Every webhook request from PesaJet is signed with an **HMAC-SHA256** cryptographic signature computed using your secret signing key, allowing your server to verify authenticity and prevent tampering or spoofing.

---

## ⚡ Quick Start

### 1. Clone & Install Dependencies

```bash
# Using pnpm
pnpm install

# Using npm
npm install
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Set your webhook secret in `.env`:

```env
PORT=3000
PESAJET_WEBHOOK_SECRET=whsec_your_actual_signing_secret
```

> 💡 **Where to find your secret:**
> Log in to your [PesaJet Merchant Dashboard](https://dashboard.pesajet.com) $\rightarrow$ **API & Webhooks** $\rightarrow$ **Webhook Signing Secret**.

### 3. Start the Webhook Server

```bash
pnpm dev
# or
pnpm start
```

The server will listen at `http://localhost:3000/webhook`.

---

## 🧪 Testing Locally (No Tunnel Needed)

This demo comes with a built-in CLI **Webhook Simulator** that generates realistic, signed PesaJet payloads and dispatches them directly to your local server.

In a second terminal window, run:

```bash
# Simulate a successful customer payment (payment.completed)
pnpm simulate completed

# Simulate a failed payment / cancelled USSD prompt (payment.failed)
pnpm simulate failed

# Simulate an expired payment prompt (payment.expired)
pnpm simulate expired

# Simulate an admin dashboard diagnostic ping (webhook.test)
pnpm simulate test

# Test security: verify that invalid signatures are rejected with HTTP 401
pnpm simulate invalid
```

---

## 🌐 Exposing Localhost to the Internet

When testing live transactions from sandbox or production, expose your local webhook server using a tunneling tool:

### Using Cloudflare Tunnels (Recommended)

```bash
cloudflared tunnel --url http://localhost:3000
```

### Using Ngrok

```bash
ngrok http 3000
```

Copy your HTTPS tunnel URL (e.g. `https://random-id.ngrok-free.app/webhook`) and save it in your **PesaJet Merchant Dashboard** under **Webhook Settings**.

---

## 📦 Webhook Payload Specification

### Headers

| Header                | Description                       | Example                        |
| :-------------------- | :-------------------------------- | :----------------------------- |
| `Content-Type`        | Payload serialization format      | `application/json`             |
| `X-Webhook-Signature` | Hex-encoded HMAC-SHA256 signature | `a7f9b8c0d1e2f3...`            |
| `User-Agent`          | Delivery agent identifier         | `PesaJet-Webhook-Delivery/1.0` |

### JSON Schema

```json
{
  "event": "payment.completed",
  "transactionId": "txn_01j8f2k9x7a1b3c5",
  "status": "COMPLETED",
  "amount": 50000,
  "currency": "UGX",
  "provider": "MTN",
  "reference": "ORD-98231",
  "providerReference": "MOMO-1982739182",
  "failureReason": null,
  "metadata": {
    "orderId": "ORD-98231",
    "customerEmail": "customer@example.com"
  },
  "timestamp": "2026-08-28T18:30:00.000Z"
}
```

### Supported Event Types

| Event               | Trigger Condition                                  | Recommended Merchant Action                           |
| :------------------ | :------------------------------------------------- | :---------------------------------------------------- |
| `payment.completed` | Mobile money PIN entered and funds collected       | Fulfill order, mark invoice PAID, deliver goods       |
| `payment.failed`    | Payer cancelled prompt or insufficient balance     | Mark checkout failed, notify customer with retry link |
| `payment.expired`   | USSD push prompt timed out without customer action | Release reserved stock / cancel abandoned order       |
| `webhook.test`      | Triggered via Dashboard / Admin diagnostic tool    | Acknowledge ping (returns `200 OK`)                   |

---

## 🔐 Signature Verification (Multi-Language)

Always verify the `X-Webhook-Signature` header before processing webhook data.

### TypeScript / Node.js

```typescript
import crypto from "node:crypto";

export function verifySignature(
  payload: string | object,
  signature: string,
  secret: string,
): boolean {
  const payloadString =
    typeof payload === "string" ? payload : JSON.stringify(payload);
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payloadString)
    .digest("hex");

  const sigBuf = Buffer.from(signature, "utf8");
  const expBuf = Buffer.from(expected, "utf8");

  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}
```

### Python

```python
import hmac
import hashlib
import json

def verify_pesajet_webhook(payload, signature: str, secret: str) -> bool:
    payload_bytes = payload if isinstance(payload, bytes) else json.dumps(payload, separators=(',', ':')).encode('utf-8')
    expected = hmac.new(secret.encode('utf-8'), payload_bytes, hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, expected)
```

### PHP

```php
function verifyPesaJetWebhook(string $rawBody, string $signature, string $secret): bool {
    $expected = hash_hmac('sha256', $rawBody, $secret);
    return hash_equals($expected, $signature);
}
```

### Go

```go
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
)

func VerifyPesaJetSignature(rawPayload []byte, signature string, secret string) bool {
    mac := hmac.New(sha256.New, []byte(secret))
    mac.Write(rawPayload)
    expected := hex.EncodeToString(mac.Sum(nil))
    return hmac.Equal([]byte(expected), []byte(signature))
}
```

---

## 🛡️ Production Best Practices

1. **Respond Quickly ($< 5\text{s}$)**: Always return an HTTP `200 OK` response immediately upon validating the signature. If your business logic entails long tasks (e.g. PDF generation, sending emails), push them to a background worker / queue (e.g. BullMQ, Celery, SQS).
2. **Handle Idempotency**: Webhooks may occasionally be retried due to network glitches. Store processed `transactionId`s in your database or cache to avoid processing the same payment twice.
3. **Use HTTPS**: Always use SSL/TLS encryption for your webhook endpoint in production.
4. **Retry Schedule**: PesaJet automatically retries failed deliveries (HTTP $4\text{xx}/5\text{xx}$ or network timeouts) with exponential backoff:
   - 1st Retry: 1 minute
   - 2nd Retry: 5 minutes
   - 3rd Retry: 15 minutes
   - 4th Retry: 1 hour
   - 5th Retry: 4 hours (up to 24 hours total)

---

## 📁 Repository Structure

```
.
├── index.ts              # Application bootstrap & port listener
├── package.json          # Project scripts and dependencies
├── tsconfig.json         # TypeScript compiler configuration
├── .env.example          # Environment variable template
├── .gitignore            # Git exclusion rules
├── src/
│   ├── types.ts          # Complete TypeScript types for payloads & events
│   ├── verify.ts         # HMAC-SHA256 signature verification engine
│   ├── handlers.ts       # Domain handlers for completed/failed/expired events
│   ├── server.ts         # Express server & middleware pipeline
│   └── simulate.ts       # Interactive local CLI webhook simulator
└── README.md             # Integration & architecture guide
```

---

## 📄 License

MIT License. Feel free to use this demo code in your commercial projects.
