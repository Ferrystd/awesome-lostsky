<?php

$keywords = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('WEIBO_FEED_KEYWORDS', '陪玩,荣耀茶话会超话,交易'))
)));

return [
    'keywords' => $keywords,
    'retention_seconds' => max(3600, (int) env('WEIBO_FEED_RETENTION_SECONDS', 86400)),
    'batch_limit' => max(1, min(200, (int) env('WEIBO_FEED_BATCH_LIMIT', 100))),
    'max_pages' => max(1, min(20, (int) env('WEIBO_FEED_MAX_PAGES', 5))),
    'classification_retries' => max(1, min(10, (int) env('WEIBO_FEED_CLASSIFICATION_RETRIES', 3))),
    'intent_threshold' => max(0.0, min(1.0, (float) env('WEIBO_FEED_INTENT_THRESHOLD', 0.46))),
    'classifier_url' => (string) env('WEIBO_FEED_CLASSIFIER_URL', 'http://127.0.0.1:8765/classify'),
    'classifier_timeout' => max(10, min(600, (int) env('WEIBO_FEED_CLASSIFIER_TIMEOUT', 180))),
    'classifier_batch_size' => max(1, min(100, (int) env('WEIBO_FEED_CLASSIFIER_BATCH_SIZE', 100))),
    'classifier_model' => (string) env('WEIBO_FEED_CLASSIFIER_MODEL', 'weibo-feed-macbert-round3'),
    'classifier_model_sha256' => (string) env('WEIBO_FEED_CLASSIFIER_MODEL_SHA256', '39ae921da06ce92e41519745a3f6f96e8055f439cbe03f754098a2cb7f6b2a57'),
    'classifier_max_length' => max(1, (int) env('WEIBO_FEED_CLASSIFIER_MAX_LENGTH', 160)),
    'classifier_preprocess_version' => (string) env('WEIBO_FEED_CLASSIFIER_PREPROCESS_VERSION', 'remove-first-leading-supertopic-v1'),
    'classifier_preprocess_fingerprint' => (string) env('WEIBO_FEED_CLASSIFIER_PREPROCESS_FINGERPRINT', '16d7c94edc197e5620acd410c58f0fbeeff5917e503d88d0c96a0dc461bbb565'),
    'typesafe_api_key' => (string) env('TYPESAFE_API_KEY', ''),
    'typesafe_model' => (string) env('TYPESAFE_MODEL', 'jev-latest'),
    'request_timeout' => max(3, min(60, (int) env('WEIBO_FEED_REQUEST_TIMEOUT', 15))),
];
