# pesajet-php (PHP SDK)

Official PHP SDK for **PesaJet Pay**.

---

## 📦 Installation

```bash
composer require pesajet/pesajet-php
```

---

## 🚀 Quickstart

### 1. Initialize Client

```php
use PesaJet\PesaJet;

$pesajet = new PesaJet([
    'apiKey' => getenv('PESAJET_API_KEY'),
    'webhookSecret' => getenv('PESAJET_WEBHOOK_SECRET'), // optional
]);
```

---

### 2. Initiate Payment Collection Prompt

```php
$payment = $pesajet->payments->create([
    'amount' => 25000,
    'currency' => 'UGX',
    'phoneNumber' => '+256771234567',
    'provider' => 'mtn',
    'reference' => 'ORD-PHP-1002',
    'description' => 'PHP Order Checkout',
]);

echo "Transaction ID: " . $payment['transactionId'] . "\n";
echo "Status: " . $payment['status'] . "\n";
```

---

### 3. Verify Webhook (Vanilla PHP / Laravel)

```php
$signature = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '';
$rawBody = file_get_contents('php://input');

$isValid = $pesajet->webhooks->verify($rawBody, $signature);
if (!$isValid) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

$payload = json_decode($rawBody, true);
if ($payload['event'] === 'payment.completed') {
    // Fulfill order
}

http_response_code(200);
echo json_encode(['received' => true]);
```
