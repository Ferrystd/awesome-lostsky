<?php
use think\facade\Route;

// login
Route::post('login/phone', 'login/phone');
Route::post('login/password', 'login/password');

// devices (JwtAuth + Context)
Route::post('devices/quit', 'devices/quit');
Route::post('devices/quitAll', 'devices/quitAll');

// team (JwtAuth + Context)
Route::get('team/index', 'team/index');
Route::post('team/add', 'team/add');
Route::post('team/delete', 'team/delete');

// register
Route::post('register/phone', 'register/phone');
