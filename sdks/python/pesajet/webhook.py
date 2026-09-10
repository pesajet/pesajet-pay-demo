import hmac
import hashlib
import json
from typing import Union, Dict, Any
from .exceptions import WebhookVerificationError


class WebhookClient:
    def __init__(self, secret: str = None):
        self.secret = secret

    def verify(
        self,
        payload: Union[str, bytes, Dict[str, Any]],
        signature: str = None,
        secret: str = None
    ) -> bool:
        """
        Cryptographically verify HMAC-SHA256 signature of a PesaJet webhook.
        """
        signing_secret = secret or self.secret
        if not signing_secret:
            raise WebhookVerificationError("Signing secret is required for verification")

        if isinstance(payload, (str, bytes)):
            if isinstance(payload, bytes):
                payload_str = payload.decode("utf-8")
            else:
                payload_str = payload

            try:
                parsed = json.loads(payload_str)
                if not signature and "signature" in parsed:
                    signature = parsed["signature"]
                # Omit signature field if present in JSON payload
                clean_payload = {k: v for k, v in parsed.items() if k != "signature"}
                payload_str = json.dumps(clean_payload, separators=(',', ':'))
            except Exception:
                pass
        else:
            if not signature and "signature" in payload:
                signature = payload["signature"]
            clean_payload = {k: v for k, v in payload.items() if k != "signature"}
            payload_str = json.dumps(clean_payload, separators=(',', ':'))

        if not signature:
            return False

        expected_sig = hmac.new(
            signing_secret.encode("utf-8"),
            payload_str.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected_sig, signature)

    def construct_event(
        self,
        payload: Union[str, bytes, Dict[str, Any]],
        signature: Optional[str] = None,
        secret: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Parse and cryptographically verify webhook payload, raising WebhookVerificationError on failure.
        """
        is_valid = self.verify(payload, signature=signature, secret=secret)
        if not is_valid:
            raise WebhookVerificationError("Webhook signature verification failed")

        if isinstance(payload, bytes):
            return json.loads(payload.decode("utf-8"))
        elif isinstance(payload, str):
            return json.loads(payload)
        return payload

    constructEvent = construct_event

