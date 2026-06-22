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

// postType (JwtAuth in controller)
Route::get('postType/index', 'postType/index');
Route::get('postType/get', 'postType/get');
Route::post('postType/add', 'postType/add');
Route::post('postType/edit', 'postType/edit');
Route::post('postType/delete', 'postType/delete');
