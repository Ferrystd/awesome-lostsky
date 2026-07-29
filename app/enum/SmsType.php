<?php
declare(strict_types=1);

namespace app\enum;

enum SmsType: string
{
    case AliyunSms = 'aliyun_sms';
    case AliyunPnvsSms = 'aliyun_pnvs_sms';
}
