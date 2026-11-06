<?php
use think\facade\Route;

Route::pattern(['id' => 'int']);
Route::pattern(['user_id' => 'int']);
Route::pattern(['code_id' => 'int']);

Route::get('session', 'session/index');
Route::get('search', 'session/search');
Route::get('dashboard', 'dashboard/index');

Route::get('users', 'users/index')->completeMatch();
Route::get('users/<id>', 'users/get');
Route::post('users/<id>/ban', 'users/ban');
Route::post('users/<id>/unban', 'users/unban');
Route::post('users/<id>/revoke-sessions', 'users/revokeSessions');

Route::get('teams', 'teams/index')->completeMatch();
Route::get('teams/<id>', 'teams/get');
Route::post('teams/<id>/ban', 'teams/ban');
Route::post('teams/<id>/unban', 'teams/unban');
Route::get('team-abilities/catalog', 'teams/abilityCatalog');
Route::post('team-abilities', 'teams/grantAbility')->completeMatch();

Route::get('administrators', 'access/administrators');
Route::put('administrators/<user_id>/roles', 'access/assignRoles');
Route::get('permissions', 'access/permissions');
Route::get('roles', 'access/roles')->completeMatch();
Route::post('roles', 'access/createRole')->completeMatch();
Route::get('roles/<id>', 'access/role');
Route::put('roles/<id>', 'access/updateRole')->completeMatch();
Route::delete('roles/<id>', 'access/deleteRole')->completeMatch();
Route::put('roles/<id>/permissions', 'access/savePermissions');

Route::get('audit-events', 'operations/auditEvents');
Route::get('system/health', 'operations/health');
Route::get('site-content', 'siteContent/index');
Route::put('site-content', 'siteContent/save');

Route::get('entitlements/ability-catalog', 'entitlement/catalog');
Route::get('entitlements/packages', 'entitlement/packages')->completeMatch();
Route::get('entitlements/packages/<id>', 'entitlement/package');
Route::post('entitlements/packages', 'entitlement/savePackage')->completeMatch();
Route::post('entitlements/packages/<id>', 'entitlement/savePackage')->completeMatch();
Route::post('entitlements/packages/<id>/disable', 'entitlement/disablePackage');
Route::get('entitlements/campaigns', 'entitlement/campaigns')->completeMatch();
Route::get('entitlements/campaigns/<id>', 'entitlement/campaign')->completeMatch();
Route::post('entitlements/campaigns', 'entitlement/saveCampaign')->completeMatch();
Route::post('entitlements/campaigns/<id>', 'entitlement/saveCampaign')->completeMatch();
Route::post('entitlements/campaigns/<id>/disable', 'entitlement/disableCampaign');
Route::get('entitlements/campaigns/<id>/codes', 'entitlement/codes');
Route::post('entitlements/campaigns/<id>/codes', 'entitlement/issueCodes')->completeMatch();
Route::post('entitlements/campaigns/<id>/codes/<code_id>/reveal', 'entitlement/revealCode');
Route::post('entitlements/campaigns/<id>/codes/<code_id>/disable', 'entitlement/disableCode');

// Community ownership and daily management.
Route::pattern(['post_id' => 'int', 'comment_id' => 'int', 'board_id' => 'int', 'announcement_id' => 'int', 'entity_id' => 'int']);
Route::get('communities', 'Community/index')->completeMatch();
Route::post('communities', 'Community/create')->completeMatch();
Route::get('communities/<id>', 'Community/get')->completeMatch();
Route::post('communities/<id>', 'Community/update')->completeMatch();
Route::get('communities/<id>/administrators', 'Community/administrators')->completeMatch();
Route::post('communities/<id>/administrators', 'Community/addAdministrator')->completeMatch();
Route::post('communities/<id>/administrators/<entity_id>/remove', 'Community/removeAdministrator')->completeMatch();
Route::get('communities/<id>/boards', 'Community/boards')->completeMatch();
Route::get('communities/<id>/boards/<board_id>', 'Community/board')->completeMatch();
Route::get('communities/<id>/announcements', 'Community/announcements')->completeMatch();
Route::get('communities/<id>/announcements/<announcement_id>', 'Community/announcement')->completeMatch();
Route::get('communities/<id>/posts', 'Community/posts')->completeMatch();
Route::get('communities/<id>/comments', 'Community/comments')->completeMatch();
Route::get('communities/<id>/members', 'Community/members')->completeMatch();
Route::post('communities/<id>/boards/<board_id>', 'Community/saveBoard')->completeMatch();
Route::post('communities/<id>/announcements/<announcement_id>', 'Community/saveAnnouncement')->completeMatch();
Route::post('communities/<id>/posts/<post_id>/moderate', 'Community/moderatePost')->completeMatch();
Route::post('communities/<id>/comments/<comment_id>/moderate', 'Community/moderateComment')->completeMatch();
Route::post('communities/<id>/members/<entity_id>/mute', 'Community/mute')->completeMatch();
