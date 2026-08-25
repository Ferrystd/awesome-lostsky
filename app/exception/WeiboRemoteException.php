<?php
declare(strict_types=1);

namespace app\exception;

use app\enum\WeiboReason;

final class WeiboRemoteException extends \RuntimeException
{
    public function __construct(
        public readonly WeiboReason $reason,
        string $message,
        public readonly ?string $remoteCode = null,
        public readonly ?int $httpStatus = null
    ) {
        parent::__construct($message);
    }
}
