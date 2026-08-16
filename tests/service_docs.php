<?php
declare(strict_types=1);

$root = dirname(__DIR__);
require $root . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';

$command = [PHP_BINARY, $root . DIRECTORY_SEPARATOR . 'think', 'docs:services', '--check'];
$descriptors = [
    0 => ['pipe', 'r'],
    1 => ['pipe', 'w'],
    2 => ['pipe', 'w'],
];
$process = proc_open($command, $descriptors, $pipes, $root, null, ['bypass_shell' => true]);
if (!is_resource($process)) {
    throw new RuntimeException('Unable to start docs:services');
}

fclose($pipes[0]);
$stdout = trim(stream_get_contents($pipes[1]));
$stderr = trim(stream_get_contents($pipes[2]));
fclose($pipes[1]);
fclose($pipes[2]);
$exit = proc_close($process);

if ($exit !== 0 || $stderr !== '') {
    fwrite(STDERR, json_encode([
        'exit' => $exit,
        'stdout' => $stdout,
        'stderr' => $stderr,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL);
    exit(1);
}

$document = file_get_contents($root . DIRECTORY_SEPARATOR . 'docs'
    . DIRECTORY_SEPARATOR . 'glossary'
    . DIRECTORY_SEPARATOR . 'service.md');
if ($document === false) {
    fwrite(STDERR, "Unable to read generated Service dictionary\n");
    exit(1);
}

$serviceFiles = glob($root . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . 'service'
    . DIRECTORY_SEPARATOR . '*.php');
if ($serviceFiles === false) {
    fwrite(STDERR, "Unable to read app/service\n");
    exit(1);
}

foreach ($serviceFiles as $serviceFile) {
    $shortName = pathinfo($serviceFile, PATHINFO_FILENAME);
    $className = 'app\\service\\' . $shortName;
    $heading = "## {$shortName}\n";
    $start = strpos($document, $heading);
    if ($start === false) {
        fwrite(STDERR, "Missing Service heading: {$shortName}\n");
        exit(1);
    }
    $next = strpos($document, "\n## ", $start + strlen($heading));
    $section = substr($document, $start, $next === false ? null : $next - $start);
    $reflection = new ReflectionClass($className);
    foreach ($reflection->getMethods(ReflectionMethod::IS_PUBLIC) as $method) {
        if (
            $method->getDeclaringClass()->getName() === $className
            && $method->getName() !== '__construct'
            && !str_contains($section, "| `{$method->getName()}` |")
        ) {
            fwrite(STDERR, "Missing Service method: {$shortName}::{$method->getName()}\n");
            exit(1);
        }
    }
}

echo "Service docs checks passed\n";
