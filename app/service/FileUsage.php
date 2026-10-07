<?php
declare(strict_types=1);
namespace app\service;

use app\model\Base;
use app\model\File as FileModel;
use think\exception\HttpException;
use think\facade\Config;

/** Only rendered attachment fields count as actual use, never arbitrary text URLs. */
final class FileUsage
{
    private const FIELDS = [
        'TeamEntityProfile' => ['avatar', 'intro_image', 'intro_video', 'introduction_markdown'],
        'Document' => ['content'],
        'CommunityPost' => ['content'],
        'CommunityComment' => ['content'],
        'CommunityAnnouncement' => ['content'],
        'TeamProduct' => ['cover_image', 'introduction_markdown'],
        'TeamEntityFieldValue' => ['value_string'],
        'TeamJoinFieldValue' => ['value_string', 'value_json'],
        'TeamServiceFieldValue' => ['value_string'],
        'TeamOrder' => ['purchase_fields'],
    ];

    public function tracks(Base $model): bool
    {
        return isset(self::FIELDS[(new \ReflectionClass($model))->getShortName()]);
    }

    /** Platform user management can retain existing attachments but cannot claim new team files. */
    public function assertNoNewInternalReferences(string $before, string $after): void
    {
        $domain = rtrim((string) Config::get('aliyun.oss_domain'), '/');
        if ($domain === '') $domain = 'https://' . Config::get('aliyun.bucket') . '.oss-' . Config::get('aliyun.region') . '.aliyuncs.com';
        $base = preg_replace('~^https?:~', '', $domain) . '/';
        $owned = fn (string $markdown): array => array_values(array_filter(array_map(fn ($url) => preg_replace('~^https?:~', '', $url), $this->markdownUrls($markdown)), fn ($url) => str_starts_with($url, $base)));
        if (array_diff($owned($after), $owned($before))) throw new HttpException(422, '平台账号不能新增团队附件，请使用有效人员在 Community 上传和发布');
    }

