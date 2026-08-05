<?php
use think\facade\Route;

Route::pattern(['id' => 'int']);

Route::get('access', 'Access/index');
Route::get('dashboard', 'Dashboard/index');
Route::get('ability', 'AbilityCard/index');
Route::post('ability/card/inspect', 'AbilityCard/inspect');
Route::post('ability/card/redeem', 'AbilityCard/redeem');

// me
Route::get('me/get', 'me/get');
Route::post('me/edit', 'me/edit');
Route::post('me/slug', 'me/slug');
Route::post('me/fields', 'me/fields');

// member
Route::get('member/index', 'member/index');
Route::get('member/get', 'member/get');
Route::post('member/add', 'member/add');
Route::post('member/edit', 'member/edit');
Route::post('member/block', 'member/block');
Route::post('member/unblock', 'member/unblock');
Route::post('member/slug', 'member/slug');
Route::post('member/search', 'member/search');

// memberDeparture
Route::get('memberDeparture/index', 'memberDeparture/index');
Route::get('memberDeparture/get', 'memberDeparture/get');
Route::get('memberDeparture/mine', 'memberDeparture/mine');
Route::post('memberDeparture/apply', 'memberDeparture/apply');
Route::post('memberDeparture/depart', 'memberDeparture/depart');
Route::post('memberDeparture/cancel', 'memberDeparture/cancel');
Route::post('memberDeparture/approve', 'memberDeparture/approve');
Route::post('memberDeparture/reject', 'memberDeparture/reject');

// entity
Route::get('entity/search', 'entity/search');
Route::get('entity/resolve', 'entity/resolve');
Route::get('entity/options', 'entity/options');
Route::get('entity/index', 'entity/index');
Route::get('entity/get', 'entity/get');
Route::post('entity/profile', 'entity/profile');
Route::post('entity/display', 'entity/display');
Route::post('entity/visibility', 'entity/visibility');

// customer
Route::get('customer', 'Customer/index')->completeMatch();
Route::get('customer/assignees', 'Customer/assignees')->completeMatch();
Route::get('customer/<id>', 'Customer/get')->completeMatch();
Route::post('customer/<id>', 'Customer/update')->completeMatch();

// role
Route::get('role/index', 'role/index');
Route::get('role/get', 'role/get');
Route::post('role/add', 'role/add');
Route::post('role/edit', 'role/edit');
Route::post('role/delete', 'role/delete');

// rolePermission
Route::get('rolePermission/index', 'rolePermission/index');
Route::get('rolePermission/catalog', 'rolePermission/catalog');
Route::post('rolePermission/save', 'rolePermission/save');

// entityRole
Route::get('entityRole/index', 'EntityRole/index');
Route::get('entityRole/resolve', 'EntityRole/resolve');
Route::post('entityRole/save', 'EntityRole/save');

// notice
Route::get('notice/capabilities', 'notice/capabilities');
Route::get('notice/index', 'notice/index');
Route::get('notice/get', 'notice/get');
Route::post('notice/send', 'notice/send');
Route::post('notice/confirm', 'notice/confirm');
Route::post('notice/confirmAll', 'notice/confirmAll');
Route::post('notice/receive', 'notice/receive');
Route::post('notice/receiveAll', 'notice/receiveAll');

// unified entity fields
Route::get('entityField/index', 'EntityField/index');
Route::get('entityField/get', 'EntityField/get');
Route::post('entityField/create', 'EntityField/create');
Route::post('entityField/update', 'EntityField/update');
Route::post('entityField/delete', 'EntityField/delete');
Route::get('entityField/values', 'EntityField/values');
Route::post('entityField/values', 'EntityField/saveValues');

// chat virtual entities
Route::get('chatVirtual/index', 'ChatVirtual/index');
Route::get('chatVirtual/get', 'ChatVirtual/get');
Route::post('chatVirtual/create', 'ChatVirtual/create');
Route::post('chatVirtual/update', 'ChatVirtual/update');
Route::post('chatVirtual/delete', 'ChatVirtual/delete');
Route::post('chatIntegration/create', 'ChatIntegration/create');
Route::post('chatIntegration/update', 'ChatIntegration/update');
Route::post('chatIntegration/rotate', 'ChatIntegration/rotate');
Route::post('chatIntegration/delete', 'ChatIntegration/delete');

// join
Route::get('join/form', 'join/form');
Route::post('join/apply', 'join/apply');
Route::get('join/mine', 'join/mine');
Route::get('join/get', 'join/get');
Route::post('join/cancel', 'join/cancel');
Route::post('join/upload', 'join/upload');

// joinReview
Route::get('joinReview/index', 'joinReview/index');
Route::get('joinReview/get', 'joinReview/get');
Route::post('joinReview/review', 'joinReview/review');
Route::post('joinReview/reject', 'joinReview/reject');
Route::post('joinReview/approve', 'joinReview/approve');
Route::post('joinReview/saveTasks', 'joinReview/saveTasks');
Route::post('joinReview/setTaskPassed', 'joinReview/setTaskPassed');

// joinField
Route::get('joinField/index', 'joinField/index');
Route::get('joinField/transferOptions', 'joinField/transferOptions');
Route::post('joinField/add', 'joinField/add');
Route::post('joinField/edit', 'joinField/edit');
Route::post('joinField/delete', 'joinField/delete');

// setting
Route::get('setting/schema', 'Setting/schema');
Route::get('setting', 'Setting/index');
Route::post('setting', 'Setting/save');


// file
Route::get('file/index', 'file/index');
Route::get('file/get', 'file/get');
Route::post('file/delete', 'file/delete');
Route::get('file/usage', 'file/usage');

// doc
Route::get('doc', 'Doc/index');
Route::get('doc/get', 'Doc/get');
Route::post('doc/create', 'Doc/create');
Route::post('doc/edit', 'Doc/edit');
Route::post('doc/delete', 'Doc/delete');
