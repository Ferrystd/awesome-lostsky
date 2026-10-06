<?php
declare(strict_types=1);

namespace app\service;

use think\exception\HttpException;
use think\facade\Db;
use think\Request;

/** 官网内容整组保存；数组顺序即公开展示顺序。 */
final class SiteContent
{
    public function get(bool $public = false): array
    {
        $raw = Db::name('site_content')->where('id', 1)->value('content');
        $content = $raw === null
            ? json_decode((string) file_get_contents(root_path() . 'config/site-content.json'), true, 512, JSON_THROW_ON_ERROR)
            : json_decode((string) $raw, true, 512, JSON_THROW_ON_ERROR);
        if ($public) {
            foreach (['members', 'stats'] as $key) {
                $content[$key] = array_values(array_filter($content[$key], static fn (array $item): bool => $item['visible']));
            }
        }
        return $content;
    }

    public function save(array $input, Request $request): array
    {
        $content = $this->normalize($input);
        return Db::transaction(function () use ($content, $request): array {
            // Singleton upsert also serializes concurrent first saves.
            Db::execute('INSERT INTO ' . Db::name('site_content')->getTable() . ' (id, content, update_time) VALUES (1, ?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content), update_time = VALUES(update_time)', [json_encode($content, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), time()]);
            app(BusinessAudit::class)->recordPlatform(
                $request->authenticated_user_id, 'site.content.save', 'siteContent', 1,
                ['changed_fields' => ['icp', 'members', 'stats']], $request
            );
            return $content;
        });
    }

    public function normalize(array $input): array
    {
        $this->keys($input, ['icp', 'members', 'stats']);
        $result = ['icp' => $this->text($input['icp'], 100, 'ICP备案号', false)];
        foreach (['members' => 20, 'stats' => 12] as $key => $limit) {
            if (!is_array($input[$key]) || !array_is_list($input[$key]) || count($input[$key]) > $limit) {
                throw new HttpException(422, "{$key} 必须是列表且不超过 {$limit} 项");
            }
            $result[$key] = [];
            foreach ($input[$key] as $item) {
                if (!is_array($item)) throw new HttpException(422, '内容项格式错误');
                $fields = $key === 'members' ? ['name', 'role', 'description', 'tags', 'initials', 'avatar', 'visible'] : ['value', 'label', 'visible'];
                $this->keys($item, $fields);
                if (!is_bool($item['visible'])) throw new HttpException(422, '显示开关必须为布尔值');
                if ($key === 'stats') {
                    $result[$key][] = ['value' => $this->text($item['value'], 30, '指标数值'), 'label' => $this->text($item['label'], 60, '指标名称'), 'visible' => $item['visible']];
                    continue;
                }
                if (!is_array($item['tags']) || !array_is_list($item['tags']) || count($item['tags']) > 8) throw new HttpException(422, '人员标签最多 8 项');
                $avatar = $this->text($item['avatar'], 2048, '头像地址', false);
                if ($avatar !== '' && (!filter_var($avatar, FILTER_VALIDATE_URL) || strtolower((string) parse_url($avatar, PHP_URL_SCHEME)) !== 'https' || parse_url($avatar, PHP_URL_USER) !== null || parse_url($avatar, PHP_URL_PASS) !== null)) throw new HttpException(422, '头像必须使用有效的 HTTPS 地址');
                $initials = $this->text($item['initials'], 8, '姓名缩写', false);
                if ($avatar === '' && $initials === '') throw new HttpException(422, '请填写头像地址或姓名缩写');
                $result[$key][] = [
                    'name' => $this->text($item['name'], 60, '姓名'),
                    'role' => $this->text($item['role'], 100, '职位'),
                    'description' => $this->text($item['description'], 2000, '简介'),
                    'tags' => array_map(fn ($tag): string => $this->text($tag, 30, '标签'), $item['tags']),
                    'initials' => $initials, 'avatar' => $avatar, 'visible' => $item['visible'],
                ];
            }
        }
        return $result;
    }

    private function keys(array $input, array $fields): void
    {
        if (array_diff($fields, array_keys($input)) || array_diff(array_keys($input), $fields)) throw new HttpException(422, '官网内容字段不完整或含有不支持的字段');
    }

    private function text($value, int $max, string $label, bool $required = true): string
    {
        if (!is_string($value)) throw new HttpException(422, "{$label}必须是文本");
        $value = trim($value);
        if (($required && $value === '') || mb_strlen($value) > $max || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value)) throw new HttpException(422, "{$label}不能为空或超过 {$max} 字");
        return $value;
    }
}
