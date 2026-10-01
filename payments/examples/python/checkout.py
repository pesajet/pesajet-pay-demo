"""
PesaJet Integration Example: Python (requests)

Demonstrates:
1. Initiating a mobile money payment prompt
2. Checking payment status
"""

import os
import requests

API_KEY = os.getenv("PESAJET_API_KEY", "pk_live_your_api_key_here")
BASE_URL = "http://localhost:3000/api/v1"

headers = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
}

def initiate_payment():
    payload = {
        "type": "COLLECTION",
        "amount": 50000,
        "currency": "UGX",
        "phoneNumber": "+256701234567",
        "provider": "airtel",
        "reference": "ORDER-PY-1002",
        "description": "Store Purchase #1002",
        "metadata": {
            "cartId": "cart_9912"
        }
    }

    print("Initiating PesaJet payment in Python...")
    response = requests.post(f"{BASE_URL}/payments", json=payload, headers=headers)
    data = response.json()

    if response.status_code != 201:
        print(f"Payment initiation failed: {data}")
        return

    print("✅ Payment Initiated!")
    print(f"Transaction ID: {data.get('transactionId')}")
    print(f"Status: {data.get('status')}")

def check_status(transaction_id):
    response = requests.get(f"{BASE_URL}/payments/{transaction_id}", headers=headers)
    data = response.json()
    print(f"Transaction Status: {data.get('status')}")
    return data

if __name__ == "__main__":
    initiate_payment()

