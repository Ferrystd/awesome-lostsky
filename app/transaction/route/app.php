<?php
use think\facade\Route;

Route::pattern(['id' => 'int']);

// transaction
Route::get('transaction', 'Transaction/index');
Route::get('transaction/stats', 'Transaction/stats');
Route::get('transaction/options', 'Options/index');
Route::get('transaction/invite', 'Options/invite');
Route::get('transaction/<id>', 'Transaction/get');
Route::post('transaction', 'Transaction/create');
Route::post('transaction/<id>', 'Transaction/edit');
Route::post('transaction/<id>/delete', 'Transaction/delete');

Route::get('service', 'Service/index')->completeMatch();
Route::get('service/<id>', 'Service/get')->completeMatch();
Route::get('service/<id>/handlers', 'Service/handlers')->completeMatch();
Route::post('service/<id>/reassign', 'Service/reassign')->completeMatch();
Route::post('service/<id>/cancel/approve', 'Service/approveCancel')->completeMatch();
Route::post('service/<id>/cancel/reject', 'Service/rejectCancel')->completeMatch();
Route::post('service/<id>/complete', 'Service/complete')->completeMatch();

// sender
Route::get('transaction/sender', 'Sender/index');
Route::get('transaction/sender/all', 'Sender/all');
Route::post('transaction/sender/bind', 'Sender/bind');
Route::post('transaction/sender/unbind', 'Sender/unbind');

// balance
Route::get('transaction/balance/logs', 'Balance/logs');
Route::post('transaction/balance/recharge', 'Balance/recharge');
