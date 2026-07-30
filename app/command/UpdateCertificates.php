<?php
declare(strict_types=1);

namespace app\command;

use AlibabaCloud\Oss\V2\Client;
use AlibabaCloud\Oss\V2\Config;
use AlibabaCloud\Oss\V2\Credentials\StaticCredentialsProvider;
use AlibabaCloud\Oss\V2\Models\BucketCnameConfiguration;
use AlibabaCloud\Oss\V2\Models\CertificateConfiguration;
use AlibabaCloud\Oss\V2\Models\Cname;
use AlibabaCloud\Oss\V2\Models\PutCnameRequest;
use RuntimeException;
use Throwable;
use think\console\Command;
use think\console\Input;
use think\console\input\Option;
use think\console\Output;

final class UpdateCertificates extends Command
{
    protected function configure()
    {
        $this->setName('certificate:update')
            ->addOption('certificate', null, Option::VALUE_OPTIONAL, 'PEM 证书链路径，默认读取 TLS_CERTIFICATE_PATH')
            ->addOption('private-key', null, Option::VALUE_OPTIONAL, 'PEM 私钥路径，默认读取 TLS_PRIVATE_KEY_PATH')
            ->addOption('no-nginx', null, Option::VALUE_NONE, '仅更新 OSS，不检查或重载 Nginx')
            ->setDescription('将同一张 Let’s Encrypt 证书部署到 LostSky 的 Nginx 域名和 OSS');
    }

    protected function execute(Input $input, Output $output)
    {
        try {
            $accessKeyId = $this->requiredAliyunConfig('access_key_id', 'ALIYUN_ACCESS_KEY_ID');
            $accessKeySecret = $this->requiredAliyunConfig('access_key_secret', 'ALIYUN_ACCESS_KEY_SECRET');
            $bucket = $this->requiredAliyunConfig('bucket', 'ALIYUN_OSS_BUCKET');
            $region = $this->requiredAliyunConfig('region', 'ALIYUN_OSS_REGION');
            $domain = $this->normalizeDomain(
                $this->requiredAliyunConfig('oss_domain', 'ALIYUN_OSS_DOMAIN')
            );

            $certificatePath = $this->resolvePath($input->getOption('certificate'), 'certificate_path');
            $privateKeyPath = $this->resolvePath($input->getOption('private-key'), 'private_key_path');
            $requiredNames = array_values((array) config('tls.required_names'));
            if (!in_array($domain, $requiredNames, true)) {
                $requiredNames[] = $domain;
            }
            [$certificate, $privateKey] = $this->readCertificateFiles(
                $certificatePath,
                $privateKeyPath,
                $requiredNames
            );

            $reloadNginx = !$input->getOption('no-nginx');
            $errors = [];
            $nginx = $reloadNginx ? 'pending' : 'skipped';
            $nginxValidated = false;
            if ($reloadNginx) {
                try {
                    $this->runNginx(['-t']);
                    $nginx = 'validated';
                    $nginxValidated = true;
                } catch (Throwable $exception) {
                    $nginx = 'failed';
                    $errors['nginx'] = $exception->getMessage();
                }
            }

            $oss = [
                'bucket' => $bucket,
                'domain' => $domain,
                'status' => 'pending',
                'status_code' => null,
                'request_id' => null,
            ];
            try {
                $config = Config::loadDefault()
                    ->setCredentialsProvider(new StaticCredentialsProvider($accessKeyId, $accessKeySecret))
                    ->setRegion($region);
                $client = new Client($config);
                $result = $client->putCname(new PutCnameRequest(
                    bucket: $bucket,
                    bucketCnameConfiguration: new BucketCnameConfiguration(
                        cname: new Cname(
                            domain: $domain,
                            certificateConfiguration: new CertificateConfiguration(
                                force: true,
                                certificate: $certificate,
                                privateKey: $privateKey
                            )
                        )
                    )
                ));
                $oss['status'] = 'updated';
                $oss['status_code'] = $result->statusCode;
                $oss['request_id'] = $result->requestId;
            } catch (Throwable $exception) {
                $oss['status'] = 'failed';
                $errors['oss'] = $exception->getMessage();
            }

            if ($nginxValidated) {
                try {
                    $this->runNginx(['-s', 'reload']);
                    $nginx = 'reloaded';
                } catch (Throwable $exception) {
                    $nginx = 'failed';
                    $errors['nginx'] = $exception->getMessage();
                }
            }

            $payload = [
                'code' => $errors ? 1 : 0,
                'message' => $errors
                    ? 'Certificate deployment partially failed'
                    : 'Certificate deployed',
                'data' => [
                    'names' => $requiredNames,
                    'nginx' => $nginx,
                    'oss' => $oss,
                    'errors' => $errors,
                ],
            ];
            $output->writeln($this->json($payload));

            return $errors ? 1 : 0;
        } catch (Throwable $exception) {
            $output->writeln($this->json([
                'code' => 1,
                'message' => $exception->getMessage(),
                'data' => null,
            ]));

            return 1;
        }
    }

    private function requiredAliyunConfig(string $key, string $environmentName): string
    {
        $value = trim((string) config("aliyun.{$key}"));
        if ($value === '') {
            throw new RuntimeException("Missing required configuration: {$environmentName}");
        }

        return $value;
    }

