package pesajet

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
)

type WebhookPayload struct {
	Event             string                 `json:"event"`
	TransactionId     string                 `json:"transactionId,omitempty"`
	ProviderReference string                 `json:"providerReference,omitempty"`
	Amount            float64                `json:"amount,omitempty"`
	Currency          string                 `json:"currency,omitempty"`
	Status            string                 `json:"status,omitempty"`
	Provider          string                 `json:"provider,omitempty"`
	Reference         string                 `json:"reference,omitempty"`
	FailureReason     string                 `json:"failureReason,omitempty"`
	Timestamp         string                 `json:"timestamp"`
	Signature         string                 `json:"signature,omitempty"`
	Metadata          map[string]interface{} `json:"metadata,omitempty"`
}

// VerifyWebhookSignature verifies HMAC-SHA256 signature against raw JSON payload
func VerifyWebhookSignature(rawBody []byte, signature, secret string) (bool, error) {
	if secret == "" {
		return false, errors.New("webhook signing secret cannot be empty")
	}

	var data map[string]interface{}
	if err := json.Unmarshal(rawBody, &data); err != nil {
		return false, err
	}

	if signature == "" {
		if sig, ok := data["signature"].(string); ok {
			signature = sig
		}
	}
	delete(data, "signature")

	cleanBytes, err := json.Marshal(data)
	if err != nil {
		return false, err
	}

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(cleanBytes)
	expectedSig := hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(expectedSig), []byte(signature)), nil
}

