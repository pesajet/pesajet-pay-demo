<?php

namespace PesaJet;

class PesaJet
{
    public Payments $payments;
    public Webhook $webhooks;

    public function __construct(array $config)
    {
        $apiKey = $config['apiKey'] ?? getenv('PESAJET_API_KEY');
        if (!$apiKey) {
            throw new PesaJetException("API Key is required to initialize PesaJet SDK", 401);
        }

        $baseUrl = $config['baseUrl'] ?? 'https://api.pesajet.com/v1';
        $baseUrl = $config['baseUrl'] ?? 'https://payments.pesajet.com/api/v1';
        $timeout = $config['timeout'] ?? 30;
        $webhookSecret = $config['webhookSecret'] ?? getenv('PESAJET_WEBHOOK_SECRET') ?: null;

        $this->payments = new Payments($baseUrl, $apiKey, $timeout);
        $this->webhooks = new Webhook($webhookSecret);
    }

    /**
     * Detect carrier network from Ugandan phone number.
     * Note: 079 is MTN. 073 cuts across both MTN and Airtel networks, so returns null
     * and the caller must explicitly provide the provider.
     */
    public static function detectProvider(string $phone): ?string
    {
        $cleaned = preg_replace('/[\s\-\+]/', '', $phone);
        if (preg_match('/^(256|0)?(77|78|76|79|39)\d{7}$/', $cleaned)) {
            return 'mtn';
        }
        if (preg_match('/^(256|0)?(70|75|74)\d{7}$/', $cleaned)) {
            return 'airtel';
        }
        return null;
    }

    public static function formatPhoneNumber(string $phone): string
    {
        $cleaned = preg_replace('/[\s\-]/', '', $phone);
        if (strpos($cleaned, '0') === 0) {
            return '+256' . substr($cleaned, 1);
        } elseif (strpos($cleaned, '256') === 0) {
            return '+' . $cleaned;
        } elseif (strpos($cleaned, '+') !== 0) {
            return '+' . $cleaned;
        }
        return $cleaned;
    }
}

