<?php
declare(strict_types=1);

namespace app\command;

use BackedEnum;
use JsonException;
use ReflectionClass;
use ReflectionEnum;
use ReflectionMethod;
use ReflectionNamedType;
use ReflectionParameter;
use ReflectionType;
use ReflectionUnionType;
use Throwable;
use ValueError;
use think\console\Command;
use think\console\Input;
use think\console\input\Argument;
use think\console\input\Option;
use think\console\Output;
use think\exception\HttpException;

class CallService extends Command
{
    protected function configure()
    {
        $this->setName('service:call')
            ->addArgument('service', Argument::OPTIONAL, 'app\service 下的短类名')
            ->addArgument('method', Argument::OPTIONAL, '要调用的 public 方法名')
            ->addOption('params', null, Option::VALUE_OPTIONAL, '按参数名传入的 JSON 对象', '{}')
            ->setDescription('直接调用 app\service 下可由 JSON 绑定参数的 public 方法');
    }

    protected function execute(Input $input, Output $output)
    {
        try {
            $service = (string) $input->getArgument('service');
            $method = (string) $input->getArgument('method');
            if ($service === '' || $method === '') {
                throw new HttpException(422, 'Service and method are required');
            }

            $class = $this->resolveService($service);
            $reflection = $this->resolveMethod($class, $method);
            $arguments = $this->bindArguments(
                $reflection,
                $this->decodeParams((string) $input->getOption('params'))
            );

            $target = $reflection->isStatic() ? null : app($class);
            $result = $reflection->invokeArgs($target, $arguments);
            $this->writeJson($output, [
                'code' => 0,
                'message' => 'ok',
                'data' => $result,
            ]);

            return 0;
        } catch (Throwable $exception) {
            $httpCode = method_exists($exception, 'getStatusCode')
                ? (int) $exception->getStatusCode()
                : 500;
            $this->writeJson($output, [
                'code' => 1,
                'message' => $exception->getMessage(),
                'data' => ['http_code' => $httpCode],
            ]);

            return 1;
        }
    }

    /**
     * @return class-string
     */
    private function resolveService(string $service): string
    {
        if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/D', $service)) {
            throw new HttpException(404, "Service not found: {$service}");
        }

        $class = "app\\service\\{$service}";
        if (!class_exists($class)) {
            throw new HttpException(404, "Service not found: {$service}");
        }

        $reflection = new ReflectionClass($class);
        $serviceDirectory = realpath(dirname(__DIR__) . DIRECTORY_SEPARATOR . 'service');
        $classDirectory = $reflection->getFileName()
            ? realpath(dirname((string) $reflection->getFileName()))
            : false;
        if (
            $reflection->getNamespaceName() !== 'app\\service'
            || $reflection->getShortName() !== $service
            || $serviceDirectory === false
            || $classDirectory === false
            || !$this->samePath($serviceDirectory, $classDirectory)
        ) {
            throw new HttpException(404, "Service not found: {$service}");
        }

