<?php
use think\facade\Route;

// product
Route::get('product', 'Product/index');
Route::get('product/<id>', 'Product/get');
Route::post('product', 'Product/create');
Route::post('product/<id>', 'Product/edit');
Route::post('product/<id>/delete', 'Product/delete');
Route::post('product/<id>/handlers', 'Product/setHandlers');

// order
Route::get('order', 'Order/index');
Route::get('order/<id>', 'Order/get');
Route::post('order', 'Order/create');
Route::post('order/<id>/cancel', 'Order/cancel');
Route::post('order/<id>/complete', 'Order/complete');

// customer
Route::get('customer/me', 'Customer/me');
Route::get('customer/orders', 'Customer/orders');
Route::get('customer/transactions', 'Customer/transactions');
Route::get('customer/balance', 'Customer/balance');
Route::get('customer/balance/logs', 'Customer/balanceLogs');
