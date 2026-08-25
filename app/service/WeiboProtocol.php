<?php
declare(strict_types=1);

namespace app\service;

use app\enum\WeiboReason;
use app\exception\WeiboRemoteException;
use app\model\WeiboAccount;

class WeiboProtocol
{
    public const API_BASE = 'https://api.weibo.cn/2';
    public const OPEN_APP_URL = 'https://weibointl.api.weibo.cn/portal.php?ct=user&a=open_app';
    public const MOBILE_SEARCH_URL = 'https://m.weibo.cn/api/container/getIndex';
    public const IMAGE_UPLOAD_URL = 'https://picupload.weibo.com/interface/upload.php';
    public const SOURCE = 'weicoabroad';
    public const PIN = 'CypCHG2kSlRkdvr2RG1QF8b2lCWXl7k7';
    public const APP_KEY = '4215535043';
    public const IMAGE_APP_ID = '339644097';

    public function generateS(string $uid, string $from): string
    {
        if ($uid === '' || $from === '') throw new \InvalidArgumentException('uid 和 from 不能为空');
        $source = hash('sha512', self::PIN . $uid . $from);
        $indexes = hash('sha512', $from);
        $result = '';
        $index = 0;
        for ($i = 0; $i < 8; $i++) {
            $index += hexdec($indexes[$index]);
            $result .= $source[$index];
        }
        return $result;
    }

    public function media(array $pids): array
    {
        if (count($pids) > 9) throw new \InvalidArgumentException('每条微博最多 9 张图片');
        return array_map(static function ($pid): array {
            if (!is_string($pid)) throw new \InvalidArgumentException('图片 pid 格式无效');
            $pid = trim($pid);
            if (!preg_match('/^[0-9A-Za-z_-]+$/', $pid)) throw new \InvalidArgumentException('图片 pid 格式无效');
            return ['bypass' => 'unistore.image', 'createtype' => 'localfile', 'filterName' => '', 'stickerID' => '', 'fid' => $pid, 'type' => 'pic', 'filterID' => '', 'picStatus' => 0];
        }, $pids);
    }

    public function dynamicFrom(): string
    {
        [$payload] = $this->request('GET', self::OPEN_APP_URL);
        $value = is_array($payload['data'] ?? null) ? trim($this->text($payload['data']['dynamic_android_from'] ?? null) ?? '') : '';
        if ($value === '') throw new WeiboRemoteException(WeiboReason::BadResponse, 'open_app 响应缺少 dynamic_android_from');
        return $value;
    }

    public function sendLoginSms(string $phone): array
    {
        $phone = $this->phone($phone);
        $from = $this->dynamicFrom();
        [$payload, $status] = $this->request('POST', self::API_BASE . '/account/login_sendcode', ['form' => [
            'c' => self::SOURCE, 'from' => $from, 'lang' => 'zh_CN', 'locale' => 'zh_CN', 'phone' => $phone,
        ]]);
        $result = $this->classify($payload, $status);
        if ($result['reason'] !== WeiboReason::Ok) throw new WeiboRemoteException($result['reason'], $result['message'], $result['code'], $status);
        return ['phone' => $phone, 'from_value' => $from];
    }

