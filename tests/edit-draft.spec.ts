import { expect, test, type Page } from './fixtures'

const envelope = (data: unknown) => JSON.stringify({ code: 0, message: 'ok', data })
const permissions = ['admin.access.read', 'admin.access.write', 'admin.entitlement.read', 'admin.entitlement.write', 'transaction.read', 'transaction.write', 'weibo.team.manage', 'shop.product.read', 'shop.product.write']
const access = { team: { id: 1, slug: 'demo', name: 'Demo' }, identity: { entity_id: 11, type: 'teamMember', name: 'Member', belongs_to_team: true }, permissions, abilities: { transaction: { enabled: true, level: 1 }, doc: { enabled: true, level: 1 }, shop: { enabled: true, level: 1 }, weibo: { enabled: true, level: 1 } }, entry_warning: { required: false } }
const role = { id: 1, role_key: 'operator', name: 'server', description: '', permissions: [], is_system: 0 }
const task = { id: 3, operation_type: 'Post', topic: { name: 'server' }, content: 'content', account_ids: [1], media_ids: [], start_at: 1900000000, min_interval: 3600, max_interval: 7200, version: 1, status: 'Paused' }
async function auth(page: Page) {
  const token = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamMember', id: 11 } })).toString('base64url')}.x`
  await page.addInitScript(token => localStorage.setItem('lostsky_token', token), token)
  await page.context().addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/' }])
}
const field = (page: Page, id: string) => page.locator(`input#${id}, #${id} input, textarea#${id}, #${id} textarea`).first()
const cases = [
  { name: 'platform role', host: '127.0.0.1:5180', url: '/roles/1', path: '/roles/1', id: 'role-name', data: () => ({ ...role }) },
  { name: 'platform package', host: '127.0.0.1:5180', url: '/entitlements/packages/1', path: '/entitlements/packages/1', id: 'entitlement-name', data: () => ({ id: 1, name: 'server', is_active: 1, abilities: [{ id: 1, ability_key: 'doc', level: 1, duration_days: 30 }] }) },
  { name: 'platform campaign', host: '127.0.0.1:5180', url: '/entitlements/campaigns/1', path: '/entitlements/campaigns/1', id: 'admin-campaign-name', data: () => ({ id: 1, name: 'server', package_id: 1, mode: 2, claim_group: 'a', total_limit: null, redeem_starts_at: 0, redeem_ends_at: 0, is_active: 1 }) },
  { name: 'transaction', host: 'demo.transaction.lostsky.work:5177', url: '/edit?id=21', path: '/transaction/21', id: 'transaction-memo', data: () => ({ id: 21, handler_entity_id: 11, sender_entity_id: null, cs_entity_id: null, customer_id: null, type: 2, total_price: 100, cost: 0, cash: 100, prepaid: 0, handler_cut: 0, sender_cut: 0, cs_cut: 0, team_cut: 100, trans_at: 1784563200, memo: 'server' }) },
  { name: 'weibo task', host: 'demo.weibo.lostsky.work:5181', url: '/tasks/3', path: '/tasks/3', id: 'weibo-task-topic', data: () => ({ ...task }) },
  { name: 'team document', host: 'demo.team.lostsky.work:5175', url: '/doc-edit?id=7', path: '/doc/get', id: 'document-title', data: () => ({ id: 7, title: 'server', content: '', entity_id: 1, manager_scope: 1, visibility: 1, sort: 0, tags: [] }) },
]

async function commonData(path: string): Promise<unknown> {
  if (path === '/session') return { user: { id: 1, username: 'owner' }, permissions, roles: [role], is_super_admin: true }
  if (path.endsWith('/access')) return access
  if (path === '/permissions') return { groups: [] }
  if (path === '/roles') return [role, { ...role, id: 2, role_key: 'other', name: 'other' }]
  if (path === '/entitlements/ability-catalog') return [{ key: 'doc', label: 'Document', levels: [1] }]
  if (path === '/entitlements/packages') return { total: 1, list: [{ id: 1, name: 'package', is_active: 1 }] }
  if (path.endsWith('/codes')) return { total: 0, list: [] }
  if (path.endsWith('/accounts')) return [{ id: 1, uid: '1', screen_name: 'Account' }]
  if (path === '/transaction/options') return { entities: [{ id: 11, entity_id: 11, name: 'Member', type: 'teamMember' }], customers: [] }
  if (path === '/entity/options') return [{ entity_id: 1, name: 'Demo', type: 'team', slug: 'demo' }]
  if (path === '/manage/options') return { products: [], services: [], packages: [{ id: 1, name: 'package', is_active: 1 }], campaigns: [], entities: [], customers: [], service_defaults: { default_valid_days: 30, default_handler_rate_percent: 80, default_sender_rate_percent: 15, default_cs_rate_percent: 0 } }
  return null
}

