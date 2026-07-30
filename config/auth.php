<?php
declare(strict_types=1);

use app\enum\SmsType;

return [
    'sms' => [
        // AliyunSms: 阿里云短信服务；AliyunPnvsSms: 号码认证服务的短信认证。
        'type' => SmsType::AliyunPnvsSms,

        // 必须同时满足 APP_DEBUG=true 才会生效；生产环境不会绕过验证码。
        'debug_bypass' => false,

        'code_length' => 6,
        'valid_time' => 300,
        'interval' => 60,
        'max_attempts' => 5,
        'country_code' => '86',

        'aliyun_sms' => [
            'sign_name' => '',
            'template_code' => '',
        ],

        'aliyun_pnvs_sms' => [
            'scheme_name' => '',
            'sign_name' => '速通互联验证服务',
            'template_code' => '100001',
        ],
    ],
];