    public function login(string $phone, string $code, string $from): array
    {
        $phone = $this->phone($phone);
        if (!preg_match('/^\d{4,8}$/', $code)) throw new \InvalidArgumentException('验证码必须为 4 至 8 位数字');
        [$payload, $status] = $this->request('POST', self::API_BASE . '/account/login', ['form' => [
            'c' => self::SOURCE, 'i' => '0000000', 'getuser' => 1, 'getoauth' => 1, 'getcookie' => 1,
            'phone' => $phone, 'smscode' => $code, 'lang' => 'zh_CN', 'locale' => 'zh_CN', 'from' => $from,
        ]]);
        if (empty($payload['gsid'])) {
            $result = $this->classify($payload, $status);
            throw new WeiboRemoteException($result['reason'] === WeiboReason::Ok ? WeiboReason::BadResponse : $result['reason'], $result['message'], $result['code'], $status);
        }
        $user = is_array($payload['user'] ?? null) ? $payload['user'] : [];
        $oauth = is_array($payload['oauth'] ?? null) ? $payload['oauth'] : [];
        $uid = $this->text($payload['uid'] ?? $user['idstr'] ?? $user['id'] ?? null) ?? '';
        $gsid = $this->text($payload['gsid'] ?? null) ?? '';
        if ($uid === '') throw new WeiboRemoteException(WeiboReason::BadResponse, '登录响应缺少 uid', null, $status);
        if ($gsid === '') throw new WeiboRemoteException(WeiboReason::BadResponse, '登录响应缺少 gsid', null, $status);
        return [
            'phone' => $phone, 'uid' => $uid, 'gsid' => $gsid, 'from_value' => $from,
            'screen_name' => $this->text($payload['screen_name'] ?? $user['screen_name'] ?? null) ?? '',
            'oauth_token' => $this->text($payload['access_token'] ?? $oauth['access_token'] ?? null) ?? '',
            'cookie_json' => $payload['cookie'] ?? null, 'user_json' => $user,
        ];
    }

    /** @return array{valid:?bool,reason:WeiboReason,message:string,code:?string,http_status:int} */
    public function check(WeiboAccount $account): array
    {
        try {
            [$payload, $status] = $this->request('GET', self::API_BASE . '/users/show', ['query' => $this->auth($account) + ['uid' => $account->uid]]);
            $result = $this->classify($payload, $status);
            $uid = $this->first($payload, ['idstr', 'id', 'uid']);
            if ($uid !== null && $uid === $account->uid) return ['valid' => true, 'reason' => WeiboReason::Ok, 'message' => '登录态有效', 'code' => null, 'http_status' => $status];
            if ($uid !== null) return ['valid' => null, 'reason' => WeiboReason::BadResponse, 'message' => '认证接口返回了不匹配的 UID', 'code' => null, 'http_status' => $status];
            $invalid = in_array($result['reason'], [WeiboReason::LoginInvalid, WeiboReason::AccountBlocked], true);
            return ['valid' => $invalid ? false : null, 'reason' => $result['reason'], 'message' => $result['message'], 'code' => $result['code'], 'http_status' => $status];
        } catch (WeiboRemoteException $exception) {
            return ['valid' => null, 'reason' => $exception->reason, 'message' => $exception->getMessage(), 'code' => $exception->remoteCode, 'http_status' => $exception->httpStatus ?? 0];
        }
    }

    public function resolveSupertopic(string $name): array
    {
        $name = trim($name);
        if (str_starts_with($name, '#') && str_ends_with($name, '#')) $name = trim(substr($name, 1, -1));
        $name = trim(preg_replace('/\s*\[超话\]\s*$/u', '', $name) ?? '');
        if ($name === '') throw new \InvalidArgumentException('超话名不能为空');
        [$payload, $status] = $this->request('GET', self::MOBILE_SEARCH_URL, ['query' => ['containerid' => "100103type=1&q=#{$name}#", 'page_type' => 'searchall']]);
        $result = $this->classify($payload, $status);
        if ($status >= 400 || !in_array($result['reason'], [WeiboReason::Ok, WeiboReason::Unknown], true)) throw new WeiboRemoteException($result['reason'], $result['message'], $result['code'], $status);
        $ids = [];
        $walk = function ($value) use (&$walk, &$ids): void {
            if (!is_array($value)) return;
            foreach ($value as $key => $item) {
                $candidate = $this->text($item);
                if (($key === 'containerid' || $key === 'container_id') && $candidate !== null && preg_match('/^100808[0-9a-f]+$/i', $candidate)) $ids[] = $candidate;
                else $walk($item);
            }
        };
        $walk($payload);
        $ids = array_values(array_unique($ids));
        if (count($ids) !== 1) throw new WeiboRemoteException(count($ids) ? WeiboReason::BadResponse : WeiboReason::SupertopicNotFound, count($ids) ? '超话候选不唯一' : '没有找到超话');
        return ['name' => $name, 'container_id' => $ids[0], 'topic_id' => substr($ids[0], 6), 'display_tag' => "#{$name}[超话]#"];
    }

