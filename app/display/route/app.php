<?php
use think\facade\Route;

// profile
Route::get('profile/get', 'profile/get');

// entity
Route::get('entity/index', 'entity/index');
Route::get('entity/get', 'entity/get');
Route::get('entity/resolve', 'entity/resolve');

// document
Route::get('document/index', 'document/index');
Route::get('document/get', 'document/get');
