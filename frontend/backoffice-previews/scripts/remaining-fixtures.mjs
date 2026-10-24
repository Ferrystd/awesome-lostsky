// Deterministic examples for local route previews. Unknown endpoints remain undefined.
const time = 1792324800
const paged = list => ({ list, total: list.length, page: 1, limit: 20 })
const team = { id: 1, slug: 'demo', name: '青空协作组', display_name: '青空协作组' }
const entity = { id: 11, entity_id: 11, slug: 'qingkong', name: '青空接单人', type: 'teamMember', avatar: null, team, belongs_to_team: true, is_external: false }
const pathOf = url => url.pathname.replace(/^\/api/, '')
const account = { id: 1, binding_id: 2, entity_id: 11, uid: '10001', screen_name: '青空微博', health: 'Valid', checked_at: time }
const task = { id: 1, owner_entity_id: 11, operation_type: 'Post', topic: { name: '青空协作', display_tag: '#青空协作[超话]#', id: 'preview-topic' }, content: '分享周末协作安排，欢迎一起交流。', account_ids: [1], media_ids: [], start_at: time, min_interval: 3600, max_interval: 7200, version: 2, status: 'Active', block_reason: null, next_run_at: time + 3600 }
const operation = { id: 1, operation_type: 'Post', source: 'Schedule', status: 'Failed', content_summary: '周末协作安排', target_id: 'preview-topic', reason: '账号需要重新确认登录', remote_message: '请检查账号登录状态后重试', started_at: time, finished_at: time + 5 }
export function weiboFixture(url) {
  const path = pathOf(url)
  const p = path.replace(/^\/personal/, '')
  const data = {
    '/workspace/access': { team, identity: entity, permissions: ['weibo.team.manage', 'weibo.personal.use'], abilities: { weibo: { enabled: true, reason: null, label: '微博' } }, entry_warning: { required: false, kind: null, ttl_seconds: 86400 } },
    '/accounts': [account, { ...account, id: 2, screen_name: '晚风日常', health: 'Invalid' }],
    '/tasks': [task, { ...task, id: 2, operation_type: 'Checkin', status: 'Paused', next_run_at: null }],
    '/tasks/1': task,
    '/operations': paged([operation, { ...operation, id: 2, status: 'Succeeded', reason: null, remote_message: null }]),
    '/comment-presets': [{ id: 1, content: '你好，已经看到你的需求，欢迎进一步沟通。', scope: 'team' }, ...(path.startsWith('/personal') ? [{ id: 2, content: '今晚可以接单，期待一起协作。', scope: 'personal' }] : [])],
    '/feed': { ...paged([{ id: 1, text: '今晚想找一位耐心的伙伴一起完成游戏任务，20:00 开始，可以提前沟通。', author_name: '晚风', posted_at: time, status_url: 'https://weibo.com/preview/1', app_url: 'sinaweibo://detail?mblogid=preview', restricted: false }, { id: 2, text: '周末设计委托：需要一张清爽的活动海报，有经验的伙伴欢迎交流。', author_name: '青空', posted_at: time - 600, status_url: 'https://weibo.com/preview/2', restricted: false }]), restricted: false, updated_at: time, poll_status: 'ready', last_error: null },
  }
  return data[p]
}
const customer = { id: 1, nickname: '晚风顾客', name: '晚风顾客', profile: { name: '晚风顾客' } }
const product = { id: 1, kind: 1, name: '双人协作服务', description: '预约后按约定时间开始服务。', introduction_markdown: '## 服务说明\n请提前确认预约时间。\n\n- 按实际需求安排\n- 支持事前沟通', cover_image: '', price: '120.00', cost: '10.00', handler_cut: '70.00', sender_cut: '20.00', cs_cut: '5.00', team_cut: '15.00', entity_id: 11, is_active: 1, handlers: [entity], handler_entity_ids: [11], items: [], variants: [], purchase_fields: [] }
const order = { id: 1, product_id: 1, product_name: product.name, product, customer, handler: entity, sender: entity, cs: entity, quantity: 1, unit_price: '120.00', total_price: '120.00', cash: '100.00', prepaid: '20.00', cost: '10.00', handler_cut: '70.00', sender_cut: '20.00', cs_cut: '5.00', team_cut: '15.00', status: 1, create_time: time, memo: '已确认今晚 20:00 预约。', trans_id: 1, purchase_fields: [] }
export function shopFixture(url, scene) {
  const p = pathOf(url)
  const options = { entities: [entity], customers: [customer], products: [product], packages: [], campaigns: [], services: [], composition_products: [product], service_defaults: { default_unit_name: '次', default_quantity_step: '1', default_valid_days: 30, allow_customer_open_dispatch: true, default_handler_rate_percent: 60, default_sender_rate_percent: 25, default_cs_rate_percent: 5 } }
  const data = {
    '/manage/access': { team, identity: entity, permissions: ['shop.product.read', 'shop.product.write', 'shop.product.self.manage', 'shop.product.self.reprice', 'shop.order.read', 'shop.order.write', 'file.upload'], abilities: { shop: { enabled: true, reason: null, label: '商城' } }, entry_warning: { required: false, kind: null, ttl_seconds: 86400 }, file_upload: { available: true, count: 0, total_size: 0, size_limit: 100000000, remaining_size: 100000000, reason: null } },
    '/manage/options': options, '/personal/products/options': options,
    '/product': paged([product, { ...product, id: 4, kind: 4, name: '预约核销服务', price: '60.00' }]),
    '/personal/products': paged([product]),
    '/order': paged([order]), '/order/1': order, '/personal/orders': paged([order]),
  }
  if (/^\/(product|personal\/products)\/\d+$/.test(p)) {
    const id = Number(p.split('/').at(-1)); const kind = id >= 1 && id <= 5 ? id : 1
    return { ...product, id, kind, name: ({ 1: '双人协作服务', 2: '周末协作套餐', 3: '协作礼赠卡密', 4: '预约核销服务', 5: '设计服务规格' })[kind], redemption: { unit_name: '小时', quantity: '2', quantity_step: '0.5', valid_days: 30, redemption_fields: [], handler_entity_ids: [11], fields: [], allow_customer_open_dispatch: true, completion_config: { required_fields: [] } }, items: kind === 2 || kind === 3 ? [{ id: 1, product_id: 1, quantity: 1, product, ...product }] : [], variants: kind === 5 ? [{ ...product, id: 51, name: '基础服务', sort: 0 }] : [] }
  }
  return data[p]
}
