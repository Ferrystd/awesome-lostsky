<?php
declare(strict_types=1);

namespace app\service;

class RedemptionCrypto
{
    public function generate(): string
    {
        return 'LS-' . implode('-', str_split(strtoupper(bin2hex(random_bytes(12))), 4));
    }

    public function hash(string $code): string
    {
        return hash_hmac('sha256', $this->normalize($code), $this->secret());
    }

    public function encrypt(string $code): string
    {
        $iv = random_bytes(12);
        $tag = '';
        $ciphertext = openssl_encrypt(
            $this->normalize($code),
            'aes-256-gcm',
            hash('sha256', $this->secret(), true),
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );
        if ($ciphertext === false) {
            throw new \RuntimeException('卡密加密失败');
        }

        return base64_encode($iv . $tag . $ciphertext);
    }

    public function decrypt(string $payload): string
    {
        $decoded = base64_decode($payload, true);
        if ($decoded === false || strlen($decoded) < 29) {
            throw new \RuntimeException('卡密密文无效');
        }
        $plaintext = openssl_decrypt(
            substr($decoded, 28),
            'aes-256-gcm',
            hash('sha256', $this->secret(), true),
            OPENSSL_RAW_DATA,
            substr($decoded, 0, 12),
            substr($decoded, 12, 16)
        );
        if ($plaintext === false) {
            throw new \RuntimeException('卡密解密失败');
        }

        return $plaintext;
    }

    public function hint(string $code): string
    {
        $code = $this->normalize($code);
        return substr($code, 0, 7) . '••••' . substr($code, -4);
    }

    private function normalize(string $code): string
    {
        return strtoupper(trim($code));
    }

    private function secret(): string
    {
        $secret = (string) config('redemption.secret');
        if (strlen($secret) < 32) {
            throw new \RuntimeException('REDEMPTION_SECRET 必须至少 32 个字符');
        }
        return $secret;
    }
}
