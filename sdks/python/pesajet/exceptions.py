class PesaJetError(Exception):
    """Base exception for all PesaJet errors."""
    def __init__(self, message: str, status_code: int = None, error_code: str = None, details: dict = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}


class WebhookVerificationError(PesaJetError):
    """Raised when a webhook cryptographic signature fails verification."""
    def __init__(self, message: str = "Webhook signature verification failed"):
        super().__init__(message, status_code=401, error_code="WEBHOOK_SIGNATURE_MISMATCH")

