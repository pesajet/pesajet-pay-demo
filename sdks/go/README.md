# pesajet-go (Go SDK)

Official Go SDK for **PesaJet Pay**.

---

## 📦 Installation

```bash
go get github.com/pesajet/pesajet-pay-demo/sdks/go
```

---

## 🚀 Quickstart

### 1. Initiate Collection
```go
package main

import (
	"fmt"
	"log"

	"github.com/pesajet/pesajet-pay-demo/sdks/go"
)

func main() {
	client := pesajet.NewClient("pk_live_your_api_key")

	payment, err := client.CreatePayment(pesajet.PaymentParams{
		Amount:      25000,
		PhoneNumber: "+256771234567",
		Provider:    "mtn",
		Reference:   "ORD-GO-001",
		Description: "Go payment order",
	})
	if err != nil {
		log.Fatalf("Error: %v", err)
	}

	fmt.Printf("Payment ID: %s, Status: %s\n", payment.TransactionId, payment.Status)
}
```

---

### 2. Verify Webhook Signature
```go
package main

import (
	"io"
	"net/http"

	"github.com/pesajet/pesajet-pay-demo/sdks/go"
)

func webhookHandler(w http.ResponseWriter, r *http.Request) {
	signature := r.Header.Get("X-Webhook-Signature")
	body, _ := io.ReadAll(r.Body)

	isValid, err := pesajet.VerifyWebhookSignature(body, signature, "whsec_your_secret")
	if err != nil || !isValid {
		http.Error(w, "Invalid signature", http.StatusUnauthorized)
		return
	}

	w.WriteHeader(http.StatusOK)
}
```
