<?php
use think\facade\Route;

Route::pattern(['id' => 'int']);

Route::get('workspace/access', 'Workspace/access')->completeMatch();
Route::get('personal/transactions', 'Personal/transactions')->completeMatch();
Route::get('personal/transactions/<id>', 'Personal/transaction')->completeMatch();
Route::get('personal/stats', 'Personal/stats')->completeMatch();
Route::get('personal/services', 'Personal/services')->completeMatch();
Route::get('personal/services/available', 'Personal/availableServices')->completeMatch();
Route::get('personal/services/available/<id>', 'Personal/availableService')->completeMatch();
Route::post('personal/services/<id>/claim', 'Personal/claimService')->completeMatch();
Route::post('personal/services/<id>/return', 'Personal/returnService')->completeMatch();
Route::get('personal/services/<id>', 'Personal/service')->completeMatch();
Route::get('personal/service-offers', 'Personal/serviceOffers')->completeMatch();
Route::get('personal/service-offers/<id>', 'Personal/serviceOffer')->completeMatch();
Route::post('personal/service-offers/<id>/accept', 'Personal/acceptServiceOffer')->completeMatch();
Route::post('personal/service-offers/<id>/reject', 'Personal/rejectServiceOffer')->completeMatch();
Route::get('personal/bindings', 'Personal/bindings')->completeMatch();

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
Route::post('service/<id>/adjustments', 'Service/createAdjustment')->completeMatch();
Route::post('service/<id>/adjustments/<adjustment_id>/cancel', 'Service/cancelAdjustment')->completeMatch();

// sender
Route::get('transaction/sender', 'Sender/index');
Route::get('transaction/sender/all', 'Sender/all');
Route::post('transaction/sender/bind', 'Sender/bind');
Route::post('transaction/sender/unbind', 'Sender/unbind');

// balance
Route::get('transaction/balance/logs', 'Balance/logs');
Route::post('transaction/balance/recharge', 'Balance/recharge');