    public function activateSaved(Base $model, array $changed): void
    {
        $name = (new \ReflectionClass($model))->getShortName();
        $fields = array_values(array_intersect(self::FIELDS[$name], $changed));
        if (!$fields) return;
        // Re-read persisted fields: ignored/readonly inputs cannot activate files.
        $saved = $model::where('id', $model->id)->find();
        if (!$saved) return;
        $teamId = (int) ($saved->getData()['team_id'] ?? 0);
        if (in_array($name, ['TeamEntityProfile', 'Document', 'CommunityPost', 'CommunityComment'], true)) {
            $identity = \app\model\Entity::find(in_array($name, ['CommunityPost', 'CommunityComment'], true) ? $saved->author_entity_id : $saved->entity_id);
            $teamId = $identity?->entityable_type === 'team'
                ? (int) $identity->entityable_id : (int) ($identity?->entityable?->team_id ?? 0);
        } elseif ($name === 'CommunityAnnouncement') {
            $teamId = (int) ($saved->attachment_team_id ?? 0);
        } elseif ($name === 'TeamJoinFieldValue') {
            $teamId = (int) $saved->application->team_id;
        } elseif ($name === 'TeamServiceFieldValue') {
            $teamId = (int) $saved->instance->team_id;
        }
        if (in_array($name, ['TeamEntityFieldValue', 'TeamServiceFieldValue'], true)
            && $saved->field->value_type !== 'image' && $saved->field->input_type !== 'upload') return;
        if ($name === 'TeamJoinFieldValue' && $saved->field->input_type !== 'upload') return;
        $values = [];
        foreach ($fields as $field) {
            if ($name === 'TeamOrder') {
                foreach ((array) $saved->purchase_fields as $item) {
                    if (($item['value_type'] ?? '') === 'image' || ($item['input_type'] ?? '') === 'upload') {
                        $values[] = $item['value'] ?? null;
                    }
                }
            } elseif ($field === 'content' || $field === 'introduction_markdown') {
                $markdown = (string) $saved->getAttr($field);
                foreach ($this->markdownUrls($markdown) as $url) $values[] = $url;
            } else $values[] = $saved->getAttr($field);
        }
        $urls = [];
        $collect = function ($value) use (&$collect, &$urls): void {
            if (is_array($value)) { foreach ($value as $item) $collect($item); return; }
            if (!is_string($value)) return;
            preg_match_all('~(?:https?:)?//[^\s<>"\'()]+~u', $value, $matches);
            foreach ($matches[0] as $url) $urls[$url] = true;
        };
        foreach ($values as $value) $collect($value);
        if (!$urls) return;
        $domain = rtrim((string) Config::get('aliyun.oss_domain'), '/');
        if ($domain === '') $domain = 'https://' . Config::get('aliyun.bucket') . '.oss-' . Config::get('aliyun.region') . '.aliyuncs.com';
        $paths = [];
        foreach (array_keys($urls) as $url) {
            $canonical = preg_replace('~^https?:~', '', $url);
            $base = preg_replace('~^https?:~', '', $domain);
            if (str_starts_with($canonical, $base . '/')) {
                $paths[] = rawurldecode(explode('?', substr($canonical, strlen($base) + 1))[0]);
            }
        }
        if (!$paths) return;
        if ($teamId < 1 || !\app\model\Team::where('id', $teamId)->lock(true)->find()) {
            throw new HttpException(422, '文件所属团队不可用');
        }
        foreach (array_unique($paths) as $path) {
            $file = FileModel::where('path', $path)->lock(true)->find();
            if ($name === 'CommunityAnnouncement' && $file && $file->pending_until === null) {
                $retained = array_filter($this->markdownUrls($model->previousContent), function ($url) use ($base, $path) {
                    $canonical = preg_replace('~^https?:~', '', $url);
                    return str_starts_with($canonical, $base . '/') && rawurldecode(explode('?', substr($canonical, strlen($base) + 1))[0]) === $path;
                });
                if ($retained) continue;
            }
            if (!$file || (int) $file->team_id !== $teamId) throw new HttpException(422, '文件不存在或不属于当前团队');
            if ($file->pending_until === null) continue;
            if ((int) $file->pending_until <= time()) throw new HttpException(422, '文件已过期，请重新上传');
            app(File::class)->checkAbility($teamId, (int) $file->size);
            $file->save(['pending_until' => null]);
        }
    }
    private function markdownUrls(string $markdown): array
    {
        // Match code fences with a closing fence at least as long as the opening.
        $lines = preg_split('/\r?\n/', $markdown);
        $plain = [];
        $fence = null;
        $listIndents = [];
        foreach ($lines as $line) {
            // List continuation indentation belongs to the container, not an indented code block.
            if (preg_match('/^( *)(?:[-+*]|\d+[.)]) +(.*)$/', $line, $list)) {
                while ($listIndents && end($listIndents) > strlen($list[1])) array_pop($listIndents);
                $listIndents[] = strlen($line) - strlen($list[2]);
                $line = $list[2];
            } elseif ($listIndents && trim($line) !== '') {
                preg_match('/^ */', $line, $indent);
                while ($listIndents && end($listIndents) > strlen($indent[0])) array_pop($listIndents);
                if ($listIndents) $line = substr($line, end($listIndents));
            }
            if ($fence !== null) {
                if (preg_match('/^ {0,3}' . preg_quote($fence[0], '/') . '{' . $fence[1] . ',}\s*$/', $line)) $fence = null;
                continue;
            }
            if (preg_match('/^ {0,3}(`{3,}|~{3,})/', $line, $match)) {
                $fence = [$match[1][0], strlen($match[1])];
                continue;
            }
            if (preg_match('/^(?: {4}|\t)/', $line)) continue;
            $plain[] = $line;
        }
        $markdown = implode("\n", $plain);
        $markdown = preg_replace('/<!--.*?-->/s', '', $markdown);
        $markdown = preg_replace('/(`+).*?\1/s', '', $markdown);
        $url = '(?:https?:)?//[^\s<>\)"\']+';
        $urls = [];
        preg_match_all('~(?<!\\\\)!?\[[^\]\n]*\]\(\s*<?(' . $url . ')>?(?:\s+["\'][^"\']*["\'])?\s*\)~u', $markdown, $nodes);
        foreach ($nodes[1] as $value) $urls[] = $value;
        $definitions = [];
        preg_match_all('~^ {0,3}\[([^\]\n]+)\]:\s*<?(' . $url . ')>?~mu', $markdown, $refs, PREG_SET_ORDER);
        foreach ($refs as $ref) $definitions[strtolower(trim(preg_replace('/\s+/', ' ', $ref[1])))] = $ref[2];
        // Full, collapsed and shortcut reference nodes.
        $body = preg_replace('~^ {0,3}\[[^\]\n]+\]:.*$~m', '', $markdown);
        preg_match_all('~(?<!\\\\)!?\[([^\]\n]+)\](?:\[([^\]\n]*)\])?(?!\()~u', $body, $nodes, PREG_SET_ORDER);
        foreach ($nodes as $node) {
            $key = strtolower(trim(preg_replace('/\s+/', ' ', ($node[2] ?? '') !== '' ? $node[2] : $node[1])));
            if (isset($definitions[$key])) $urls[] = $definitions[$key];
        }
        // The renderer permits sanitized HTML img/a elements; comments are not nodes.
        $body = preg_replace('/<!--.*?-->/s', '', $body);
        preg_match_all('~<(?:img|a)\b[^>]*>~i', $body, $tags);
        foreach ($tags[0] as $tag) {
            $attribute = str_starts_with(strtolower($tag), '<img') ? 'src' : 'href';
            if (preg_match('~\b' . $attribute . '\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s>]+))~i', $tag, $match)) {
                $urls[] = html_entity_decode($match[1] !== '' ? $match[1] : (($match[2] ?? '') !== '' ? $match[2] : ($match[3] ?? '')), ENT_QUOTES | ENT_HTML5);
            }
        }
        return $urls;
    }

}