for (const entry of cases) test(`${entry.name}: refresh preserves dirty edits and updates clean fields`, async ({ page }) => {
  await auth(page)
  let revision = 0
  let reads = 0
  await page.route(/^http:\/\/[^/]+\/api\//, async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '')
    let data = await commonData(path)
    if (path === entry.path) {
      reads++
      const value = entry.data()
      data = { ...value, title: revision ? 'remote' : 'server', name: revision ? 'remote' : 'server', memo: revision ? 'remote' : 'server', topic: { name: revision ? 'remote' : 'server' }, version: revision + 1 }
    }
    await route.fulfill({ contentType: 'application/json', body: envelope(data) })
  })
  await page.goto(`http://${entry.host}${entry.url}`)
  const input = field(page, entry.id)
  const copySuffix = ''
  await expect(input).toHaveValue(`server${copySuffix}`)
  revision = 1
  const before = reads
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')))
  await expect.poll(() => reads).toBeGreaterThan(before)
  await expect(input).toHaveValue(`remote${copySuffix}`)
  if (entry.name === 'weibo task') {
    revision = 0
    const older = reads
    await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')))
    await expect.poll(() => reads).toBeGreaterThan(older)
    await expect(input).toHaveValue('remote')
  }
  await input.fill('local draft')
  revision = 2
  const second = reads
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')))
  await expect.poll(() => reads).toBeGreaterThan(second)
  await expect(input).toHaveValue('local draft')
  const unchanged = reads
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')))
  await expect.poll(() => reads).toBeGreaterThan(unchanged)
  await expect(input).toHaveValue('local draft')
})

test('personal service claim: refreshing availability preserves entered quantity', async ({ page }) => {
  await auth(page)
  let reads = 0
  await page.route(/^http:\/\/[^/]+\/api\//, async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '')
    const data = path === '/personal/services/available/1'
      ? { id: 1, quantity: String(10 + reads++), entitlement: { quantity_step: '1', unit_name: '次' }, service: { name: 'Service' }, redemption_fields: [], status_code: 1 }
      : await commonData(path)
    await route.fulfill({ contentType: 'application/json', body: envelope(data) })
  })
  await page.goto('http://demo.transaction.lostsky.work:5177/personal/services/available/1')
  const input = field(page, 'claim-quantity')
  await expect(input).toHaveValue('1')
  await input.fill('3')
  await input.blur()
  const before = reads
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')))
  await expect.poll(() => reads).toBeGreaterThan(before)
  await expect(input).toHaveValue('3')
})

test('platform administrator: refreshing role assignments preserves the selected draft', async ({ page }) => {
  await auth(page)
  let reads = 0
  await page.route(/^http:\/\/[^/]+\/api\//, async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '')
    const data = path === '/administrators' ? (reads++, [{ id: 1, username: 'owner', roles: [role], update_time: reads }]) : await commonData(path)
    await route.fulfill({ contentType: 'application/json', body: envelope(data) })
  })
  await page.goto('http://127.0.0.1:5180/administrators/1')
  const checkbox = page.getByRole('checkbox').nth(1)
  await checkbox.check()
  const before = reads
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')))
  await expect.poll(() => reads).toBeGreaterThan(before)
  await expect(checkbox).toBeChecked()
})

