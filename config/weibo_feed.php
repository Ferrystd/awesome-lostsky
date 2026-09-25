<?php

$keywords = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('WEIBO_FEED_KEYWORDS', '陪玩,点单,找陪玩,找人打游戏'))
)));

return [
    'keywords' => $keywords,
    'retention_seconds' => max(3600, (int) env('WEIBO_FEED_RETENTION_SECONDS', 86400)),
    'batch_limit' => max(1, min(200, (int) env('WEIBO_FEED_BATCH_LIMIT', 100))),
    'max_pages' => max(1, min(20, (int) env('WEIBO_FEED_MAX_PAGES', 5))),
    'classification_retries' => max(1, min(10, (int) env('WEIBO_FEED_CLASSIFICATION_RETRIES', 3))),
    'intent_threshold' => max(0.0, min(1.0, (float) env('WEIBO_FEED_INTENT_THRESHOLD', 0.8))),
    'typesafe_api_key' => (string) env('TYPESAFE_API_KEY', ''),
    'typesafe_model' => (string) env('TYPESAFE_MODEL', 'jev-latest'),
    'request_timeout' => max(3, min(60, (int) env('WEIBO_FEED_REQUEST_TIMEOUT', 15))),
];
