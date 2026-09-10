#!/usr/bin/env python3
"""
PesaJet Python SDK Automated Unit Test Suite
Mirrors the official Node.js test suite with comprehensive assertions.
"""

import sys
import json
import hmac
import hashlib
from pesajet import PesaJet, PesaJetError, WebhookVerificationError

passed = 0
failed = 0


def assert_true(condition: bool, test_name: str, detail: str = ""):
    global passed, failed
    if condition:
        print(f"  ✅ Passed: {test_name}")
        passed += 1
    else:
        err_msg = f" ({detail})" if detail else ""
        print(f"  ❌ Failed: {test_name}{err_msg}")
        failed += 1


def run_tests():
    global passed, failed
    print("\n=======================================================")
    print("🧪 Testing pesajet (Python SDK Unit Test Suite)")
    print("=======================================================\n")

    # 1. Client Initialization Tests
    print("📦 1. Client Initialization:")
    try:
        client = PesaJet(
            api_key="pk_test_sample_12345",
            webhook_secret="whsec_sample_secret_67890",
        )
        assert_true(
            isinstance(client, PesaJet),
            "Client instantiates successfully with API key",
        )
    except Exception as err:
        assert_true(False, "Client instantiates successfully", str(err))

    try:
        PesaJet(api_key="")
        assert_true(False, "Rejects initialization when apiKey is missing")
    except Exception as err:
        assert_true(
            isinstance(err, PesaJetError) and err.error_code == "MISSING_API_KEY",
            "Rejects initialization with MISSING_API_KEY error code",
        )

    # 2. Carrier Detection & Phone Utilities
    print("\n📱 2. Phone Utilities & Network Detection:")
    pesajet = PesaJet(api_key="pk_test_demo")

    # MTN Checks (077, 078, 076, 079, 039)
    assert_true(
        pesajet.utils.detect_provider("+256771234567") == "mtn",
        "Identifies MTN numbers (+25677...)",
    )
    assert_true(
        pesajet.utils.detect_provider("0781234567") == "mtn",
        "Identifies MTN numbers (078...)",
    )
    assert_true(
        pesajet.utils.detect_provider("0761234567") == "mtn",
        "Identifies MTN numbers (076...)",
    )
    assert_true(
        pesajet.utils.detect_provider("0791234567") == "mtn",
        "Identifies MTN numbers (079...)",
    )
    assert_true(
        pesajet.utils.detect_provider("+256791234567") == "mtn",
        "Identifies MTN numbers (+25679...)",
    )
    assert_true(
        pesajet.utils.detect_provider("0391234567") == "mtn",
        "Identifies MTN numbers (039...)",
    )

    # Airtel Checks (070, 075, 074)
    assert_true(
        pesajet.utils.detect_provider("+256701234567") == "airtel",
        "Identifies Airtel numbers (+25670...)",
    )
    assert_true(
        pesajet.utils.detect_provider("0751234567") == "airtel",
        "Identifies Airtel numbers (075...)",
    )
    assert_true(
        pesajet.utils.detect_provider("0741234567") == "airtel",
        "Identifies Airtel numbers (074...)",
    )

    # Cross-Network (073 cuts across MTN and Airtel)
    assert_true(
        pesajet.utils.detect_provider("0731234567") is None,
        "Returns None for 073... because it cuts across MTN & Airtel (user must specify provider)",
    )
    assert_true(
        pesajet.utils.detect_provider("+256731234567") is None,
        "Returns None for +25673... because it cuts across MTN & Airtel",
    )

    # International / Non-Uganda
    assert_true(
        pesajet.utils.detect_provider("+254712345678") is None,
        "Returns None for non-Ugandan prefixes",
    )

    # camelCase alias check
    assert_true(
        pesajet.utils.detectProvider("+256771234567") == "mtn",
        "detectProvider camelCase alias works identically",
    )
    assert_true(
        pesajet.detect_provider("+256771234567") == "mtn",
        "PesaJet.detect_provider static/instance method works",
    )

    # Phone Formatting
    assert_true(
        pesajet.utils.format_phone_number("0771234567") == "+256771234567",
        "Formats 077... to +25677...",
    )
    assert_true(
        pesajet.utils.format_phone_number("256701234567") == "+256701234567",
        "Formats 25670... to +25670...",
    )
    assert_true(
        pesajet.utils.format_phone_number("+256781234567") == "+256781234567",
        "Preserves existing +256 E.164",
    )
    assert_true(
        pesajet.utils.formatPhoneNumber("0751234567") == "+256751234567",
        "formatPhoneNumber camelCase alias works identically",
    )

    # 3. Webhook Cryptographic Verification
    print("\n🔐 3. HMAC-SHA256 Webhook Verification:")
    secret = "whsec_test_secret_99887766554433221100"
    webhook_client = PesaJet(
        api_key="pk_test_demo",
        webhook_secret=secret,
    )

    raw_payload = {
        "event": "payment.completed",
        "transactionId": "550e8400-e29b-41d4-a716-446655440000",
        "amount": 50000,
        "currency": "UGX",
        "status": "COMPLETED",
        "provider": "mtn",
        "reference": "ORD-9912",
        "timestamp": "2026-08-28T21:30:00.000Z",
    }

    payload_string = json.dumps(raw_payload, separators=(",", ":"))
    valid_signature = hmac.new(
        secret.encode("utf-8"),
        payload_string.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    # Valid signature check (both dict and raw str)
    assert_true(
        webhook_client.webhooks.verify(raw_payload, valid_signature) is True,
        "Valid HMAC signature passes verification (dict payload)",
    )
    assert_true(
        webhook_client.webhooks.verify(payload_string, valid_signature) is True,
        "Valid HMAC signature passes verification (string payload)",
    )

    # Tampered payload check
    tampered_payload = {**raw_payload, "amount": 999999}
    assert_true(
        webhook_client.webhooks.verify(tampered_payload, valid_signature) is False,
        "Tampered payload fails verification (anti-tamper invariant)",
    )

    # Invalid signature check
    assert_true(
        webhook_client.webhooks.verify(
            raw_payload,
            "bad_signature_0000000000000000000000000000000000000000000000000000000000000000",
        )
        is False,
        "Bogus signature string fails verification",
    )

    # construct_event helper check
    try:
        event = webhook_client.webhooks.construct_event(
            payload_string,
            valid_signature,
        )
        assert_true(
            event.get("event") == "payment.completed",
            "construct_event parses valid payload",
        )
    except Exception as err:
        assert_true(False, "construct_event parses valid payload", str(err))

    # construct_event raises WebhookVerificationError on bad signature
    try:
        webhook_client.webhooks.construct_event(
            json.dumps(tampered_payload, separators=(",", ":")),
            valid_signature,
        )
        assert_true(
            False,
            "construct_event throws WebhookVerificationError on bad signature",
        )
    except Exception as err:
        assert_true(
            isinstance(err, WebhookVerificationError),
            "construct_event throws WebhookVerificationError on bad signature",
        )

    # constructEvent camelCase alias
    try:
        event = webhook_client.webhooks.constructEvent(
            payload_string,
            valid_signature,
        )
        assert_true(
            event.get("event") == "payment.completed",
            "constructEvent alias works identically",
        )
    except Exception as err:
        assert_true(False, "constructEvent alias works identically", str(err))

    # Summary
    print("\n=======================================================")
    print(f"📊 Test Results: {passed} Passed, {failed} Failed")
    print("=======================================================\n")

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    run_tests()

