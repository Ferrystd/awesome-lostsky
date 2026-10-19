// Deterministic preview-only data. No credential or production API is used.
const time = 1792324800
const paged = list => ({ list, total: list.length, page: 1, limit: 20 })
const role = { id: 1, role_key: 'operator', name: '平台运营', description: '资源核对与日常治理', is_system: 0, permissions: ['admin.dashboard.read', 'admin.user.read'], administrator_count: 2 }
const user = { id: 1, username: 'preview-user', nickname: '青空用户', phone_masked: '139****1234', email_masked: 's***@example.test', is_banned: 0, team_count: 1, device_count: 2, create_time: time, update_time: time }
const team = { id: 1, slug: 'demo', name: '青空协作组', user_id: 1, owner_username: 'preview-user', member_count: 12, is_banned: 0, is_cancelled: 0, create_time: time, update_time: time }
const audit = { id: 1, application: 'admin', action: 'user.sessions.revoke', resource_type: 'user', resource_id: 1, authenticated_user_id: 1, actor_username: 'preview-admin', request_id: 'preview-only', context: { reason: '用户本人请求退出全部设备' }, create_time: time }
const abilities = [{ key: 'transaction', label: '记账', levels: [1] }, { key: 'file', label: '文件', levels: [1, 2, 3] }]
const pack = { id: 1, name: '团队成长权益包', is_active: 1, abilities: [{ id: 1, ability_key: 'transaction', label: '记账', level: 1, duration_days: 30 }] }
const campaign = { id: 1, name: '秋日团队体验', package_id: 1, package: pack, claim_group: 'autumn-preview', mode: 2, total_limit: 100, claimed_count: 12, is_active: 1, redeem_starts_at: time, redeem_ends_at: time + 2592000 }
export function adminFixture(url) {
  const p = url.pathname.replace(/^\/api/, '')
  const data = {
    '/session': { user: { ...user, id: 99 }, roles: [role], permissions: [], is_super_admin: true },
    '/dashboard': { counts: { users: 128, new_users_7d: 9, banned_users: 2, teams: 16, new_teams_7d: 2, banned_teams: 1, administrators: 3, active_sessions: 84 }, recent_users: [user], recent_teams: [team], recent_audit_events: [audit] },
    '/users': paged([user]), '/users/1': { ...user, teams: [team], devices: [{ id: 1, device_name: '桌面浏览器', ua: 'Preview Chromium', last_active_time: time, create_time: time }], roles: [role], audit_events: [audit] },
    '/teams': paged([team]), '/teams/1': { ...team, domains: [], abilities: [{ ability_key: 'transaction', level: 1, expire_time: time + 2592000 }], audit_events: [audit] },
    '/team-abilities/catalog': abilities,
    '/administrators': [{ ...user, roles: [role] }], '/roles': [role], '/roles/1': role,
    '/permissions': { groups: [{ name: '平台资源', items: [{ key: 'admin.dashboard.read', label: '查看平台概览' }, { key: 'admin.user.read', label: '查看用户' }] }, { name: '治理操作', items: [{ key: 'admin.user.moderate', label: '管理用户状态' }] }] },
    '/audit-events': paged([audit]),
    '/system/health': { status: 'healthy', checked_at: time, checks: [{ key: 'api', name: 'API 服务', status: 'healthy', message: '正常' }, { key: 'database', name: '数据库', status: 'healthy', message: '正常' }], backlogs: { chat_outbox_pending: 0 } },
    '/site-content': { icp: '示例备案信息', members: [{ name: '青空', role: '运营负责人', description: '协调团队服务与日常协作。', tags: ['团队协作', '服务运营'], initials: '青空', avatar: '', visible: true }], stats: [{ label: '协作经验', value: '持续积累', visible: true }] },
    '/entitlements/ability-catalog': abilities, '/entitlements/packages': paged([pack]), '/entitlements/packages/1': pack,
    '/entitlements/campaigns': paged([campaign]), '/entitlements/campaigns/1': campaign,
    '/entitlements/campaigns/1/codes': paged([{ id: 1, code_hint: 'PREV…2026', code_masked: 'PREV…2026', is_active: 1, claimed_count: 12, create_time: time }]),
  }
  return Object.hasOwn(data, p) ? data[p] : undefined
}
const entity = { id: 11, entity_id: 11, entityable_id: 11, entityable_type: 'teamMember', type: 'teamMember', slug: 'qingkong', name: '青空接单人', avatar: null, profile: { name: '青空接单人' } }
const customer = { id: 1, name: '晚风顾客', nickname: '晚风顾客', slug: 'evening-sky', avatar: null, profile: { name: '晚风顾客' }, balance: { balance: '280.00', recharged: '500.00', spent: '220.00' }, is_blocked: 0, is_assignee: true, is_sender: true }
const record = { id: 1, type: 1, product_name: '双人协作服务', customer_id: 1, customer, handler_entity_id: 11, handler: entity, sender_entity_id: 11, sender: entity, cs_entity_id: 11, cs: entity, total_price: '120.00', cash: '100.00', prepaid: '20.00', cost: '10.00', handler_cut: '80.00', sender_cut: '10.00', cs_cut: '5.00', team_cut: '15.00', trans_at: time, create_time: time, update_time: time, memo: '按实际服务时长登记，支付和分成已经核对。' }
const service = { id: 1, status: 2, status_code: 2, status_label: '核销中', quantity: '2.0000', expire_time: time + 2592000, create_time: time, started_at: time, completed_at: null, handler_cut: '80.00', total_price: '120.00', entitlement: { id: 1, unit_name: '小时', quantity_step: '0.5' }, service: { name: '双人协作服务', description: '按预约时间安排服务并记录履约资料。' }, customer_id: 1, customer, handler_entity_id: 11, handler: entity, sender: entity, cs: entity, memo: '晚间预约，请提前确认。', cancel_requests: [], adjustments: [], redemption_fields: [{ id: 1, name: '预约时间', value_type: 'string', input_type: 'text', fill_stage: 'customer', is_required: 1, value: '今晚 20:00' }, { id: 2, name: '履约说明', value_type: 'string', input_type: 'text', fill_stage: 'manager', is_required: 1, value: '已确认预约' }], capabilities: { manage: true, approve_cancel: true } }
const personalStats = { handler_count: 12, sender_count: 7, cs_count: 3, monthly_performance_total: '1234.50', monthly_flow_total: '4321.00', performance_total: '9999.00' }
const product = { id: 1, name: '双人协作权益套餐', price: '120.00', cost: '10.00', service_items: [{ service_id: 1, name: '双人协作服务', quantity: '2.0000', unit_name: '小时' }] }
export function transactionFixture(url, scene) {
  const p = url.pathname.replace(/^\/api/, '')
  const options = { customers: [customer], entities: [entity] }
  const grantOptions = { ...options, products: [product], sync_transaction: true }
  const data = {
    '/workspace/access': { team, identity: { ...entity, belongs_to_team: true, is_external: false }, permissions: ['transaction', 'service.redemption.manage', 'service.entitlement.grant'], abilities: { transaction: { enabled: true, reason: null, label: '记账' } } },
    '/transaction/options': options, '/personal/transaction-options': options,
    '/transaction': paged([record]), '/transaction/1': record,
    '/personal/stats': personalStats, '/personal/transactions': paged([record]), '/personal/transactions/1': record,
    '/personal/customers': paged([customer]),
    '/personal/entitlements': paged([{ id: 1, service: service.service, product, customer, unit_name: '小时', granted_quantity: '2.0000', available_quantity: '1.0000', consumed_quantity: '1.0000', is_expired: false, is_exhausted: false, create_time: time, expire_time: time + 2592000 }]),
    '/personal/entitlement-grant/options': grantOptions, '/entitlement-grant/options': grantOptions,
    '/service': paged([service]), '/service/1': service, '/service/1/handlers': [{ entity_id: 11, subject: entity }],
    '/personal/services': { list: [service], offers: [{ ...service, status: 1 }], available: [{ ...service, handler: null, handler_entity_id: null }] },
    '/personal/services/1': service, '/personal/service-offers/1': { ...service, status: 1 }, '/personal/services/available/1': { ...service, handler: null, handler_entity_id: null },
    '/transaction/balance/logs': paged([{ id: 1, customer_id: 1, type: 1, amount: '100.00', balance_before: '180.00', balance_after: '280.00', create_time: time, memo: '顾客充值' }]),
  }
  if (p === '/transaction/stats') {
    const type = url.searchParams.get('type')
    if (type === 'summary') return { performance_total: '1234.50', receipt_total: '4321.00', total_price: '4321.00', recharge_total: '500.00', cash_total: '4000.00', prepaid_total: '321.00', total_cost: '200.00', service_redemption_count: 12, service_receipt_count: 7 }
    if (type === 'byPerson') return paged([{ ...entity, ...personalStats, handler_performance_total: '1234.50', sender_performance_total: '600.00', income_total: '950.00' }])
    if (type === 'byEntity') return [{ ...entity, count: 12, amount: '1234.50' }]
    if (type === 'byCustomer') return [{ customer_id: 1, customer_name: customer.name, count: 7, amount: '4321.00' }]
    if (type === 'byAssignee') return [{ ...entity, customer_count: 3, transaction_count: 7, total_price: '4321.00', total_cost: '200.00', team_cut: '500.00' }]
    if (type === 'timeline') return []
    return undefined
  }
  return Object.hasOwn(data, p) ? data[p] : undefined
}
