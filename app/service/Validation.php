<?php
declare(strict_types=1);

namespace app\service;

use think\exception\HttpException;
use think\Validate;

final class Validation
{
    public function check(Validate $validator, array $data): void
    {
        if (!$validator->check($data)) {
            throw new HttpException(422, $validator->getError());
        }
    }
}
