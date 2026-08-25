<?php
declare(strict_types=1);

namespace app\enum;

enum WeiboReason: string
{
    case Ok = 'ok';
    case NetworkError = 'network_error';
    case HttpError = 'http_error';
    case BadResponse = 'bad_response';
    case LoginInvalid = 'login_invalid';
    case RateLimited = 'rate_limited';
    case SmsCodeRequestLimitExceeded = 'sms_code_request_limit_exceeded';
    case AccountBlocked = 'account_blocked';
    case SupertopicBlocked = 'supertopic_blocked';
    case SupertopicNotFound = 'supertopic_not_found';
    case CaptchaRequired = 'captcha_required';
    case ContentRejected = 'content_rejected';
    case PermissionDenied = 'permission_denied';
    case InteractionRequired = 'interaction_required';
    case ServiceBusy = 'service_busy';
    case Unknown = 'unknown';
}
