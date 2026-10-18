import { chromium } from '@playwright/test'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

// Render the real Team application with isolated, explicitly synthetic business data.
const base = process.env.TEAM_AUDIT_URL || 'http://demo.team.lostsky.work'
const person = { id: 1, entity_id: 1, entityable_id: 1, entityable_type: 'teamMember', type: 'teamMember', name: '预览成员（模拟数据）', slug: 'preview-member', profile: { name: '预览成员（模拟数据）', description: '用于页面版型验收的模拟资料', introduction_markdown: '## 资料\n模拟正文。' }, status: 1, is_active: 1 }
const field = { id: 1, key: 'preview', field_key: 'preview', name: '预览字段', label: '预览字段', type: 'text', field_type: 'text', entity_type: 'teamMember', options: [], config: {}, sort: 0, is_required: 0, is_active: 1, visibility: 1, manager_scope: 1 }
const role = { id: 1, role_key: 'preview', name: '预览角色', description: '模拟角色', permissions: [] }
const doc = { id: 1, title: '预览文档（模拟数据）', content: '## 内容\n用于检查真实阅读与编辑排版。', entity_id: 1, visibility: 1, manager_scope: 1, sort: 0, entity: person }
const notice = { id: 1, entity_id: 1, title: '预览通知（模拟数据）', content: '用于检查通知排版的正文。', is_read: 0, create_time: 1790000000, entity: person }
const group = { uuid: 'preview', title: '预览群聊（模拟数据）', participants: [], is_closed: false }
const virtual = { ...person, slug: 'preview', integrations: [{ id: 1, name: '预览集成', endpoint_url: 'https://example.invalid/webhook', events: [], is_active: 1 }] }
const identity = { ...person, team: { id: 1, name: '预览团队（模拟数据）', slug: 'demo' }, belongs_to_team: true, is_external: false }
const permission = { permissions: ['team', 'chat', 'file', 'doc'], abilities: { doc: { enabled: true } }, identity, team: identity.team, file_upload: { enabled: true, available: true, allowed: true, used_bytes: 0, quota_bytes: 100000000 } }
const member = { ...person, member_id: 1, entity: person, custom_fields: [field], custom_field_values: [], role_assignments: [], effective_permissions: [], user: { id: 1 }, profile: person.profile }
const audit = { id: 1, application: 'team', application_label: '团队', action: 'update', action_label: '更新', resource: 'member', resource_label: '成员', resource_id: 1, actor: { ...person, authenticated_user_id: 1 }, context: {}, create_time: 1790000000, request_id: 'preview' }
const pageData = list => ({ list, data: list, total: list.length, page: 1, limit: 20 })
let activeTarget = ''
function fixture(path) {
  path = path.replace(/^\/team(?=\/)/, '')
  if (path === '/access') return activeTarget.includes('preview_readonly=1') ? { ...permission, permissions: ['team.join_field.read'] } : permission
  if (path === '/personal') return { identity, profile: person.profile, custom_fields: [field], custom_field_values: [], role_assignments: [], effective_permissions: [] }
  if (path === '/dashboard') return Object.fromEntries(['entities', 'members', 'documents', 'notices'].map(k => [k, { available: true, count: 1, error: null, reason: null }]))
  if (path === '/setting/schema') return { apps: [{ app_name: 'entity', label: '人员', description: '模拟设置', settings: [{ key: 'searchable', label: '允许搜索', type: 'boolean', value: true, default: true, description: '模拟设置说明' }] }] }
  if (path === '/file/usage') return permission.file_upload
  if (path === '/file/index') return pageData([{ id: 1, name: 'preview.txt', original_name: 'preview.txt', mime_type: 'text/plain', size: 100, url: 'https://example.invalid/preview.txt', source_entity: person }])
  if (path === '/entity/index') return pageData([person])
  if (path === '/entity/get') return { ...member, entityable_type: new URL(activeTarget, base).searchParams.get('preview_type') || 'teamMember', capabilities: { read_all: true, manage_profile: true }, entityable: member, roles: [], permissions: [], fields: [], values: [] }
  if (path === '/entity/options' || path === '/customer/assignees') return [person]
  if (path === '/member/index') return [member]
  if (path === '/member/get') return member
  if (path === '/member/joinForm') return { fields: [], file_upload: permission.file_upload }
  if (path === '/entityField/index' || path === '/joinField/index') return [field]
  if (path === '/entityField/get') return field
  if (path === '/entityField/fieldValues') return pageData([])
  if (path === '/entityField/values' || path === '/joinField/transferOptions' || path === '/entityRole/index' || path === '/rolePermission/index') return []
  if (path === '/entityRole/resolve') return person
  if (path === '/role/index') return [role]
  if (path === '/role/get') return role
  if (path === '/rolePermission/catalog') return { apps: [], permissions: [], groups: [] }
  if (path === '/doc') return pageData([doc])
  if (path === '/doc/get') return doc
  if (path === '/notice/index') return pageData([notice])
  if (path === '/notice/get') return notice
  if (path === '/notice/confirm') return {}
  if (path === '/chatGroup/index') return [group]
  if (path === '/chatGroup/get') return group
  if (path === '/chatGroup/messages' || path === '/chatGroup/actors') return []
  if (path === '/chatVirtual/index') return [virtual]
  if (path === '/chatVirtual/get') return virtual
  if (path === '/audit/index') return pageData([audit])
  if (path === '/audit/get') return audit
  if (path === '/audit/catalog') return { applications: [], actions: [], resources: [] }
  if (path === '/ability') return []
  if (path === '/join/form') return { purpose_code: activeTarget.includes('preview_purpose=reinstate') ? 'reinstate' : 'join', team: identity.team, fields: [field], enabled: true, file_upload: permission.file_upload }
  if (path === '/join/mine' || path === '/memberDeparture/mine') return []
  if (/^\/(joinReview|memberDeparture)\/index$/.test(path)) return pageData([])
  if (/^\/(joinReview|memberDeparture)\/get$/.test(path)) return { id: 1, status: 0, entity: person, member, user: { id: 1 }, fields: [], values: [], reason: '模拟申请', create_time: 1790000000 }
  if (path === '/customer') return pageData([{ ...person, entity: person }])
  if (/^\/customer\/\d+$/.test(path)) return { ...person, is_blocked: false, create_time: 1790000000, balance: { balance: '0.00', recharged: '0.00', spent: '0.00' }, senders: [], summary: { transaction_count: 0, transaction_total: '0.00', order_count: 0, order_total: '0.00' }, can_manage: true }
  if (/presentation|visibility/.test(path)) return { is_searchable: true, is_public: true }
  return undefined
}
const source = readFileSync(new URL('../apps/team/src/router.ts', import.meta.url), 'utf8')
const paths = [...source.matchAll(/^  \{ path: '([^']+)', component:/gm)].map(m => m[1].replace(/:id\([^)]*\)/, '1').replace(':uuid', 'preview'))
const queryPaths = new Set(['/personal/notices/detail', '/notices/sent/detail', '/notices/team/detail', '/field-edit', '/member-edit', '/member-detail', '/doc', '/doc-edit', '/join-review/review', '/departure-review/review'])
const targets = paths.map(p => p + (queryPaths.has(p) ? '?id=1' : p === '/entity' ? '?id=1' : ['/chat-virtual', '/chat-integration', '/chat-integration-new'].includes(p) ? '?slug=preview&id=1' : ''))
targets.push(...['team', 'teamCustomer', 'teamVirtual'].map(type => `/entity?id=1&preview_type=${type}`))
targets.push('/join?preview_purpose=reinstate', '/join-fields/1?preview_readonly=1')
const selectedTargets = process.env.TEAM_AUDIT_PATH ? targets.filter(path => path === process.env.TEAM_AUDIT_PATH) : targets
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const token = `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: 'teamMember', id: 1, entity_id: 1 } })).toString('base64url')}.x`
await context.addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/' }])
const missing = new Set()
await context.route(url => url.hostname === 'api.lostsky.work' || url.pathname.startsWith('/api/'), async route => {
  const path = new URL(route.request().url()).pathname.replace(/^\/api/, '')
  const data = fixture(path)
  if (data === undefined) missing.add(path)
  await route.fulfill({ json: data === undefined ? { code: 50000, message: `Missing preview fixture: ${path}` } : { code: 0, message: 'mock', data } })
})
const page = await context.newPage()
const records = []
let errors = []
page.on('pageerror', error => errors.push(error.message))
for (const width of [1440, 375]) {
  await page.setViewportSize({ width, height: 1000 })
  for (const path of selectedTargets) {
    activeTarget = path
    errors = []
    await page.goto(base + path)
    await page.waitForLoadState('networkidle')
    const geometry = await page.evaluate(() => {
      const selectors = ['.ls-object-directory', '.ls-category-page', '.team-category-layout', '.ls-form-page', '.ls-detail-page', '.ls-overview-page', '.document-reading-page', '.join', '.page-context__main', '.page-context__aside']
      const boxes = selectors.flatMap(selector => [...document.querySelectorAll(selector)].map(el => ({ selector, width: Math.round(el.getBoundingClientRect().width), x: Math.round(el.getBoundingClientRect().x) })))
      const overflowing = [...document.querySelectorAll('main *')].filter(el => { const b = el.getBoundingClientRect(); return b.width && b.right > innerWidth + 2 && getComputedStyle(el).position !== 'fixed' }).slice(0, 8).map(el => ({ tag: el.tagName, class: el.className, width: Math.round(el.getBoundingClientRect().width) }))
      const panels = [...document.querySelectorAll('.ls-panel')].map(el => ({ background: getComputedStyle(el).background, material: getComputedStyle(el).getPropertyValue('--panel-material') }))
      return { title: document.title, boxes, panels, overflow: document.documentElement.scrollWidth > innerWidth + 1, overflowing, oldToolbars: document.querySelectorAll('.ls-list-toolbar:not(.ls-list-toolbar--embedded)').length, community: document.body.innerText.includes('团队社区'), errors: [...document.querySelectorAll('[role=alert]')].map(el => el.textContent), headings: [...document.querySelectorAll('h1,h2')].map(el => el.textContent) }
    })
    records.push({ path, width, url: page.url(), ...geometry, runtimeErrors: [...errors] })
    if (width === 1440 && ['/chat-groups', '/audit', '/personal/profile'].includes(path)) {
      mkdirSync('test-results/team-template-audit/previews', { recursive: true })
      await page.screenshot({ path: `test-results/team-template-audit/previews/${path.slice(1).replaceAll('/', '-')}.png`, fullPage: true })
    }
    if (records.length % 10 === 0) console.log(`Rendered ${records.length}/${selectedTargets.length * 2}`)
  }
}
await browser.close()
mkdirSync('test-results/team-template-audit', { recursive: true })
writeFileSync(`test-results/team-template-audit/${process.env.TEAM_AUDIT_PATH ? 'targeted' : 'report'}.json`, JSON.stringify({ base, syntheticData: true, missing: [...missing], records }, null, 2))
const issues = records.filter(r => r.overflow || r.runtimeErrors.length || r.community || !r.boxes.length || r.oldToolbars || r.errors.length || !r.url.startsWith(base) || new URL(r.url).pathname !== new URL(r.path, base).pathname || r.boxes.some(b => ['.ls-object-directory', '.ls-category-page', '.team-category-layout', '.ls-form-page', '.ls-detail-page'].includes(b.selector) && b.width > 1025) || r.panels.some(p => !p.material.trim()) || ['/personal/profile', '/personal/fields'].includes(r.path) && !r.boxes.some(b => b.selector === '.ls-form-page'))
console.log(JSON.stringify({ routes: paths.length, dynamicCases: targets.length - paths.length, renders: records.length, missing: [...missing], issues }, null, 2))
process.exitCode = missing.size || issues.length ? 1 : 0