    public function statusIdFromUrl(string $url): string
    {
        $parts = parse_url(trim($url));
        if (!is_array($parts)) throw new \InvalidArgumentException('微博帖子链接格式无效');
        $scheme = strtolower($this->text($parts['scheme'] ?? null) ?? '');
        $host = strtolower(rtrim($this->text($parts['host'] ?? null) ?? '', '.'));
        if (!in_array($scheme, ['http', 'https'], true)) throw new \InvalidArgumentException('微博帖子链接必须使用 http 或 https');
        $segments = array_values(array_filter(explode('/', trim($this->text($parts['path'] ?? null) ?? '', '/')), static fn(string $segment): bool => $segment !== ''));
        $token = null;
        $base62 = false;
        if (in_array($host, ['weibo.com', 'www.weibo.com'], true)) {
            if (($segments[0] ?? null) === 'status') $token = $segments[1] ?? null;
            elseif (isset($segments[0], $segments[1]) && preg_match('/^\d+$/', $segments[0])) { $token = $segments[1]; $base62 = true; }
        } elseif ($host === 'm.weibo.cn' && in_array($segments[0] ?? null, ['detail', 'status'], true)) {
            $token = $segments[1] ?? null;
        }
        if (!is_string($token) || (!preg_match('/^\d{1,32}$/', $token) && !preg_match('/^[0-9A-Za-z]{1,12}$/', $token))) throw new \InvalidArgumentException('请填写微博正文页链接');
        return !$base62 && preg_match('/^\d+$/', $token) ? $this->statusId($token) : $this->statusId($this->base62StatusId($token));
    }

    public function upload(WeiboAccount $account, string $path, string $contentType = 'application/octet-stream'): array
    {
        if (!is_file($path)) throw new \InvalidArgumentException('上传图片不存在');
        $binary = file_get_contents($path);
        if ($binary === false || $binary === '') throw new \InvalidArgumentException('上传图片为空');
        $sub = $this->cookieValue($account->getData('cookie_json'), 'SUB');
        if (!$sub) throw new \InvalidArgumentException('账号缺少图片上传所需 SUB Cookie');
        $query = ['file_source' => 1, 'cs' => sprintf('%u', crc32($binary)), 'ent' => 'miniblog', 'appid' => self::IMAGE_APP_ID,
            'uid' => $account->uid, 'raw_md5' => md5($binary), 'ori' => 1, 'mpos' => 1, 'nick' => $account->screen_name,
            'pri' => 0, 'request_id' => sprintf('%.0f', round(microtime(true) * 1000)), 'file_size' => strlen($binary)];
        [$payload, $status] = $this->request('POST', self::IMAGE_UPLOAD_URL, ['query' => $query, 'body' => $binary, 'headers' => ['Content-Type: application/octet-stream', 'Cookie: SUB=' . $sub, 'Origin: https://weibo.com', 'Referer: https://weibo.com/']]);
        $pic = is_array($payload['pic'] ?? null) ? $payload['pic'] : [];
        $pid = $this->first($payload, ['pic_id', 'pid']) ?? $this->first($pic, ['pic_id', 'pid']);
        if (!$pid) {
            $result = $this->classify($payload, $status);
            throw new WeiboRemoteException($result['reason'] === WeiboReason::Ok ? WeiboReason::BadResponse : $result['reason'], $result['message'], $result['code'], $status);
        }
        return ['pid' => $pid, 'content_type' => $contentType, 'byte_count' => strlen($binary)];
    }

