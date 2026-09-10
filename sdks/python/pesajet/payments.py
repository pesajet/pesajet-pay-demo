import time
import requests
from typing import Dict, Any, Optional
from .exceptions import PesaJetError


class PaymentsClient:
    def __init__(self, base_url: str, api_key: str, timeout: int = 30):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout

    def _headers(self, idempotency_key: Optional[str] = None) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "X-API-Key": self.api_key,
        }
        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key
        return headers

    def create(
        self,
        amount: int,
        phone_number: str,
        reference: str,
        provider: Optional[str] = None,
        type: str = "COLLECTION",
        currency: str = "UGX",
        description: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Initiate Mobile Money Collection or Payout.
        """
        payload = {
            "type": type,
            "amount": amount,
            "currency": currency,
            "phoneNumber": phone_number,
            "reference": reference,
        }
        if provider:
            payload["provider"] = provider
        if description:
            payload["description"] = description
        if metadata:
            payload["metadata"] = metadata

        try:
            resp = requests.post(
                f"{self.base_url}/payments",
                json=payload,
                headers=self._headers(idempotency_key),
                timeout=self.timeout,
            )
            data = resp.json()
            if not resp.ok:
                raise PesaJetError(
                    message=data.get("message") or data.get("error") or f"HTTP {resp.status_code}",
                    status_code=resp.status_code,
                    error_code=data.get("errorCode"),
                    details=data,
                )
            return data
        except requests.RequestException as e:
            raise PesaJetError(f"Network request failed: {str(e)}", status_code=500, error_code="NETWORK_ERROR", details={"error": str(e)})

    def get(self, transaction_id: str) -> Dict[str, Any]:
        """
        Fetch status and details of a transaction by ID.
        """
        try:
            resp = requests.get(
                f"{self.base_url}/payments/{transaction_id}",
                headers=self._headers(),
                timeout=self.timeout,
            )
            data = resp.json()
            if not resp.ok:
                raise PesaJetError(
                    message=data.get("message") or f"HTTP {resp.status_code}",
                    status_code=resp.status_code,
                    error_code=data.get("errorCode"),
                    details=data,
                )
            return data
        except requests.RequestException as e:
            raise PesaJetError(f"Network request failed: {str(e)}", status_code=500, error_code="NETWORK_ERROR", details={"error": str(e)})

    def preview(self, amount: int, provider: str, type: str = "COLLECTION") -> Dict[str, Any]:
        """
        Calculate fee breakdown and net proceeds.
        """
        try:
            params = {"amount": amount, "provider": provider, "type": type}
            resp = requests.get(
                f"{self.base_url}/payments/preview",
                params=params,
                headers=self._headers(),
                timeout=self.timeout,
            )
            data = resp.json()
            if not resp.ok:
                raise PesaJetError(
                    message=data.get("message") or f"HTTP {resp.status_code}",
                    status_code=resp.status_code,
                    error_code=data.get("errorCode"),
                    details=data,
                )
            return data
        except requests.RequestException as e:
            raise PesaJetError(f"Network request failed: {str(e)}", status_code=500, error_code="NETWORK_ERROR", details={"error": str(e)})

    def poll_until_complete(
        self,
        transaction_id: str,
        interval_seconds: float = 2.5,
        max_attempts: int = 24,
        interval_ms: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Poll transaction until it reaches a terminal status (COMPLETED / FAILED / EXPIRED).
        """
        if interval_ms is not None:
            interval_seconds = interval_ms / 1000.0

        for _ in range(max_attempts):
            txn = self.get(transaction_id)
            status = txn.get("status")
            if status in ["COMPLETED", "FAILED", "EXPIRED"]:
                return txn
            time.sleep(interval_seconds)

        raise PesaJetError(f"Polling timed out for transaction {transaction_id}", status_code=408, error_code="POLL_TIMEOUT")

    pollUntilComplete = poll_until_complete

