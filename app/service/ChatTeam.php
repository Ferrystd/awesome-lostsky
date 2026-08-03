<?php
declare(strict_types=1);

namespace app\service;

use app\model\Team;
use app\model\TeamCustomer;
use app\model\TeamMember;
use app\enum\TeamMemberStatus;

class ChatTeam
{
    public function list(int $userId): array
    {
        $memberTeams = TeamMember::where('user_id', $userId)
            ->where('status', TeamMemberStatus::Active->value)
            ->column('team_id');
        $customerTeams = TeamCustomer::where('user_id', $userId)->where('is_blocked', 0)->column('team_id');
        $teamIds = array_values(array_unique(array_merge($memberTeams, $customerTeams)));
        if (!$teamIds) {
            return [];
        }
        $memberMap = array_fill_keys($memberTeams, true);
        $customerMap = array_fill_keys($customerTeams, true);
        $result = [];
        $teams = Team::active()->whereIn('id', $teamIds)->with(['identity', 'profile'])->select()->all();
        usort($teams, static fn (Team $left, Team $right): int => strcmp(
            (string) $left->display_name,
            (string) $right->display_name
        ));
        foreach ($teams as $team) {
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
