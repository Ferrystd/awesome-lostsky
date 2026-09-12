import { expect, test, type Page } from '@playwright/test'

const token = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamMember', id: 1 } })).toString('base64url')}.x`

async function authenticate(page: Page) {
  await page.context().addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/' }])
  await page.addInitScript(value => localStorage.setItem('lostsky_token', value), token)
}

test('virtual creation uses create permission independently of management', async ({ page }) => {
  await authenticate(page)
  const writes: unknown[] = []
  await page.route('http://demo.team.lostsky.work:5175/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = []
    if (path === '/api/access') data = { permissions: ['team.entity.virtual.create'], abilities: {}, identity: { is_external: false } }
    if (path === '/api/chatVirtual/create') { writes.push(route.request().postDataJSON()); data = { slug: 'created-bot' } }
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
  await page.goto('http://demo.team.lostsky.work:5175/chat-virtual-new')
  await page.locator('#virtual-slug input').fill('created-bot')
  await page.locator('#virtual-name input').fill('新建机器人')
  await page.getByRole('button', { name: '保存人员', exact: true }).click()
  await expect(page).toHaveURL(/\/chat-virtual\?slug=created-bot$/)
  expect(writes).toHaveLength(1)
})

test('specific virtual permission allows its list and detail but not another slug', async ({ page }) => {
  await authenticate(page)
  let updates = 0
  await page.route('http://demo.team.lostsky.work:5175/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    const virtual = { slug: 'bot', name: '指定机器人', is_active: 1, integrations: [] }
    let data: unknown = []
    if (path === '/api/access') data = { permissions: ['team.entity.virtual.bot.manage'], abilities: {}, identity: { is_external: false } }
    if (path === '/api/chatVirtual/index') data = [virtual]
    if (path === '/api/chatVirtual/get') data = virtual
    if (path === '/api/chatVirtual/update') updates++
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
  await page.goto('http://demo.team.lostsky.work:5175/chat-virtuals')
  await page.locator('a[href="/chat-virtual?slug=bot"]').click()
  await expect(page.locator('#virtual-name input')).toHaveValue('指定机器人')
  await page.getByRole('button', { name: '保存人员', exact: true }).click()
  await expect.poll(() => updates).toBe(1)
  await expect(page.getByRole('button', { name: '保存人员', exact: true })).not.toHaveClass(/n-button--loading/)
  await page.goto('http://demo.team.lostsky.work:5175/chat-virtual?slug=other')
  await expect(page.getByRole('button', { name: '保存人员', exact: true })).toHaveAttribute('aria-disabled', 'true')
})

test('a stale access snapshot cannot render a denied team detail as a record', async ({ page }) => {
  await authenticate(page)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('http://127.0.0.1:5180/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/teams/1') return route.fulfill({ status: 403, json: { code: 40302, message: 'forbidden', data: { kind: 'permission', required_any: ['admin.team.read'] } } })
    const data = path === '/api/session' ? { user: { id: 21, username: 'tester' }, roles: [], permissions: ['admin.team.read'], is_super_admin: false } : []
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
  await page.goto('http://127.0.0.1:5180/teams/1')
  await expect(page.locator('dt').filter({ hasText: '所有者' })).toBeVisible()
  await expect(page.locator('dd').first()).toHaveText('-')
  expect(errors).toEqual([])
})

test('a denied task detail never enters form hydration', async ({ page }) => {
  await authenticate(page)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('http://demo.weibo.lostsky.work:5181/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/tasks/1') return route.fulfill({ status: 403, json: { code: 40302, message: 'forbidden', data: { kind: 'permission', required_any: ['weibo.team.manage'] } } })
    const data = path === '/api/workspace/access' ? { permissions: ['weibo.team.manage'], abilities: {}, identity: { entity_id: 1, is_external: false } } : []
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
  await page.goto('http://demo.weibo.lostsky.work:5181/tasks/1')
  await expect(page.locator('dt').filter({ hasText: '已保存配置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '保存为暂停', exact: true })).toHaveAttribute('aria-disabled', 'true')
  expect(errors).toEqual([])
})
