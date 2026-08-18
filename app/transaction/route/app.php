<?php
use think\facade\Route;

Route::pattern(['id' => 'int']);

Route::get('workspace/access', 'Workspace/access')->completeMatch();
Route::get('personal/transaction-options', 'Personal/transactionOptions')->completeMatch();
Route::get('personal/transactions', 'Personal/transactions')->completeMatch();
Route::get('personal/transactions/<id>', 'Personal/transaction')->completeMatch();
Route::get('personal/stats', 'Personal/stats')->completeMatch();
Route::get('personal/services', 'Personal/services')->completeMatch();
Route::get('personal/services/available', 'Personal/availableServices')->completeMatch();
Route::get('personal/services/available/<id>', 'Personal/availableService')->completeMatch();
Route::post('personal/services/<id>/claim', 'Personal/claimService')->completeMatch();
Route::post('personal/services/<id>/return', 'Personal/returnService')->completeMatch();
Route::post('personal/services/<id>/complete', 'Personal/completeService')->completeMatch();
Route::get('personal/services/<id>', 'Personal/service')->completeMatch();
Route::get('personal/service-offers', 'Personal/serviceOffers')->completeMatch();
Route::get('personal/service-offers/<id>', 'Personal/serviceOffer')->completeMatch();
Route::post('personal/service-offers/<id>/accept', 'Personal/acceptServiceOffer')->completeMatch();
Route::post('personal/service-offers/<id>/reject', 'Personal/rejectServiceOffer')->completeMatch();
Route::get('personal/customers', 'Personal/customers')->completeMatch();
Route::get('personal/entitlements', 'EntitlementGrant/personalHistory')->completeMatch();
Route::get('personal/entitlement-grant/options', 'EntitlementGrant/personalOptions')->completeMatch();
Route::post('personal/entitlement-grant', 'EntitlementGrant/personalCreate')->completeMatch();

// transaction
Route::get('transaction', 'Transaction/index')->completeMatch();
Route::get('transaction/stats', 'Transaction/stats')->completeMatch();
Route::get('transaction/options', 'Options/index')->completeMatch();
Route::get('transaction/invite', 'Options/invite')->completeMatch();
Route::get('transaction/<id>', 'Transaction/get')->completeMatch();
Route::post('transaction', 'Transaction/create')->completeMatch();
Route::post('transaction/<id>', 'Transaction/edit')->completeMatch();
Route::post('transaction/<id>/delete', 'Transaction/delete')->completeMatch();

Route::get('entitlement-grant/options', 'EntitlementGrant/options')->completeMatch();
Route::post('entitlement-grant', 'EntitlementGrant/create')->completeMatch();

Route::get('service', 'Service/index')->completeMatch();
Route::get('service/<id>', 'Service/get')->completeMatch();
Route::get('service/<id>/handlers', 'Service/handlers')->completeMatch();
Route::post('service/<id>/reassign', 'Service/reassign')->completeMatch();
Route::post('service/<id>/cancel/approve', 'Service/approveCancel')->completeMatch();
Route::post('service/<id>/cancel/reject', 'Service/rejectCancel')->completeMatch();
Route::post('service/<id>/complete', 'Service/complete')->completeMatch();
Route::post('service/<id>/reject', 'Service/reject')->completeMatch();
Route::post('service/<id>/adjustments', 'Service/createAdjustment')->completeMatch();
Route::post('service/<id>/adjustments/<adjustment_id>/cancel', 'Service/cancelAdjustment')->completeMatch();

// balance
Route::get('transaction/balance/logs', 'Balance/logs')->completeMatch();
Route::post('transaction/balance/recharge', 'Balance/recharge')->completeMatch();
