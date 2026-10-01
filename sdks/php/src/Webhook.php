<?php

namespace PesaJet;

class Webhook
{
    private ?string $secret;

    public function __construct(?string $secret = null)
    {
        $this->secret = $secret;
    }

    /**
     * Verify HMAC-SHA256 signature of incoming webhook payload
     */
    public function verify($rawBodyOrArray, ?string $signature = null, ?string $secret = null): bool
    {
        $signingSecret = $secret ?? $this->secret;
        if (!$signingSecret) {
            throw new PesaJetException("Signing secret is required for webhook verification", 401);
        }

        if (is_array($rawBodyOrArray)) {
            $data = $rawBodyOrArray;
            if (!$signature && isset($data['signature'])) {
                $signature = $data['signature'];
            }
            unset($data['signature']);
            $payloadString = json_encode($data, JSON_UNESCAPED_SLASHES);
        } else {
            $parsed = json_decode((string)$rawBodyOrArray, true);
            if (is_array($parsed)) {
                if (!$signature && isset($parsed['signature'])) {
                    $signature = $parsed['signature'];
                }
                unset($parsed['signature']);
                $payloadString = json_encode($parsed, JSON_UNESCAPED_SLASHES);
            } else {
                $payloadString = (string)$rawBodyOrArray;
            }
        }

        if (!$signature) {
            return false;
        }

        $expectedSignature = hash_hmac('sha256', $payloadString, $signingSecret);

        return hash_equals($expectedSignature, $signature);
    }
}

