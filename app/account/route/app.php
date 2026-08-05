<?php
use think\facade\Route;

// login
Route::post('login/phone', 'login/phone');
Route::post('login/sms', 'login/sms');
Route::post('login/password', 'login/password');
Route::post('login/refresh', 'login/refresh');

// SMS verification
Route::post('verification/sms', 'verification/sms');

// devices (JwtAuth + Context)
Route::post('devices/quit', 'devices/quit');
Route::post('devices/quitAll', 'devices/quitAll');

// identity (JwtAuth + Context)
Route::get('identity/candidates', 'identity/candidates');
Route::post('identity/receive', 'identity/receive');
Route::post('identity/drop', 'identity/drop');
Route::post('identity/member', 'identity/member');
Route::get('identity/current', 'currentIdentity/current');
Route::post('identity/current/profile', 'currentIdentity/profile');
Route::post('identity/current/slug', 'currentIdentity/slug');
Route::post('identity/current/fields', 'currentIdentity/fields');
Route::get('identity/current/customer-assignees', 'currentIdentity/assignees');
Route::post('identity/current/upload', 'currentIdentity/upload');

// team (JwtAuth + Context)
Route::get('team/index', 'team/index');
Route::post('team/add', 'team/add');

// register
Route::post('register/phone', 'register/phone');
Route::post('register/sms', 'register/phone');
