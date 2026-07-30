<?php
declare(strict_types=1);

use app\command\UpdateCertificates;

require dirname(__DIR__) . '/vendor/autoload.php';

function assertOssCertificate(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$root = dirname(__DIR__);
$consoleConfig = require $root . '/config/console.php';
assertOssCertificate(
    ($consoleConfig['commands']['certificate:update'] ?? null) === UpdateCertificates::class,
    'unified certificate command is registered'
);

$source = file_get_contents($root . '/app/command/UpdateCertificates.php');
assertOssCertificate(is_string($source), 'certificate command source can be read');
assertOssCertificate(
    str_contains($source, 'AlibabaCloud\\Oss\\V2\\Models\\PutCnameRequest'),
    'certificate command uses the official PHP SDK V2 PutCname request'
);
assertOssCertificate(
    str_contains($source, 'force: true'),
    'certificate command overwrites the previous OSS certificate'
);
assertOssCertificate(
    str_contains($source, "\$this->runNginx(['-t'])")
        && str_contains($source, "\$this->runNginx(['-s', 'reload'])"),
    'certificate command tests and reloads Nginx'
);
assertOssCertificate(
    str_contains($source, "'Certificate deployment partially failed'")
        && str_contains($source, "\$errors['oss']")
        && str_contains($source, "\$errors['nginx']"),
    'certificate command reports OSS and Nginx deployment failures independently'
);

$tlsSource = file_get_contents($root . '/config/tls.php');
assertOssCertificate(
    is_string($tlsSource)
        && str_contains($tlsSource, '"*.{$rootDomain}"')
        && str_contains($tlsSource, '"*.display.{$rootDomain}"')
        && str_contains($tlsSource, '"*.display.api.{$rootDomain}"'),
    'default certificate names cover exact and nested frontend/API domains'
);

$opensslConfig = dirname(PHP_BINARY) . DIRECTORY_SEPARATOR . 'extras'
    . DIRECTORY_SEPARATOR . 'ssl' . DIRECTORY_SEPARATOR . 'openssl.cnf';
$opensslOptions = is_file($opensslConfig) ? ['config' => $opensslConfig] : [];
$privateKey = openssl_pkey_new($opensslOptions + [
    'private_key_bits' => 2048,
    'private_key_type' => OPENSSL_KEYTYPE_RSA,
]);
assertOssCertificate($privateKey !== false, 'test private key can be created');

$csr = openssl_csr_new(['commonName' => 'oss.lostsky.work'], $privateKey, $opensslOptions);
assertOssCertificate($csr !== false, 'test certificate request can be created');
$certificate = openssl_csr_sign($csr, null, $privateKey, 1, $opensslOptions);
assertOssCertificate($certificate !== false, 'test certificate can be signed');

$certificatePem = '';
$privateKeyPem = '';
assertOssCertificate(openssl_x509_export($certificate, $certificatePem), 'test certificate can be exported');
assertOssCertificate(
    openssl_pkey_export($privateKey, $privateKeyPem, null, $opensslOptions),
    'test private key can be exported'
);

$temporaryDirectory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'lostsky-oss-certificate-' . bin2hex(random_bytes(8));
assertOssCertificate(mkdir($temporaryDirectory, 0700), 'test certificate directory can be created');
$certificatePath = $temporaryDirectory . DIRECTORY_SEPARATOR . 'fullchain.pem';
$privateKeyPath = $temporaryDirectory . DIRECTORY_SEPARATOR . 'privkey.pem';
file_put_contents($certificatePath, $certificatePem);
file_put_contents($privateKeyPath, $privateKeyPem);

try {
    $command = new UpdateCertificates();
    $normalizeDomain = Closure::bind(
        fn (string $domain): string => $this->normalizeDomain($domain),
        $command,
        $command
    );
    assertOssCertificate(
        $normalizeDomain('//oss.lostsky.work') === 'oss.lostsky.work',
        'protocol-relative OSS domain is normalized'
    );

    $readCertificateFiles = Closure::bind(
        fn (string $certificatePath, string $privateKeyPath, array $names): array =>
            $this->readCertificateFiles($certificatePath, $privateKeyPath, $names),
        $command,
        $command
    );
    $contents = $readCertificateFiles($certificatePath, $privateKeyPath, ['oss.lostsky.work']);
    assertOssCertificate($contents === [$certificatePem, $privateKeyPem], 'matching certificate files are accepted');

    try {
        $readCertificateFiles($certificatePath, $privateKeyPath, ['assets.lostsky.work']);
        throw new RuntimeException('certificate for another domain was accepted');
    } catch (RuntimeException $exception) {
        assertOssCertificate(
            str_contains($exception->getMessage(), 'does not cover'),
            'certificate for another domain is rejected'
        );
    }

    $certificateCoversName = Closure::bind(
        fn (array $details, string $name): bool => $this->certificateCoversName($details, $name),
        $command,
        $command
    );
    $wildcardDetails = [
        'extensions' => [
            'subjectAltName' => 'DNS:*.lostsky.work, DNS:*.display.lostsky.work',
        ],
    ];
    assertOssCertificate(
        $certificateCoversName($wildcardDetails, 'api.lostsky.work'),
        'single-level wildcard covers an exact application domain'
    );
    assertOssCertificate(
        $certificateCoversName($wildcardDetails, '*.display.lostsky.work'),
        'nested wildcard is required and accepted as a certificate name'
    );
    assertOssCertificate(
        !$certificateCoversName($wildcardDetails, 'demo.team.lostsky.work'),
        'single-level wildcard does not cover a nested application domain'
    );
} finally {
    @unlink($certificatePath);
    @unlink($privateKeyPath);
    @rmdir($temporaryDirectory);
}

echo "Certificate deployment tests passed.\n";
