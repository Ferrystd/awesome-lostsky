<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class TeamMemberFieldValue extends Validate
{
    protected $rule = [
        'member_id'      => 'require|integer',
        'values'         => 'require|array',
        'value_string'   => 'max:500',
        'value_text'     => 'max:65535',
        'value_int'      => 'checkInteger',
        'value_bool'     => 'checkBool',
        'value_decimal'  => 'checkDecimal',
        'value_datetime' => 'checkDatetime',
        'value_array'    => 'checkArrayJson',
        'value_json'     => 'checkJson',
    ];

    protected $message = [
        'member_id.require'  => '成员ID不能为空',
        'member_id.integer'  => '成员ID格式不正确',
        'values.require'     => '字段值不能为空',
        'values.array'       => '字段值格式不正确',
        'value_string.max'   => '字段值长度不能超过500位',
        'value_text.max'     => '字段值长度不能超过65535位',
        'value_int.checkInteger' => '字段值必须为整数',
        'value_bool.checkBool' => '字段值必须为布尔值',
        'value_decimal.checkDecimal' => '字段值必须为数字',
        'value_datetime.checkDatetime' => '字段值必须为有效时间',
        'value_array.checkArrayJson' => '字段值必须为数组',
        'value_json.checkJson' => '字段值必须为有效JSON',
    ];

    protected $scene = [
        'save'           => ['member_id', 'values'],
        'value_string'   => ['value_string'],
        'value_text'     => ['value_text'],
        'value_int'      => ['value_int'],
        'value_bool'     => ['value_bool'],
        'value_decimal'  => ['value_decimal'],
        'value_datetime' => ['value_datetime'],
        'value_array'    => ['value_array'],
        'value_json'     => ['value_json'],
    ];

    protected function checkInteger($value): bool
    {
        if ($value === null || $value === '') {
            return true;
        }
        return filter_var($value, FILTER_VALIDATE_INT) !== false;
    }

    protected function checkBool($value): bool
    {
        if ($value === null || $value === '') {
            return true;
        }
        if (is_bool($value)) {
            return true;
        }

        return $value === 0 || $value === 1 || $value === '0' || $value === '1';
    }

    protected function checkDecimal($value): bool
    {
        return $value === null || $value === '' || is_numeric($value);
    }

    protected function checkDatetime($value): bool
    {
        if ($value === null || $value === '') {
            return true;
        }
        if (filter_var($value, FILTER_VALIDATE_INT) !== false) {
            return true;
        }

        return strtotime((string) $value) !== false;
    }

    protected function checkJson($value): bool
    {
        if ($value === null || $value === '') {
            return true;
        }
        if (is_array($value)) {
            return true;
        }
        if (!is_string($value)) {
            return false;
        }

        json_decode($value, true);

        return json_last_error() === JSON_ERROR_NONE;
    }

    protected function checkArrayJson($value): bool
    {
        if ($value === null || $value === '') {
            return true;
        }
        if (is_array($value)) {
            return true;
        }
        if (!is_string($value)) {
            return false;
        }

        $decoded = json_decode($value, true);

        return json_last_error() === JSON_ERROR_NONE && is_array($decoded);
    }
}
