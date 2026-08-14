<?php
declare(strict_types=1);

namespace app\service;

use think\exception\HttpException;

final class ServiceQuantity
{
    public const SCALE = 4;
    public const FACTOR = 10000;

    public function scaleForStep(mixed $step): int
    {
        $minor = $this->toMinor($step);
        if ($minor <= 0) throw new HttpException(422, '服务最小步长必须大于零');
        for ($scale = 0; $scale <= self::SCALE; $scale++) {
            if ($minor % (10 ** (self::SCALE - $scale)) === 0) return $scale;
        }
        return self::SCALE;
    }

    public function normalize(mixed $value, mixed $step): string
    {
        $scale = $this->scaleForStep($step);
        $minor = $this->toMinor($value);
        if ($minor <= 0) throw new HttpException(422, '服务数量必须大于零');
        $precisionFactor = 10 ** (self::SCALE - $scale);
        if ($minor % $precisionFactor !== 0) {
            throw new HttpException(422, "服务数量最多保留 {$scale} 位小数");
        }
        $stepMinor = $this->toMinor($step);
        if ($stepMinor <= 0 || $stepMinor % $precisionFactor !== 0) {
            throw new HttpException(422, '服务最小步长与数量精度不匹配');
        }
        if ($minor % $stepMinor !== 0) {
            throw new HttpException(422, '服务数量必须是最小步长的整数倍');
        }
        return $this->fromMinor($minor);
    }

    public function toMinor(mixed $value): int
    {
        if (!is_int($value) && !is_float($value) && !is_string($value)) {
            throw new HttpException(422, '服务数量格式无效');
        }
        $raw = trim((string) $value);
        if (!preg_match('/^(\d+)(?:\.(\d{1,4}))?$/D', $raw, $match)) {
            throw new HttpException(422, '服务数量格式无效');
        }
        return (int) $match[1] * self::FACTOR
            + (int) str_pad($match[2] ?? '', self::SCALE, '0');
    }

    public function fromMinor(int $minor): string
    {
        if ($minor < 0) return '-' . $this->fromMinor(-$minor);
        return intdiv($minor, self::FACTOR) . '.'
            . str_pad((string) ($minor % self::FACTOR), self::SCALE, '0', STR_PAD_LEFT);
    }

    public function display(mixed $value, mixed $step): string
    {
        $scale = $this->scaleForStep($step);
        $minor = $this->toMinor($value);
        if ($scale === 0) return (string) intdiv($minor, self::FACTOR);
        return number_format($minor / self::FACTOR, $scale, '.', '');
    }
}
