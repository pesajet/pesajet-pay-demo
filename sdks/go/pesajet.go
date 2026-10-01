package pesajet

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
)

type Client struct {
	ApiKey     string
	BaseURL    string
	HTTPClient *http.Client
}

type PaymentParams struct {
	Type           string                 `json:"type,omitempty"`
	Amount         float64                `json:"amount"`
	Currency       string                 `json:"currency,omitempty"`
	PhoneNumber    string                 `json:"phoneNumber"`
	Provider       string                 `json:"provider,omitempty"`
	Reference      string                 `json:"reference"`
	Description    string                 `json:"description,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
	IdempotencyKey string                 `json:"-"`
}

type Transaction struct {
	TransactionId     string                 `json:"transactionId"`
	ProviderReference string                 `json:"providerReference,omitempty"`
	Type              string                 `json:"type"`
	Amount            float64                `json:"amount"`
	Currency          string                 `json:"currency"`
	Status            string                 `json:"status"`
	Provider          string                 `json:"provider"`
	PhoneNumber       string                 `json:"phoneNumber"`
	Reference         string                 `json:"reference"`
	Description       string                 `json:"description,omitempty"`
	FailureReason     string                 `json:"failureReason,omitempty"`
	Metadata          map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt         string                 `json:"createdAt"`
}

func NewClient(apiKey string) *Client {
	return &Client{
		ApiKey:  apiKey,
		BaseURL: "https://api.pesajet.com/v1",
		BaseURL: "https://payments.pesajet.com/api/v1",
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) CreatePayment(params PaymentParams) (*Transaction, error) {
	if params.Type == "" {
		params.Type = "COLLECTION"
	}
	if params.Currency == "" {
		params.Currency = "UGX"
	}

	body, err := json.Marshal(params)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", fmt.Sprintf("%s/payments", strings.TrimRight(c.BaseURL, "/")), bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", c.ApiKey)
	if params.IdempotencyKey != "" {
		req.Header.Set("Idempotency-Key", params.IdempotencyKey)
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("pesajet API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var txn Transaction
	if err := json.Unmarshal(respBody, &txn); err != nil {
		return nil, err
	}

	return &txn, nil
}

func (c *Client) GetPayment(transactionId string) (*Transaction, error) {
	url := fmt.Sprintf("%s/payments/%s", strings.TrimRight(c.BaseURL, "/"), transactionId)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("X-API-Key", c.ApiKey)
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("pesajet API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var txn Transaction
	if err := json.Unmarshal(respBody, &txn); err != nil {
		return nil, err
	}

	return &txn, nil
}

// DetectProvider detects carrier network from a Ugandan phone number.
// Note: 079 is MTN. 073 cuts across both MTN and Airtel networks, so returns ""
// and the caller must explicitly provide the provider.
func DetectProvider(phoneNumber string) string {
	cleaned := strings.ReplaceAll(phoneNumber, " ", "")
	cleaned = strings.ReplaceAll(cleaned, "-", "")
	cleaned = strings.ReplaceAll(cleaned, "+", "")

	mtnPattern := regexp.MustCompile(`^(256|0)?(77|78|76|79|39)\d{7}$`)
	airtelPattern := regexp.MustCompile(`^(256|0)?(70|75|74)\d{7}$`)

	if mtnPattern.MatchString(cleaned) {
		return "mtn"
	}
	if airtelPattern.MatchString(cleaned) {
		return "airtel"
	}
	return ""
}

// FormatPhoneNumber formats phone number to standard E.164 (+256...)
func FormatPhoneNumber(phoneNumber string) string {
	cleaned := strings.ReplaceAll(phoneNumber, " ", "")
	cleaned = strings.ReplaceAll(cleaned, "-", "")
	if strings.HasPrefix(cleaned, "0") {
		return "+256" + cleaned[1:]
	} else if strings.HasPrefix(cleaned, "256") {
		return "+" + cleaned
	} else if !strings.HasPrefix(cleaned, "+") {
		return "+" + cleaned
	}
	return cleaned
}


