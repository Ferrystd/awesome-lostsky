<?php
use think\facade\Route;

Route::get('actor', 'Actor/index');
Route::get('actor/search', 'Actor/search');
Route::post('integration/message', 'Integration/send');

Route::get('conversation', 'Conversation/index');
Route::get('conversation/get', 'Conversation/get');
Route::post('conversation/create', 'Conversation/create');
Route::get('conversation/invitation', 'Conversation/invitations');
Route::post('conversation/invitation/accept', 'Conversation/acceptInvitation');
Route::post('conversation/invitation/reject', 'Conversation/rejectInvitation');
Route::post('conversation/leave', 'Conversation/leave');

Route::get('block', 'Block/index');
Route::post('block/create', 'Block/create');
Route::post('block/delete', 'Block/delete');

Route::get('message', 'Message/index');
Route::post('message/send', 'Message/send');
Route::post('message/edit', 'Message/edit');
Route::post('message/revoke', 'Message/revoke');
Route::post('message/read', 'Message/read');

Route::post('realtime/connect', 'Realtime/connect');
Route::post('realtime/subscribe', 'Realtime/subscribe');
