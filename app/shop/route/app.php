<?php
use think\facade\Route;

Route::pattern(['id' => 'int']);
Route::pattern(['field_id' => 'int']);
Route::pattern(['code_id' => 'int']);

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

// merchant management
Route::get('manage/access', 'Manage/access')->completeMatch();
Route::get('personal/orders', 'Personal/orders')->completeMatch();
Route::get('personal/orders/<id>', 'Personal/order')->completeMatch();
Route::get('personal/products', 'PersonalProduct/index')->completeMatch();
Route::get('personal/products/options', 'PersonalProduct/options')->completeMatch();
Route::post('personal/products', 'PersonalProduct/create')->completeMatch();
Route::get('personal/products/<id>', 'PersonalProduct/get')->completeMatch();
Route::post('personal/products/<id>', 'PersonalProduct/edit')->completeMatch();
Route::post('personal/products/<id>/handlers', 'PersonalProduct/setHandlers')->completeMatch();
Route::get('personal/services', 'PersonalEntitlement/services')->completeMatch();
Route::get('personal/services/<id>', 'PersonalEntitlement/service')->completeMatch();
Route::post('personal/services', 'PersonalEntitlement/saveService')->completeMatch();
Route::post('personal/services/<id>', 'PersonalEntitlement/saveService')->completeMatch();
Route::get('personal/services/<id>/handlers', 'PersonalEntitlement/serviceHandlers')->completeMatch();
Route::post('personal/services/<id>/handlers', 'PersonalEntitlement/saveServiceHandlers')->completeMatch();
Route::post('personal/services/<id>/disable', 'PersonalEntitlement/disableService')->completeMatch();
Route::get('personal/packages', 'PersonalEntitlement/packages')->completeMatch();
Route::get('personal/packages/<id>', 'PersonalEntitlement/package')->completeMatch();
Route::post('personal/packages', 'PersonalEntitlement/savePackage')->completeMatch();
Route::post('personal/packages/<id>', 'PersonalEntitlement/savePackage')->completeMatch();
Route::post('personal/packages/<id>/disable', 'PersonalEntitlement/disablePackage')->completeMatch();
Route::get('personal/campaigns', 'PersonalEntitlement/campaigns')->completeMatch();
Route::get('personal/campaigns/<id>', 'PersonalEntitlement/campaign')->completeMatch();
Route::post('personal/campaigns', 'PersonalEntitlement/saveCampaign')->completeMatch();
Route::post('personal/campaigns/<id>', 'PersonalEntitlement/saveCampaign')->completeMatch();
Route::post('personal/campaigns/<id>/disable', 'PersonalEntitlement/disableCampaign')->completeMatch();
Route::get('personal/campaigns/<id>/codes', 'PersonalEntitlement/codes')->completeMatch();
Route::post('personal/campaigns/<id>/codes', 'PersonalEntitlement/issueCodes')->completeMatch();
Route::post('personal/campaigns/<id>/codes/<code_id>/reveal', 'PersonalEntitlement/revealCode')->completeMatch();
Route::post('personal/campaigns/<id>/codes/<code_id>/disable', 'PersonalEntitlement/disableCode')->completeMatch();
Route::get('manage/options', 'Manage/options')->completeMatch();
Route::get('manage/services', 'Manage/services')->completeMatch();
Route::get('manage/services/<id>', 'Manage/service')->completeMatch();
Route::post('manage/services', 'Manage/saveService')->completeMatch();
Route::post('manage/services/<id>', 'Manage/saveService')->completeMatch();
Route::get('manage/services/<id>/handlers', 'Manage/serviceHandlers')->completeMatch();
Route::post('manage/services/<id>/handlers', 'Manage/saveServiceHandlers')->completeMatch();
Route::post('manage/services/<id>/disable', 'Manage/disableService')->completeMatch();
Route::get('manage/packages', 'Manage/packages')->completeMatch();
Route::get('manage/packages/<id>', 'Manage/package')->completeMatch();
Route::post('manage/packages', 'Manage/savePackage')->completeMatch();
Route::post('manage/packages/<id>', 'Manage/savePackage')->completeMatch();
Route::post('manage/packages/<id>/disable', 'Manage/disablePackage')->completeMatch();
Route::get('manage/campaigns', 'Manage/campaigns')->completeMatch();
Route::get('manage/campaigns/<id>', 'Manage/campaign')->completeMatch();
Route::post('manage/campaigns', 'Manage/saveCampaign')->completeMatch();
Route::post('manage/campaigns/<id>', 'Manage/saveCampaign')->completeMatch();
Route::post('manage/campaigns/<id>/disable', 'Manage/disableCampaign')->completeMatch();
Route::get('manage/campaigns/<id>/codes', 'Manage/codes')->completeMatch();
Route::post('manage/campaigns/<id>/codes', 'Manage/issueCodes')->completeMatch();
Route::post('manage/campaigns/<id>/codes/<code_id>/reveal', 'Manage/revealCode')->completeMatch();
Route::post('manage/campaigns/<id>/codes/<code_id>/disable', 'Manage/disableCode')->completeMatch();

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
Route::post('customer/upload', 'Customer/upload')->completeMatch();
Route::get('customer/assignees', 'Customer/assignees')->completeMatch();
Route::post('customer/slug', 'Customer/slug')->completeMatch();
Route::get('customer/orders', 'Customer/orders')->completeMatch();
Route::post('customer/orders', 'Customer/purchase')->completeMatch();
Route::get('customer/orders/<id>', 'Customer/order')->completeMatch();
Route::post('customer/orders/<id>/cancel', 'Customer/cancelOrder')->completeMatch();
Route::get('customer/transactions', 'Customer/transactions')->completeMatch();
Route::get('customer/balance', 'Customer/balance')->completeMatch();
Route::get('customer/balance/logs', 'Customer/balanceLogs')->completeMatch();
Route::get('customer/services', 'Customer/services')->completeMatch();
Route::get('customer/services/<id>', 'Customer/service')->completeMatch();
Route::get('customer/services/<id>/handlers', 'Customer/serviceHandlers')->completeMatch();
Route::post('customer/services/<id>/start', 'Customer/startService')->completeMatch();
Route::post('customer/services/<id>/offers', 'Customer/createServiceOffer')->completeMatch();
Route::post('customer/service-offers/<id>/withdraw', 'Customer/withdrawServiceOffer')->completeMatch();
Route::post('customer/service-redemptions/<id>/start', 'Customer/restartService')->completeMatch();
Route::post('customer/service-redemptions/<id>/cancel', 'Customer/cancelService')->completeMatch();
Route::post('customer/service-redemptions/<id>/complete', 'Customer/confirmServiceCompletion')->completeMatch();
Route::post('customer/service-redemptions/<id>/completion/reject', 'Customer/rejectServiceCompletion')->completeMatch();
Route::post('customer/service-redemptions/<id>/adjustments/<adjustment_id>/accept', 'Customer/acceptServiceAdjustment')->completeMatch();
Route::post('customer/service-redemptions/<id>/adjustments/<adjustment_id>/reject', 'Customer/rejectServiceAdjustment')->completeMatch();
Route::get('customer/cards', 'Customer/cards')->completeMatch();
Route::post('customer/cards/claim', 'Customer/claimCard')->completeMatch();
Route::post('customer/cards/<id>/reveal', 'Customer/revealCard')->completeMatch();
