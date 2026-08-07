<?php
use think\facade\Route;

Route::get('team', 'Team/index');
Route::get('workspace/access', 'Workspace/access')->completeMatch();
Route::get('actor', 'Actor/index');

Route::get('virtual', 'Virtual/index');
Route::get('virtual/get', 'Virtual/get');
Route::post('virtual/create', 'Virtual/create');
Route::post('virtual/update', 'Virtual/update');
Route::post('virtual/delete', 'Virtual/delete');

Route::post('integration/create', 'Integration/create');
Route::post('integration/update', 'Integration/update');
Route::post('integration/rotate', 'Integration/rotate');
Route::post('integration/delete', 'Integration/delete');
Route::post('integration/message', 'Integration/send');

Route::get('conversation', 'Conversation/index');
Route::get('conversation/get', 'Conversation/get');
Route::post('conversation/create', 'Conversation/create');
Route::post('conversation/close', 'Conversation/close');
Route::post('conversation/participant/add', 'Conversation/addParticipants');
Route::post('conversation/participant/remove', 'Conversation/removeParticipant');

Route::get('message', 'Message/index');
Route::post('message/send', 'Message/send');
Route::post('message/edit', 'Message/edit');
Route::post('message/revoke', 'Message/revoke');
Route::post('message/read', 'Message/read');

Route::post('realtime/connect', 'Realtime/connect');
Route::post('realtime/subscribe', 'Realtime/subscribe');

Route::get('entityField', 'EntityField/index');
Route::post('entityField/create', 'EntityField/create');
Route::get('entityField/values', 'EntityField/values');
Route::post('entityField/values', 'EntityField/saveValues');