    private function resolvePath($option, string $configKey): string
    {
        $path = trim((string) ($option ?? ''));
        if ($path !== '') {
            return $path;
        }

        $path = trim((string) config("tls.{$configKey}"));
        if ($path === '') {
            throw new RuntimeException('Missing TLS certificate path configuration');
        }

        return $path;
    }

    private function normalizeDomain(string $value): string
    {
        if (str_starts_with($value, '//')) {
            $url = "https:{$value}";
        } else {
            $url = str_contains($value, '://') ? $value : "https://{$value}";
        }
        $parts = parse_url($url);
        $host = is_array($parts) ? strtolower((string) ($parts['host'] ?? '')) : '';
        $path = is_array($parts) ? (string) ($parts['path'] ?? '') : '';

        if (
            $host === ''
            || filter_var($host, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) === false
            || !in_array($path, ['', '/'], true)
            || isset($parts['user'])
            || isset($parts['pass'])
            || isset($parts['port'])
            || isset($parts['query'])
            || isset($parts['fragment'])
        ) {
            throw new RuntimeException('ALIYUN_OSS_DOMAIN must be a domain name or an origin URL without a path');
        }

        return $host;
    }

    private function readCertificateFiles(
        string $certificatePath,
        string $privateKeyPath,
        array $requiredNames
    ): array {
        if (!function_exists('openssl_x509_read') || !function_exists('openssl_pkey_get_private')) {
            throw new RuntimeException('The PHP OpenSSL extension is required');
        }

        $certificate = $this->readFile($certificatePath, 'certificate');
        $privateKey = $this->readFile($privateKeyPath, 'private key');

        $leafCertificate = openssl_x509_read($certificate);
        if ($leafCertificate === false) {
            throw new RuntimeException('The certificate file is not valid PEM');
        }

        $certificateDetails = openssl_x509_parse($leafCertificate);
        $now = time();
        if (
            !is_array($certificateDetails)
            || (int) ($certificateDetails['validFrom_time_t'] ?? 0) > $now
            || (int) ($certificateDetails['validTo_time_t'] ?? 0) <= $now
        ) {
            throw new RuntimeException('The certificate is not currently valid');
        }

        foreach ($requiredNames as $requiredName) {
            $requiredName = strtolower(trim((string) $requiredName));
            if ($requiredName === '' || !$this->certificateCoversName($certificateDetails, $requiredName)) {
                throw new RuntimeException("The certificate does not cover {$requiredName}");
            }
        }

        $privateKeyResource = openssl_pkey_get_private($privateKey);
        if ($privateKeyResource === false) {
            throw new RuntimeException('The private key file is not valid PEM or requires a passphrase');
        }
        if (!openssl_x509_check_private_key($leafCertificate, $privateKeyResource)) {
            throw new RuntimeException('The private key does not match the certificate');
        }

        return [$certificate, $privateKey];
    }

    private function certificateCoversName(array $certificateDetails, string $requiredName): bool
    {
        $subjectAlternativeName = (string) ($certificateDetails['extensions']['subjectAltName'] ?? '');
        $names = [];
        if ($subjectAlternativeName !== '') {
            foreach (preg_split('/,\s*/', $subjectAlternativeName) ?: [] as $entry) {
                if (str_starts_with($entry, 'DNS:')) {
                    $names[] = substr($entry, 4);
                }
            }
        } else {
            $commonName = (string) ($certificateDetails['subject']['CN'] ?? '');
            if ($commonName !== '') {
                $names[] = $commonName;
            }
        }

        foreach ($names as $name) {
            $name = strtolower(rtrim($name, '.'));
            if ($name === $requiredName) {
                return true;
            }
            if (
                !str_contains($requiredName, '*')
                && str_starts_with($name, '*.')
                && substr_count($name, '*') === 1
                && substr_count($name, '.') === substr_count($requiredName, '.')
                && str_ends_with($requiredName, substr($name, 1))
            ) {
                return true;
            }
        }

        return false;
    }

    private function runNginx(array $arguments): void
    {
        $binary = trim((string) config('tls.nginx_binary'));
        if ($binary === '') {
            throw new RuntimeException('Missing required configuration: TLS_NGINX_BINARY');
        }

        $pipes = [];
        $process = @proc_open(
            array_merge([$binary], $arguments),
            [
                1 => ['pipe', 'w'],
                2 => ['pipe', 'w'],
            ],
            $pipes,
            null,
            null,
            ['bypass_shell' => true]
        );
        if (!is_resource($process)) {
            throw new RuntimeException('Unable to start Nginx');
        }

        $stdout = stream_get_contents($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        $exitCode = proc_close($process);
        if ($exitCode !== 0) {
            $detail = trim((string) $stderr . PHP_EOL . (string) $stdout);
            throw new RuntimeException('Nginx command failed' . ($detail === '' ? '' : ": {$detail}"));
        }
    }

    private function readFile(string $path, string $label): string
    {
        if (!is_file($path) || !is_readable($path)) {
            throw new RuntimeException("The {$label} file is not readable");
        }

        $content = file_get_contents($path);
        if ($content === false || trim($content) === '') {
            throw new RuntimeException("The {$label} file is empty or cannot be read");
        }

        return $content;
    }

    private function json(array $payload): string
    {
        return (string) json_encode(
            $payload,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
        );
    }
}
