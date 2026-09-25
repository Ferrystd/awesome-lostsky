<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\command\DictionaryTemplate;
use app\service\PermissionDictionary;

$root = dirname(__DIR__);
$check = static function (bool $condition, string $message): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
};
$keys = array_merge(PermissionDictionary::keys(), PermissionDictionary::adminKeys());
$described = array_keys(PermissionDictionary::descriptions());
sort($keys);
sort($described);
$check($keys === $described, 'Permission descriptions must cover exactly the registered keys');
$expectedDynamic = [];
foreach (PermissionDictionary::keys() as $key) {
    if (str_contains($key, '.*.')) {
        $expectedDynamic[] = str_replace('*', '<slug>', $key);
    }
}
$dynamic = array_keys(PermissionDictionary::dynamicDescriptions());
sort($expectedDynamic);
sort($dynamic);
$check($dynamic === $expectedDynamic, 'Dynamic templates must cover every wildcard permission');
foreach ($dynamic as $template) {
    $check(PermissionDictionary::dynamic(str_replace('<slug>', 'example', $template)) !== null, 'Unrecognized dynamic template');
}

foreach (['developer' => 'docs/dev/architecture/permissions.md', 'user' => 'docs/user/dictionary/permissions.md'] as $audience => $target) {
    $content = file_get_contents($root . '/' . $target);
    $documentKeys = $audience === 'developer' ? $keys : PermissionDictionary::keys();
    foreach (array_merge($documentKeys, $dynamic) as $key) {
        $check(substr_count($content, '| `' . $key . '` |') === 1, "Missing or duplicate permission: {$target}: {$key}");
    }
}

// 在隔离目录执行真实命令，验证生成、幂等及 --check 失败时不写入。
$fixture = sys_get_temp_dir() . '/lostsky-dictionary-' . bin2hex(random_bytes(8));
$files = [
    'app/command/GeneratePermissionDocs.php',
    'Templates/dictionaries/permissions-developer.md',
    'Templates/dictionaries/permissions-user.md',
];
$targets = ['docs/dev/architecture/permissions.md', 'docs/user/dictionary/permissions.md'];
foreach (array_merge($files, $targets) as $file) {
    if (!is_dir(dirname($fixture . '/' . $file))) {
        mkdir(dirname($fixture . '/' . $file), 0777, true);
    }
    copy($root . '/' . $file, $fixture . '/' . $file);
}
$run = static function (bool $checkOnly) use ($root, $fixture): int {
    $code = 'require ' . var_export($root . '/vendor/autoload.php', true) . ';'
        . 'require ' . var_export($fixture . '/app/command/GeneratePermissionDocs.php', true) . ';'
        . 'exit((new app\\command\\GeneratePermissionDocs())->run(new think\\console\\Input('
        . ($checkOnly ? "['--check']" : '[]') . '), new think\\console\\Output()));';
    $process = proc_open([PHP_BINARY, '-r', $code], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
    if (!is_resource($process)) {
        throw new RuntimeException('Unable to launch dictionary command');
    }
    $output = stream_get_contents($pipes[1]) . stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $exit = proc_close($process);
    if ($exit !== 0 && $exit !== 1) {
        throw new RuntimeException($output);
    }
    return $exit;
};
try {
    $check($run(true) === 0, 'Current documents are stale');
    foreach ($targets as $target) {
        $path = $fixture . '/' . $target;
        file_put_contents($path, 'stale');
        $check($run(true) === 1, '--check must reject either stale target');
        $check(file_get_contents($path) === 'stale', '--check wrote a document');
        $check($run(false) === 0, 'Generation failed');
        $check(file_get_contents($path) === file_get_contents($root . '/' . $target), 'Generated content differs');
    }
    $hashes = array_map(static fn (string $target): string => hash_file('sha256', $fixture . '/' . $target), $targets);
    $check($run(false) === 0, 'Repeated generation failed');
    $check($hashes === array_map(static fn (string $target): string => hash_file('sha256', $fixture . '/' . $target), $targets), 'Generation is not idempotent');
    file_put_contents($fixture . '/Templates/dictionaries/permissions-user.md', '{{unknown}}');
    $check($run(false) === 1, 'Invalid user template was accepted');
    $check($hashes === array_map(static fn (string $target): string => hash_file('sha256', $fixture . '/' . $target), $targets), 'Template failure partially wrote documents');
} finally {
    foreach (array_merge($files, $targets) as $file) {
        unlink($fixture . '/' . $file);
    }
    foreach (['app/command', 'app', 'Templates/dictionaries', 'Templates', 'docs/dev/architecture', 'docs/dev', 'docs/user/dictionary', 'docs/user', 'docs'] as $directory) {
        rmdir($fixture . '/' . $directory);
    }
    rmdir($fixture);
}

// 模板错误应在写入文档之前失败。
$template = tempnam(sys_get_temp_dir(), 'dictionary-test-');
try {
    foreach (['{{permissions.team}} {{unknown}}', 'Missing required placeholder'] as $invalid) {
        file_put_contents($template, $invalid);
        try {
            DictionaryTemplate::render($template, ['permissions.team' => 'table']);
            throw new LogicException('Invalid template was accepted');
        } catch (RuntimeException $exception) {
            $check(str_contains($exception->getMessage(), '占位符'), 'Unexpected template failure');
        }
    }
    file_put_contents($template, "手写正文\r\n{{permissions.team}}\r\n");
    $check(DictionaryTemplate::render($template, ['permissions.team' => 'table']) === "手写正文\ntable\n", 'Template prose or line endings changed');
} finally {
    unlink($template);
}
echo "Dictionary documentation checks passed\n";
