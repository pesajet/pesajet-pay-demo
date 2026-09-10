import re
from typing import Optional
from .payments import PaymentsClient
from .webhook import WebhookClient
from .exceptions import PesaJetError


class PhoneUtils:
    """Phone number and carrier utility helpers for PesaJet."""

    @staticmethod
    def detect_provider(phone_number: str) -> Optional[str]:
        """Detect carrier network from Ugandan phone number.

        MTN Uganda Prefixes: 077, 078, 076, 079, 039 -> 'mtn'
        Airtel Uganda Prefixes: 070, 075, 074 -> 'airtel'
        Cross-Network: 073 cuts across MTN and Airtel, so returns None
        and the user must explicitly provide the provider.
        """
        cleaned = re.sub(r"[\s\-\+]", "", phone_number)
        if re.match(r"^(256|0)?(77|78|76|79|39)\d{7}$", cleaned):
            return "mtn"
        if re.match(r"^(256|0)?(70|75|74)\d{7}$", cleaned):
            return "airtel"
        return None

    detectProvider = detect_provider

    @staticmethod
    def format_phone_number(phone_number: str) -> str:
        """Format phone number to international E.164 (+256...)."""
        cleaned = re.sub(r"[\s\-]", "", phone_number)
        if cleaned.startswith("0"):
            return f"+256{cleaned[1:]}"
        elif cleaned.startswith("256"):
            return f"+{cleaned}"
        elif not cleaned.startswith("+"):
            return f"+{cleaned}"
        return cleaned

    formatPhoneNumber = format_phone_number


class PesaJet:
    utils = PhoneUtils()
    detect_provider = staticmethod(PhoneUtils.detect_provider)
    detectProvider = staticmethod(PhoneUtils.detect_provider)
    format_phone_number = staticmethod(PhoneUtils.format_phone_number)
    formatPhoneNumber = staticmethod(PhoneUtils.format_phone_number)

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://payments.pesajet.com/api/v1",
        webhook_secret: Optional[str] = None,
        timeout: int = 30,
    ):
        if not api_key:
            raise PesaJetError(
                "PesaJet API key is required to initialize client",
                status_code=401,
                error_code="MISSING_API_KEY",
            )

        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.utils = PhoneUtils()
        self.payments = PaymentsClient(base_url=self.base_url, api_key=api_key, timeout=timeout)
        self.webhooks = WebhookClient(secret=webhook_secret)


