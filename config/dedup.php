<?php

// 防重复提交中间件配置
return [
    // 哈希有效期（秒），超过此时间的记录会被清理
    'expire_seconds'      => 300,

    // 随机清理概率分母，1 / cleanup_probability 的几率触发清理
    'cleanup_probability' => 100,
];
