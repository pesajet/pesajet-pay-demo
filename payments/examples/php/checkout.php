<?php
/**
 * PesaJet Integration Example: PHP (cURL)
 */

$apiKey = getenv('PESAJET_API_KEY') ?: 'pk_live_your_api_key_here';
$baseUrl = 'http://localhost:3000/api/v1';

$payload = [
    'type' => 'COLLECTION',
    'amount' => 15000,
    'currency' => 'UGX',
    'phoneNumber' => '+256771234567',
    'provider' => 'mtn',
    'reference' => 'PHP-ORD-' . time(),
    'description' => 'PHP Checkout Demo',
];

$ch = curl_init("$baseUrl/payments");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-API-Key: ' . $apiKey,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);

if ($httpCode === 201) {
    echo "✅ Payment Initiated Successfully!\n";
    echo "Transaction ID: " . $data['transactionId'] . "\n";
    echo "Status: " . $data['status'] . "\n";
} else {
    echo "❌ Payment Failed (HTTP $httpCode):\n";
    print_r($data);
}
?>

