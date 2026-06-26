<?php
return [
    'access_key_id'     => env('ALIYUN_ACCESS_KEY_ID', ''),
    'access_key_secret' => env('ALIYUN_ACCESS_KEY_SECRET', ''),
    'bucket'            => env('ALIYUN_OSS_BUCKET', ''),
    'region'            => env('ALIYUN_OSS_REGION', ''),
    'oss_domain'        => env('ALIYUN_OSS_DOMAIN', ''),
];