test('platform administrator: confirmed same-component target switch hydrates cached assignments and auxiliary query preserves draft', async ({ page }) => {
  await auth(page)
  await page.route(/^http:\/\/[^/]+\/api\//, async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '')
    const data = path === '/administrators'
      ? [{ id: 1, username: 'first', roles: [role] }, { id: 2, username: 'second', roles: [{ ...role, id: 2 }] }]
      : await commonData(path)
    await route.fulfill({ contentType: 'application/json', body: envelope(data) })
  })
  await page.goto('http://127.0.0.1:5180/administrators/1')
  const boxes = page.getByRole('checkbox')
  await expect(boxes.nth(0)).toBeChecked()
  await boxes.nth(1).check()
  const navigate = (path: string) => page.evaluate(async path => {
    const app = (document.querySelector('#app') as Element & { __vue_app__: { config: { globalProperties: { $router: { push(path: string): Promise<unknown> } } } } }).__vue_app__
    await app.config.globalProperties.$router.push(path)
  }, path)
  let prompts = 0
  const cancel = async (dialog: import('@playwright/test').Dialog) => { prompts++; await dialog.dismiss() }
  page.on('dialog', cancel)
  await navigate('/administrators/1?panel=roles')
  expect(prompts).toBe(0)
  await expect(boxes.nth(1)).toBeChecked()
  await navigate('/administrators/2')
  expect(prompts).toBe(1)
  await expect(page).toHaveURL(/\/administrators\/1\?panel=roles$/)
  page.off('dialog', cancel)
  page.once('dialog', dialog => dialog.accept())
  await navigate('/administrators/2')
  await expect(boxes.nth(0)).not.toBeChecked()
  await expect(boxes.nth(1)).toBeChecked()
  await expect(field(page, 'administrator-user-id')).toHaveValue('2')
})

test('weibo task: dirty refresh retains baseline version, conflict keeps input until confirmed reload', async ({ page }) => {
  await auth(page)
  let version = 1
  let posted: Record<string, unknown> | undefined
  await page.route(/^http:\/\/[^/]+\/api\//, async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '')
    if (path === '/tasks/3' && route.request().method() === 'POST') {
      posted = route.request().postDataJSON()
      await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ code: 409, message: '任务已更新，请刷新后重试', data: null }) })
      return
    }
    const data = path === '/tasks/3' ? { ...task, version, topic: { name: version === 1 ? 'server' : 'remote' } } : await commonData(path)
    await route.fulfill({ contentType: 'application/json', body: envelope(data) })
  })
  await page.goto('http://demo.weibo.lostsky.work:5181/tasks/3')
  const input = field(page, 'weibo-task-topic')
  await expect(input).toHaveValue('server')
  await input.fill('local draft')
  version = 2
  const refreshed = page.waitForResponse(response => response.url().endsWith('/api/tasks/3') && response.request().method() === 'GET')
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')))
  await refreshed
  await page.locator('button[type=submit]').click()
  await expect.poll(() => posted?.expected_version).toBe(1)
  await expect(input).toHaveValue('local draft')
  page.once('dialog', dialog => dialog.dismiss())
  await page.getByRole('button', { name: '重新载入任务' }).click()
  await expect(input).toHaveValue('local draft')
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '重新载入任务' }).click()
  await expect(input).toHaveValue('remote')
})

test('platform role: save success confirms the submitted snapshot without discarding later typing', async ({ page }) => {
  await auth(page)
  let finish!: () => void
  let posted: Record<string, unknown> | undefined
  await page.route(/^http:\/\/[^/]+\/api\//, async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '')
    if (path === '/roles/1' && route.request().method() === 'PUT') {
      posted = route.request().postDataJSON()
      await new Promise<void>(resolve => { finish = resolve })
    }
    await route.fulfill({ contentType: 'application/json', body: envelope(path === '/roles/1' ? role : await commonData(path)) })
  })
  await page.goto('http://127.0.0.1:5180/roles/1')
  const input = field(page, 'role-name')
  await input.fill('submitted')
  await page.locator('button[type=submit]').click()
  await expect.poll(() => posted?.name).toBe('submitted')
  await input.fill('typed while saving')
  finish()
  await expect(page.getByText('平台角色已保存', { exact: true })).toBeVisible()
  await expect(input).toHaveValue('typed while saving')
  page.once('dialog', dialog => dialog.dismiss())
  await page.locator('form a[href="/roles"]').first().click()
  await expect(page).toHaveURL(/\/roles\/1$/)
  await expect(input).toHaveValue('typed while saving')
})
