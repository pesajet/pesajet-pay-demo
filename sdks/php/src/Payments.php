<?php

namespace PesaJet;

class Payments
{
    private string $baseUrl;
    private string $apiKey;
    private int $timeout;

    public function __construct(string $baseUrl, string $apiKey, int $timeout = 30)
    {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->apiKey = $apiKey;
        $this->timeout = $timeout;
    }

    private function request(string $method, string $path, ?array $body = null, array $headers = []): array
    {
        $url = $this->baseUrl . $path;
        $ch = curl_init($url);

        $defaultHeaders = [
            'Content-Type: application/json',
            'X-API-Key: ' . $this->apiKey,
        ];

        foreach ($headers as $k => $v) {
            $defaultHeaders[] = "$k: $v";
        }

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->timeout);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $defaultHeaders);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($body) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
            }
        } elseif ($method === 'GET') {
            curl_setopt($ch, CURLOPT_HTTPGET, true);
        }

        $response = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new PesaJetException("Network request error: $error", 500);
        }

        $data = json_decode($response, true);
        if ($statusCode >= 400) {
            $msg = $data['message'] ?? $data['error'] ?? "HTTP $statusCode Error";
            throw new PesaJetException($msg, $statusCode, $data['errorCode'] ?? null, $data);
        }

        return $data ?? [];
    }

    /**
     * Initiate payment or payout
     */
    public function create(array $params): array
    {
        $headers = [];
        if (!empty($params['idempotencyKey'])) {
            $headers['Idempotency-Key'] = $params['idempotencyKey'];
        }

        return $this->request('POST', '/payments', $params, $headers);
    }

    /**
     * Get transaction by ID
     */
    public function get(string $transactionId): array
    {
        return $this->request('GET', "/payments/{$transactionId}");
    }

    /**
     * Calculate fee preview
     */
    public function preview(array $params): array
    {
        $query = http_build_query($params);
        return $this->request('GET', "/payments/preview?{$query}");
    }
}

