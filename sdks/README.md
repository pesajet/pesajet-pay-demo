# 🛠️ PesaJet Official SDKs & Client Libraries

Welcome to the official **PesaJet Pay** SDK repository. These libraries provide lightweight, plug-and-play, type-safe clients for accepting Mobile Money collections (**MTN MoMo** & **Airtel Money**), dispatching payouts/disbursements, calculating fees, and verifying cryptographic webhook signatures.

---

## 📚 Supported Languages & Frameworks

| Language                 | Directory                  | Key Capabilities                                                       | Status    |
| :----------------------- | :------------------------- | :--------------------------------------------------------------------- | :-------- |
| **Node.js / TypeScript** | [`sdks/nodejs/`](./nodejs) | Full TS Types, Collections, Payouts, Webhook Verifier, Polling Helpers | 🟢 Stable |
| **Python**               | [`sdks/python/`](./python) | Python 3.8+, requests, HMAC signature verification, PyPI ready         | 🟢 Stable |
| **PHP**                  | [`sdks/php/`](./php)       | PHP 7.4+ & 8.x, Composer support, Webhook validator                    | 🟢 Stable |
| **Go**                   | [`sdks/go/`](./go)         | Go 1.18+, Standard library `crypto/hmac`, Zero external dependencies   | 🟢 Stable |

---

## ⚡ Quick Comparison

### Node.js / TypeScript

```typescript
import { PesaJet } from "@pesajet/sdk";

const pesajet = new PesaJet({ apiKey: "pk_live_..." });
const payment = await pesajet.payments.create({
  amount: 20000,
  phoneNumber: "+256771234567",
  provider: "mtn",
  reference: "ORD-101",
});
```

### Python

```python
from pesajet import PesaJet

client = PesaJet(api_key="pk_live_...")
payment = client.payments.create(
    amount=20000,
    phone_number="+256771234567",
    provider="mtn",
    reference="ORD-101",
)
```

### PHP

```php
use PesaJet\PesaJet;

$pesajet = new PesaJet(['apiKey' => 'pk_live_...']);
$payment = $pesajet->payments->create([
    'amount' => 20000,
    'phoneNumber' => '+256771234567',
    'provider' => 'mtn',
    'reference' => 'ORD-101',
]);
```

### Go

```go
import pesajet "github.com/pesajet/pesajet-pay-demo/sdks/go"

client := pesajet.NewClient("pk_live_...")
payment, err := client.CreatePayment(pesajet.PaymentParams{
    Amount:      20000,
    PhoneNumber: "+256771234567",
    Provider:    "mtn",
    Reference:   "ORD-101",
})
```
