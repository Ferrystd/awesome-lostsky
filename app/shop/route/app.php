<?php
use think\facade\Route;

Route::pattern(['id' => 'int']);

// public storefront
Route::get('storefront', 'Storefront/index')->completeMatch();
Route::get('storefront/products', 'Storefront/products')->completeMatch();
Route::get('storefront/products/<id>', 'Storefront/product')->completeMatch();

// product
Route::get('product', 'Product/index')->completeMatch();
Route::get('product/<id>', 'Product/get')->completeMatch();
Route::post('product', 'Product/create')->completeMatch();
Route::post('product/<id>', 'Product/edit')->completeMatch();
Route::post('product/<id>/delete', 'Product/delete')->completeMatch();
Route::post('product/<id>/handlers', 'Product/setHandlers')->completeMatch();

// order
Route::get('order', 'Order/index')->completeMatch();
Route::get('order/<id>', 'Order/get')->completeMatch();
Route::post('order', 'Order/create')->completeMatch();
Route::post('order/<id>/cancel', 'Order/cancel')->completeMatch();
Route::post('order/<id>/complete', 'Order/complete')->completeMatch();

// customer
Route::post('customer/bind', 'Customer/bind')->completeMatch();
Route::get('customer/me', 'Customer/me')->completeMatch();
Route::post('customer/me', 'Customer/update')->completeMatch();
Route::get('customer/assignees', 'Customer/assignees')->completeMatch();
Route::post('customer/slug', 'Customer/slug')->completeMatch();
Route::get('customer/orders', 'Customer/orders')->completeMatch();
Route::post('customer/orders', 'Customer/purchase')->completeMatch();
Route::get('customer/orders/<id>', 'Customer/order')->completeMatch();
Route::post('customer/orders/<id>/cancel', 'Customer/cancelOrder')->completeMatch();
Route::get('customer/transactions', 'Customer/transactions')->completeMatch();
Route::get('customer/balance', 'Customer/balance')->completeMatch();
Route::get('customer/balance/logs', 'Customer/balanceLogs')->completeMatch();
