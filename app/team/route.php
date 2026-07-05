<?php
use think\facade\Route;

// me
Route::get('me/get', 'me/get');
Route::post('me/edit', 'me/edit');

// member
Route::get('member/index', 'member/index');
Route::get('member/get', 'member/get');
Route::post('member/add', 'member/add');
Route::post('member/edit', 'member/edit');
Route::post('member/block', 'member/block');
Route::post('member/unblock', 'member/unblock');
Route::post('member/remove', 'member/remove');

// notice
Route::get('notice/index', 'notice/index');
Route::get('notice/get', 'notice/get');
Route::post('notice/confirm', 'notice/confirm');
Route::post('notice/confirmAll', 'notice/confirmAll');
Route::post('notice/receive', 'notice/receive');
Route::post('notice/receiveAll', 'notice/receiveAll');

// memberField
Route::get('memberField/index', 'memberField/index');
Route::get('memberField/get', 'memberField/get');
Route::post('memberField/add', 'memberField/add');
Route::post('memberField/edit', 'memberField/edit');
Route::post('memberField/delete', 'memberField/delete');
Route::get('memberField/values', 'memberField/values');
Route::post('memberField/saveValues', 'memberField/saveValues');

// setting
Route::get('setting', 'Setting/index');
Route::post('setting', 'Setting/save');

// postType (JwtAuth in controller)
Route::get('postType/index', 'postType/index');
Route::get('postType/get', 'postType/get');
Route::post('postType/add', 'postType/add');
Route::post('postType/edit', 'postType/edit');
Route::post('postType/delete', 'postType/delete');

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
Route::post('doc/<id>/delete', 'Doc/deleteLegacy')->pattern(['id' => '\d+']);
Route::post('doc/<id>', 'Doc/edit')->pattern(['id' => '\d+']);
Route::post('doc/:id/delete', 'Doc/deleteLegacy')->pattern(['id' => '\d+']);
Route::post('doc/:id', 'Doc/edit')->pattern(['id' => '\d+']);
Route::get('doc/<id>', 'Doc/get')->pattern(['id' => '\d+']);
Route::get('doc/:id', 'Doc/get')->pattern(['id' => '\d+']);