        return $class;
    }

    /**
     * @param class-string $class
     */
    private function resolveMethod(string $class, string $method): ReflectionMethod
    {
        if (
            !preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/D', $method)
            || str_starts_with($method, '__')
            || !method_exists($class, $method)
        ) {
            throw new HttpException(404, "Service method not found: {$method}");
        }

        $reflection = new ReflectionMethod($class, $method);
        if (
            !$reflection->isPublic()
            || $reflection->getName() !== $method
            || $reflection->getDeclaringClass()->getNamespaceName() !== 'app\\service'
        ) {
            throw new HttpException(404, "Service method not found: {$method}");
        }

        return $reflection;
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeParams(string $json): array
    {
        $json = trim($json);
        if ($json === '' || $json[0] !== '{') {
            throw new HttpException(422, 'The params option must be a JSON object');
        }

        try {
            $params = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new HttpException(422, 'Invalid params JSON: ' . $exception->getMessage());
        }

        if (!is_array($params)) {
            throw new HttpException(422, 'The params option must be a JSON object');
        }

        return $params;
    }

    /**
     * @param array<string, mixed> $params
     * @return list<mixed>
     */
    private function bindArguments(ReflectionMethod $method, array $params): array
    {
        $parameters = [];
        foreach ($method->getParameters() as $parameter) {
            if ($parameter->isVariadic()) {
                throw new HttpException(422, "Variadic parameter is not supported: {$parameter->getName()}");
            }
            $parameters[$parameter->getName()] = $parameter;
        }

        $unknown = array_diff_key($params, $parameters);
        if ($unknown !== []) {
            throw new HttpException(422, 'Unknown parameter: ' . (string) array_key_first($unknown));
        }

        $arguments = [];
        foreach ($parameters as $name => $parameter) {
            if (array_key_exists($name, $params)) {
                $arguments[] = $this->convertParameter($parameter, $params[$name]);
            } elseif ($parameter->isDefaultValueAvailable()) {
                $arguments[] = $parameter->getDefaultValue();
            } else {
                throw new HttpException(422, "Missing required parameter: {$name}");
            }
        }

        return $arguments;
    }

    private function convertParameter(ReflectionParameter $parameter, mixed $value): mixed
    {
        $type = $parameter->getType();
        if ($type === null) {
            return $value;
        }

        $match = $this->matchType($type, $value);
        if (!$match['supported']) {
            throw new HttpException(
                422,
                "Unsupported parameter type for {$parameter->getName()}: {$type}"
            );
        }
        if (!$match['matched']) {
            throw new HttpException(
                422,
                "Parameter {$parameter->getName()} does not match type {$type}"
            );
        }

        return $match['value'];
    }

    /**
     * @return array{supported: bool, matched: bool, value: mixed, score: int}
     */
    private function matchType(ReflectionType $type, mixed $value): array
    {
        if ($type instanceof ReflectionNamedType) {
            return $this->matchNamedType($type, $value);
        }
        if (!$type instanceof ReflectionUnionType) {
            return $this->noMatch(false);
        }
        if ($value === null && $type->allowsNull()) {
            return $this->match(null);
        }

        $supported = false;
        $matches = [];
        foreach ($type->getTypes() as $member) {
            if ($member->getName() === 'null') {
                continue;
            }
            $candidate = $this->matchNamedType($member, $value);
            $supported = $supported || $candidate['supported'];
            if ($candidate['matched']) {
                $matches[] = $candidate;
            }
        }
        if ($matches === []) {
            return $this->noMatch($supported);
        }

        usort($matches, static fn (array $left, array $right): int => $left['score'] <=> $right['score']);
        if (isset($matches[1]) && $matches[0]['score'] === $matches[1]['score']) {
            return $this->noMatch(true);
        }

        return $matches[0];
    }

    /**
     * @return array{supported: bool, matched: bool, value: mixed, score: int}
     */
    private function matchNamedType(ReflectionNamedType $type, mixed $value): array
    {
        if ($value === null) {
            return $type->allowsNull() ? $this->match(null) : $this->noMatch(true);
        }

        $name = $type->getName();
        if ($type->isBuiltin()) {
            return match ($name) {
                'mixed' => $this->match($value, 100),
                'int' => is_int($value) ? $this->match($value) : $this->noMatch(true),
                'float' => is_float($value)
                    ? $this->match($value)
                    : (is_int($value) ? $this->match((float) $value, 1) : $this->noMatch(true)),
                'string' => is_string($value) ? $this->match($value) : $this->noMatch(true),
                'bool' => is_bool($value) ? $this->match($value) : $this->noMatch(true),
                'array' => is_array($value) ? $this->match($value) : $this->noMatch(true),
                default => $this->noMatch(false),
            };
        }

        if (!enum_exists($name) || !is_subclass_of($name, BackedEnum::class)) {
            return $this->noMatch(false);
        }

        $backingType = (new ReflectionEnum($name))->getBackingType();
        if ($backingType === null) {
            return $this->noMatch(false);
        }
        $backingValue = $this->matchNamedType($backingType, $value);
        if (!$backingValue['matched']) {
            return $this->noMatch(true);
        }

        try {
            return $this->match($name::from($backingValue['value']));
        } catch (ValueError) {
            return $this->noMatch(true);
        }
    }

    /**
     * @return array{supported: bool, matched: bool, value: mixed, score: int}
     */
    private function match(mixed $value, int $score = 0): array
    {
        return ['supported' => true, 'matched' => true, 'value' => $value, 'score' => $score];
    }

    /**
     * @return array{supported: bool, matched: bool, value: null, score: int}
     */
    private function noMatch(bool $supported): array
    {
        return ['supported' => $supported, 'matched' => false, 'value' => null, 'score' => 0];
    }

    private function samePath(string $left, string $right): bool
    {
        return DIRECTORY_SEPARATOR === '\\'
            ? strcasecmp($left, $right) === 0
            : $left === $right;
    }

    /**
     * @param array{code: int, message: string, data: mixed} $payload
     */
    private function writeJson(Output $output, array $payload): void
    {
        $output->writeln(json_encode(
            $payload,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
        ));
    }
}
