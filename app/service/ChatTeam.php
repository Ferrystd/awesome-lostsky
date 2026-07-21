<?php
declare(strict_types=1);

namespace app\service;

use app\model\Team;
use app\model\TeamCustomer;
use app\model\TeamMember;

class ChatTeam
{
    public function list(int $userId): array
    {
        $memberTeams = TeamMember::where('user_id', $userId)->where('is_blocked', 0)->column('team_id');
        $customerTeams = TeamCustomer::where('user_id', $userId)->where('is_blocked', 0)->column('team_id');
        $teamIds = array_values(array_unique(array_merge($memberTeams, $customerTeams)));
        if (!$teamIds) {
            return [];
        }
        $memberMap = array_fill_keys($memberTeams, true);
        $customerMap = array_fill_keys($customerTeams, true);
        $result = [];
        foreach (Team::active()->whereIn('id', $teamIds)->order('display_name', 'asc')->select() as $team) {
            $result[] = [
                'slug' => $team->slug, 'display_name' => $team->display_name,
                'as_member' => isset($memberMap[(int) $team->id]),
                'as_customer' => isset($customerMap[(int) $team->id]),
                'href' => "//{$team->slug}.chat.lostsky.work/",
            ];
        }
        return $result;
    }
}
