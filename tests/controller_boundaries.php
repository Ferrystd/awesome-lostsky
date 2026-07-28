<?php
declare(strict_types=1);

$root = dirname(__DIR__) . '/app';
$errors = [];
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root));

foreach ($iterator as $file) {
    if (!$file->isFile() || $file->getExtension() !== 'php') {
        continue;
    }

    $path = str_replace('\\', '/', $file->getPathname());
    if (!str_contains($path, '/controller/')) {
        continue;
    }

    $source = (string) file_get_contents($file->getPathname());
    $rules = [
        '/\buse\s+app\\\\model\\\\/i' => 'imports a business model',
        '/\\\\app\\\\model\\\\/i' => 'references a business model',
        '/\bDb::transaction\s*\(/' => 'opens a database transaction',
        '/::(?:where|find|findOrFail|withTrashed)\s*\(/' => 'queries a business model',
    ];

    foreach ($rules as $pattern => $message) {
        if (preg_match($pattern, $source)) {
            $errors[] = substr($path, strlen(str_replace('\\', '/', dirname(__DIR__))) + 1) . ": {$message}";
        }
    }
}

if ($errors) {
    fwrite(STDERR, implode(PHP_EOL, $errors) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "Controller boundary test passed\n");
