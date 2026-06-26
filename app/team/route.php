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
