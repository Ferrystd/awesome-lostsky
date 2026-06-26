<?php
use think\facade\Route;

Route::post('upload', 'Upload/upload');

Route::get('doc', 'Document/index');
Route::get('doc/<id>', 'Document/get')->pattern(['id' => '\d+']);
Route::post('doc', 'Document/create');
Route::post('doc/<id>', 'Document/edit');
Route::post('doc/<id>/delete', 'Document/delete');
