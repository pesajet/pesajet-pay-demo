# pesajet (Python SDK)

Official Python SDK for **PesaJet Pay**.

---

## 📦 Installation

```bash
pip install pesajet
```

---

## 🚀 Quickstart

### 1. Initialize Client

```python
import os
from pesajet import PesaJet

client = PesaJet(
    api_key=os.environ.get("PESAJET_API_KEY"),
    webhook_secret=os.environ.get("PESAJET_WEBHOOK_SECRET"),  # optional
)
```

---

### 2. Initiate Payment Collection Prompt

```python
payment = client.payments.create(
    amount=25000,
    phone_number="+256771234567",
    provider="mtn",  # "mtn" or "airtel"
    reference="ORD-PY-1002",
    description="Python store purchase",
)

print(f"Transaction ID: {payment['transactionId']}")
print(f"Status: {payment['status']}")  # PENDING
```

---

### 3. Verify Webhooks (Flask / Django / FastAPI)

#### Flask Example:

```python
from flask import Flask, request, jsonify
from pesajet import PesaJet, WebhookVerificationError

app = Flask(__name__)
pesajet = PesaJet(
    api_key="pk_live_...",
    webhook_secret="whsec_..."
)

@app.route("/webhook", methods=["POST"])
def handle_webhook():
    signature = request.headers.get("X-Webhook-Signature")
    raw_body = request.get_data(as_text=True)

    # Verify HMAC-SHA256 signature
    is_valid = pesajet.webhooks.verify(raw_body, signature=signature)
    if not is_valid:
        return jsonify({"error": "Signature mismatch"}), 401

    payload = request.get_json()
    if payload.get("event") == "payment.completed":
        print(f"Payment completed: {payload.get('transactionId')}")

    return jsonify({"received": True}), 200
```

Alternatively, use `construct_event` which verifies and parses in one call:

```python
try:
    event = pesajet.webhooks.construct_event(raw_body, signature=signature)
    if event.get("event") == "payment.completed":
        print(f"Payment completed: {event.get('transactionId')}")
except WebhookVerificationError:
    return jsonify({"error": "Invalid webhook signature"}), 401
```

---

## 🧪 Testing

Run the automated SDK unit tests:

```bash
python test.py
```
