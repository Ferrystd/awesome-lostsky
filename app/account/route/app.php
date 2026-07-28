<?php
use think\facade\Route;

// login
Route::post('login/phone', 'login/phone');
Route::post('login/password', 'login/password');
Route::post('login/refresh', 'login/refresh');

// devices (JwtAuth + Context)
Route::post('devices/quit', 'devices/quit');
Route::post('devices/quitAll', 'devices/quitAll');

// identity (JwtAuth + Context)
Route::get('identity/candidates', 'identity/candidates');
Route::post('identity/receive', 'identity/receive');
Route::post('identity/drop', 'identity/drop');
Route::post('identity/member', 'identity/member');

// team (JwtAuth + Context)
Route::get('team/index', 'team/index');
Route::post('team/add', 'team/add');

// register
Route::post('register/phone', 'register/phone');
