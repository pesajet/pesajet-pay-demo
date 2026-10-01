#!/usr/bin/env bash
# PesaJet Integration Example: cURL CLI

PESAJET_API_KEY="${PESAJET_API_KEY:-pk_live_your_api_key_here}"
PESAJET_BASE_URL="${PESAJET_API_BASE_URL:-http://localhost:3000/api/v1}"

echo "🚀 Initiating PesaJet Mobile Money Payment Prompt..."

curl -X POST "${PESAJET_BASE_URL}/payments" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${PESAJET_API_KEY}" \
  -d '{
    "type": "COLLECTION",
    "amount": 20000,
    "currency": "UGX",
    "phoneNumber": "+256771234567",
    "provider": "mtn",
    "reference": "CURL-ORDER-001",
    "description": "Terminal CLI Purchase",
    "metadata": {
      "source": "curl_script"
    }
  }'

echo ""

