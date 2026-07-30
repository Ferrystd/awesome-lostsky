<?php
use think\facade\Route;

Route::pattern(['id' => 'int']);
Route::pattern(['user_id' => 'int']);

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
