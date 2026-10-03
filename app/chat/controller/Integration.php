<?php
declare (strict_types = 1);

namespace app\chat\controller;

class Integration
{
    public function send(\think\Request $request)
    {
        $header = $request->header('Authorization', '');
        $authorization = is_scalar($header) ? (string) $header : '';
        $token = preg_match('/^Bearer\s+(.+)$/i', $authorization, $match) ? trim($match[1]) : '';
        $actor = app(\app\service\ChatIntegration::class)->authenticateActor($token);
        $integration = $actor['integration'];
        $virtual = $actor['virtual'];
        return success(app(\app\service\ChatMessage::class)->send(
            [
                'entity_id' => (int) $virtual->identity->id,
                'type' => 'teamVirtual',
                'id' => (int) $virtual->id,
            ],
            (int) $virtual->identity->id,
            [
                'conversation' => $request->post('conversation', ''),
                'content' => $request->post('content', ''),
                'reply_id' => $request->post('reply_id'),
            ],
            (int) $integration->id
        ));
    }
}
