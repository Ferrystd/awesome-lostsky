<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

$vector = json_decode(file_get_contents(__DIR__ . '/fixtures/webhook-vector.json'), true, 512, JSON_THROW_ON_ERROR);
if ((new \StandardWebhooks\Webhook($vector['secret']))->sign($vector['id'], $vector['timestamp'], $vector['body']) !== $vector['signature']) throw new RuntimeException('Fixed signature vector mismatch');

$secret = 'whsec_' . base64_encode(str_repeat('a', 32));
$webhook = new \StandardWebhooks\Webhook($secret);
$body = '{"type":"message.created","timestamp":"2026-09-08T00:00:00Z","data":{"content":"你好\\n世界"}}';
$time = (string) time();
$headers = ['webhook-id' => '123', 'webhook-timestamp' => $time,
    'webhook-signature' => $webhook->sign('123', $time, $body)];
$check = static function (bool $value): void {
    if (!$value) {
        throw new RuntimeException('Webhook assertion failed');
    }
};
$check($webhook->verify($body, $headers)['data']['content'] === "你好\n世界");
$check($headers['webhook-signature'] === 'v1,' . base64_encode(hash_hmac('sha256', "123.{$time}.{$body}", str_repeat('a', 32), true)));
foreach (['body', 'id', 'time', 'secret', 'expired', 'future', 'legacy'] as $case) {
    $bad = $headers;
    $payload = $body;
    $verifier = $webhook;
    if ($case === 'body') $payload .= ' ';
    if ($case === 'id') $bad['webhook-id'] = '124';
    if ($case === 'time') $bad['webhook-timestamp'] = (string) (time() - 1);
    if ($case === 'secret') $verifier = new \StandardWebhooks\Webhook('whsec_' . base64_encode(str_repeat('b', 32)));
    if (in_array($case, ['expired', 'future'], true)) {
        $bad['webhook-timestamp'] = (string) (time() + ($case === 'expired' ? -600 : 600));
        $bad['webhook-signature'] = $webhook->sign('123', $bad['webhook-timestamp'], $body);
    }
    if ($case === 'legacy') $bad = ['X-LostSky-Delivery' => '123'];
    try {
        $verifier->verify($payload, $bad);
    } catch (\StandardWebhooks\Exception\WebhookVerificationException $e) {
        continue;
    }
    throw new RuntimeException("Expected rejection: {$case}");
}
echo "Webhook protocol tests passed.\n";