    /** @return array{content:string,content_type:string} */
    public function imageContent(string $pid): array
    {
        $pid = trim($pid);
        if (!preg_match('/^[0-9A-Za-z_-]+$/', $pid)) throw new \InvalidArgumentException('图片 pid 格式无效');
        $curl = curl_init("https://wx1.sinaimg.cn/large/{$pid}.jpg");
        curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => false, CURLOPT_TIMEOUT => 20, CURLOPT_USERAGENT => 'LostSky-Weibo-Media-Proxy/1.0']);
        $content = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $contentType = curl_getinfo($curl, CURLINFO_CONTENT_TYPE);
        if (!is_int($status)) $status = 0;
        if (!is_string($contentType)) $contentType = '';
        $error = curl_error($curl);
        curl_close($curl);
        if ($content === false) throw new WeiboRemoteException(WeiboReason::NetworkError, '读取微博图片失败: ' . $error, null, $status ?: null);
        if ($status !== 200 || !str_starts_with(strtolower($contentType), 'image/')) throw new WeiboRemoteException(WeiboReason::HttpError, "微博图片代理返回异常 (HTTP {$status})", sprintf('%d', $status), $status);
        if (strlen($content) > 25 * 1024 * 1024) throw new WeiboRemoteException(WeiboReason::BadResponse, '微博图片超过代理大小限制', null, $status);
        return ['content' => $content, 'content_type' => strtok($contentType, ';') ?: 'application/octet-stream'];
    }

    public function post(WeiboAccount $account, array $topic, string $content, array $pids = []): array
    {
        $content = trim($content);
        if ($content === '') throw new \InvalidArgumentException('正文不能为空');
        return $this->write('/statuses/send', $account, ['content' => $topic['display_tag'] . ' ' . $content, 'lat' => 0, 'long' => 0, 'media' => json_encode($this->media($pids), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), 'topic_id' => $topic['topic_id'], 'visible' => 0], 'status');
    }

    public function checkin(WeiboAccount $account, array $topic): array
    {
        $containerId = $this->text($topic['container_id'] ?? null) ?? '';
        if (!preg_match('/^100808[0-9a-f]{32}$/i', $containerId)) throw new \InvalidArgumentException('超话 pageid 格式无效');
        $auth = $this->auth($account);
        [$payload, $status] = $this->request('GET', self::API_BASE . '/page/button', ['query' => $auth + [
            'oldS' => $auth['s'], 'mix_media_enable' => 1, 'source' => self::APP_KEY, 'locale' => 'zh_CN',
            'request_url' => 'http://i.huati.weibo.com/mobile/super/active_checkin?pageid=' . $containerId,
        ]]);
        $body = is_array($payload['data'] ?? null) ? $payload['data'] : $payload;
        $code = $this->text($body['result'] ?? null);
        $message = $this->first($body, ['msg', 'errmsg', 'error', 'message']) ?? '';
        if ($code === '1') return ['success' => true, 'reason' => WeiboReason::Ok, 'message' => $message ?: '签到成功', 'code' => $code, 'http_status' => $status];
        $reason = match ($code) {
            '388000' => WeiboReason::CaptchaRequired,
            '402002', '402003' => WeiboReason::ServiceBusy,
            '402004' => WeiboReason::InteractionRequired,
            default => null,
        };
        if ($reason === null) {
            $classified = $this->classify($code === null ? $body : $body + ['error_code' => $code], $status);
            $reason = $classified['reason'] === WeiboReason::Ok ? ($code === null ? WeiboReason::BadResponse : WeiboReason::Unknown) : $classified['reason'];
            $message = $message ?: $classified['message'];
        }
        return ['success' => false, 'reason' => $reason, 'message' => $message ?: '超话签到返回未识别结果', 'code' => $code, 'http_status' => $status];
    }

    public function like(WeiboAccount $account, string $statusId): array
    {
        $statusId = $this->statusId($statusId);
        $result = $this->write('/like/set_like', $account, ['id' => $statusId], null);
        $result['status_id'] = $statusId;
        return $result;
    }

    public function comment(WeiboAccount $account, string $statusId, string $comment): array
    {
        $statusId = $this->statusId($statusId);
        if (trim($comment) === '') throw new \InvalidArgumentException('评论不能为空');
        $result = $this->write('/comments/create', $account, ['source' => self::APP_KEY, 'id' => $statusId, 'comment' => trim($comment)], 'comment');
        $result['status_id'] = $statusId;
        return $result;
    }

    private function write(string $path, WeiboAccount $account, array $form, ?string $idKind): array
    {
        [$payload, $status] = $this->request('POST', self::API_BASE . $path, ['form' => $this->auth($account) + $form]);
        $classified = $this->classify($payload, $status);
        $nested = is_array($payload['data'] ?? null) ? $payload['data'] : [];
        $id = $this->first($payload, ['idstr', 'mid', 'id']) ?? $this->first($nested, ['idstr', 'mid', 'id']);
        if ($classified['reason'] === WeiboReason::Ok && $idKind !== null && !$id) $classified = ['reason' => WeiboReason::BadResponse, 'message' => '响应无错误但缺少远程 ID', 'code' => null];
        return ['success' => $classified['reason'] === WeiboReason::Ok, 'reason' => $classified['reason'], 'message' => $classified['message'], 'code' => $classified['code'], 'http_status' => $status, $idKind === 'comment' ? 'comment_id' : 'status_id' => $id];
    }

    /** @return array{reason:WeiboReason,message:string,code:?string} */
    public function classify(array $payload, int $httpStatus = 200): array
    {
        $code = $this->first($payload, ['errno', 'error_code', 'errcode', 'code']);
        $message = $this->first($payload, ['errmsg', 'error', 'msg', 'error_description', 'message']) ?? '';
        $lower = mb_strtolower($message . ' ' . ($this->text($payload['url'] ?? null) ?? ''));
        $error = !in_array($code, [null, '', '0', '200', '100000'], true) || !empty($payload['error']) || !empty($payload['error_description']) || (array_key_exists('ok', $payload) && !in_array($payload['ok'], [1, '1', true], true));
        if ($httpStatus < 400 && !$error) return ['reason' => WeiboReason::Ok, 'message' => $message ?: '成功', 'code' => $code];
        $contains = static fn(array $needles): bool => array_reduce($needles, static fn(bool $carry, string $needle): bool => $carry || str_contains($lower, mb_strtolower($needle)), false);
        $reason = match (true) {
            $code === '8513', $contains(['验证码获取次数已超限', '验证码超过次数限制']) => WeiboReason::SmsCodeRequestLimitExceeded,
            $contains(['超话主持人', '被超话', '超话禁言', 'supertopic banned', 'blocked by host']) => WeiboReason::SupertopicBlocked,
            $contains(['封禁', '封号', '冻结', 'banned', 'suspended', 'frozen']) => WeiboReason::AccountBlocked,
            in_array($code, ['21314','21315','21316','21317','21319','21327','21332'], true), $contains(['gsid失效', 'gsid已过期', 'invalid gsid', 'expired gsid', 'token expired', 'login expired', 'not logged in', '未登录', '登录失效', '登录过期']) => WeiboReason::LoginInvalid,
            in_array($code, ['10023','10024','10025','10027','20016','20019','20032'], true), $contains(['rate limit', 'too frequent', 'too fast', '频繁', '太快']) => WeiboReason::RateLimited,
            $contains(['超话不存在', '话题不存在', 'supertopic not found', 'topic not found']) => WeiboReason::SupertopicNotFound,
            in_array($code, ['20031','100003'], true), $contains(['captcha', 'geetest', '需要验证码', '安全验证']) => WeiboReason::CaptchaRequired,
            in_array($code, ['20006','20008','20012','20013','20014','20017','20018'], true), $contains(['内容重复', '重复内容', '内容为空', '内容过长', '非法内容', '敏感词', 'content duplicate']) => WeiboReason::ContentRejected,
            in_array($code, ['10014','10033','21321'], true), $contains(['permission', '无权限', '权限不足']) => WeiboReason::PermissionDenied,
            $httpStatus >= 400 => WeiboReason::HttpError,
            default => WeiboReason::Unknown,
        };
        return ['reason' => $reason, 'message' => $message ?: "微博返回错误 (HTTP {$httpStatus})", 'code' => $code];
    }

    protected function request(string $method, string $url, array $options = []): array
    {
        if (!empty($options['query'])) $url .= (str_contains($url, '?') ? '&' : '?') . http_build_query($options['query']);
        $curl = curl_init($url);
        $headers = $options['headers'] ?? [];
        $headers[] = 'Accept: application/json';
        curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => $headers, CURLOPT_USERAGENT => 'WeiboOverseas/6.4.7 (Android; private-client compatibility)']);
        if (isset($options['form'])) curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($options['form']));
        elseif (array_key_exists('body', $options)) curl_setopt($curl, CURLOPT_POSTFIELDS, $options['body']);
        $raw = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        if (!is_int($status)) $status = 0;
        $error = curl_error($curl);
        curl_close($curl);
        if ($raw === false) throw new WeiboRemoteException(WeiboReason::NetworkError, '请求微博失败: ' . $error, null, $status ?: null);
        $payload = json_decode($raw, true);
        if (!is_array($payload)) throw new WeiboRemoteException($status >= 400 ? WeiboReason::HttpError : WeiboReason::BadResponse, "微博返回了非 JSON 响应 (HTTP {$status})", sprintf('%d', $status), $status);
        return [$payload, $status];
    }

    private function auth(WeiboAccount $account): array
    {
        $from = $this->accountText($account, 'from_value');
        return ['c' => self::SOURCE, 'from' => $from, 'gsid' => $this->accountText($account, 'gsid'), 'lang' => 'zh_CN', 's' => $this->generateS($account->uid, $from)];
    }

    private function first(array $payload, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = $this->text($payload[$key] ?? null);
            if ($value !== null && $value !== '') return $value;
        }
        return null;
    }

    private function text(mixed $value): ?string
    {
        if (is_string($value)) return $value;
        if (is_int($value)) return sprintf('%d', $value);
        if (is_float($value)) return rtrim(rtrim(sprintf('%.14F', $value), '0'), '.');
        return null;
    }

    private function accountText(WeiboAccount $account, string $field): string
    {
        $value = $account->getData($field);
        if (!is_string($value) || $value === '') throw new \InvalidArgumentException("账号缺少 {$field}");
        return $value;
    }
    private function phone(string $phone): string { $phone = preg_replace('/[\s-]+/', '', $phone) ?? ''; if (!preg_match('/^\+?\d{6,20}$/', $phone)) throw new \InvalidArgumentException('手机号格式无效'); return ltrim($phone, '+'); }
    private function statusId(string $id): string { $id = trim($id); if (!preg_match('/^\d{1,32}$/', $id)) throw new \InvalidArgumentException('微博 ID 格式无效'); return $id; }
    private function base62StatusId(string $value): string
    {
        $alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $parts = [];
        for ($end = strlen($value); $end > 0; $end -= 4) $parts[] = substr($value, max(0, $end - 4), min(4, $end));
        $parts = array_reverse($parts);
        $decoded = '';
        foreach ($parts as $position => $part) {
            $number = 0;
            foreach (str_split($part) as $character) {
                $index = strpos($alphabet, $character);
                if ($index === false) throw new \InvalidArgumentException('微博帖子链接格式无效');
                $number = $number * 62 + $index;
            }
            $chunk = sprintf('%d', $number);
            $decoded .= $position === 0 ? $chunk : str_pad($chunk, 7, '0', STR_PAD_LEFT);
        }
        return ltrim($decoded, '0') ?: '0';
    }
    private function cookieValue(mixed $value, string $name): ?string { if (is_array($value)) { if (isset($value[$name]) && is_string($value[$name]) && $value[$name] !== '') return $value[$name]; foreach ($value as $child) if ($found = $this->cookieValue($child, $name)) return $found; } elseif (is_string($value) && preg_match('/(?:^|[;,]\s*)' . preg_quote($name, '/') . '=([^;]+)/', $value, $match)) return $match[1]; return null; }

    private function uuid(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
    }

}
