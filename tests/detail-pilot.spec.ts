import { expect, test, type Page } from './fixtures'

const owner = { entity_id: 2, slug: 'qingkong-member', type: 'teamMember', name: '青空归属人' }
const sender = { entity_id: 3, slug: 'qingkong-helper', type: 'teamVirtual', name: '青空协作发单人' }
const customer = {
  id: 518, slug: 'customer-518', name: '青空顾客', avatar: null, description: '固定验收夹具，非生产数据。', is_blocked: false,
  create_time: 1_782_633_600, balance: { balance: '1280.00', recharged: '2000.00', spent: '720.00' },
  assignee: owner, senders: [sender], can_manage: true,
  summary: { transaction_count: 12, transaction_total: '720.00', order_count: 8, order_total: '560.00' },
}
type Mode = 'ready' | 'readonly' | 'empty' | 'denied' | 'missing' | 'error' | 'incomplete' | 'loading' | 'candidate-error'

async function fixture(page: Page, mode: Mode = 'ready', long = false) {
  const data = structuredClone(customer)
  if (long) {
    data.name = '长顾客名称LongCustomerNameWithoutSpaces'.repeat(5)
    data.slug = 'long-customer-'.repeat(12)
    data.description = '很长的顾客说明；'.repeat(60)
    data.assignee.name = '长期负责顾客资料维护的归属成员'.repeat(4)
    data.senders[0].name = '负责协作发单的虚拟人员'.repeat(4)
  }
  if (mode === 'readonly') data.can_manage = false
  if (mode === 'empty') { data.assignee = null as never; data.senders = []; data.summary = { transaction_count: 0, transaction_total: '0.00', order_count: 0, order_total: '0.00' } }
  const posts: Record<string, unknown>[] = []
  const requests: string[] = []
  const errors: string[] = []
  const failed: string[] = []
  const consoleErrors: string[] = []
  const unexpected: string[] = []
  let release!: () => void
  const loading = new Promise<void>(resolve => { release = resolve })
  page.on('pageerror', error => errors.push(error.message))
  page.on('requestfailed', request => failed.push(request.url()))
  page.on('console', message => { if (message.type() === 'error' && !message.text().includes('Failed to load resource')) consoleErrors.push(message.text()) })
  await page.context().addCookies([{ name: 'lostsky_token', value: 'detail-pilot-fixture', domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route(url => url.pathname.startsWith('/api/'), async route => {
    const path = new URL(route.request().url()).pathname
    requests.push(path)
    const ok = (body: unknown) => route.fulfill({ json: { code: 0, message: 'ok', data: body } })
    if (path === '/api/access') return ok({ permissions: ['team.customer.read', ...(mode === 'readonly' || mode === 'denied' ? [] : ['team.customer.manage'])], abilities: {}, team: { id: 1, slug: 'demo', name: '详情样板团队' } })
    if (path === '/api/customer/assignees') {
      if (mode === 'candidate-error') return route.fulfill({ status: 503, json: { code: 503, message: '候选读取失败', data: null } })
      return ok(mode === 'empty' ? [] : [owner, sender])
    }
    if (path === '/api/customer') return ok({ list: [], total: 0, page: 1, limit: 20, scope: 'all' })
    if (path === '/api/customer/518') {
      if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON()
        posts.push(payload)
        Object.assign(data, { name: payload.name, description: payload.description, is_blocked: Boolean(payload.is_blocked) })
        return ok(null)
      }
      if (mode === 'loading') await loading
      if (mode === 'denied') return route.fulfill({ status: 403, json: { code: 40302, message: '读取受限', data: { kind: 'permission', required_any: ['team.customer.read'] } } })
      if (mode === 'missing') return route.fulfill({ status: 404, json: { code: 404, message: '顾客不存在', data: null } })
      if (mode === 'error') return route.fulfill({ status: 503, json: { code: 503, message: '服务暂时不可用', data: null } })
      if (mode === 'incomplete') return ok({ id: 518, slug: 'broken', name: '不完整顾客' })
      return ok(data)
    }
    unexpected.push(path)
    return route.abort('blockedbyclient')
  })
  return { data, posts, requests, errors, failed, consoleErrors, unexpected, release }
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  const controls = page.locator('.ls-detail-page button, .ls-detail-page a')
  for (const element of await controls.all()) {
    if (!(await element.isVisible())) continue
    const box = await element.boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(-1)
    expect(box!.x + box!.width).toBeLessThanOrEqual((await page.evaluate(() => innerWidth)) + 1)
  }
}

test('detail pilot preserves summary, return, scene and responsive long content', async ({ page }, info) => {
  const state = await fixture(page, 'ready', true)
  await page.goto('http://demo.team.lostsky.work:5175/customers/518')
  await expect(page.locator('.ls-detail-page h1')).toHaveText(state.data.name)
  await expect(page.locator('.team-scene')).toHaveCount(1)
  await expect(page.locator('.ls-workspace-header--scene')).toHaveCount(1)
  await expect(page.locator('.ls-page')).toHaveCount(1)
  await expect(page.locator('.ls-page--content')).toHaveCSS('max-width', '1024px')
  await expect(page.getByRole('link', { name: '返回顾客列表' })).toHaveAttribute('href', '/customers')
  await expect(page.getByRole('link', { name: '发起对话' })).toHaveAttribute('href', /participant=long-customer-/)
  for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 })
    await noOverflow(page)
    if (width <= 768) {
      const detailBox = await page.locator('.ls-detail-page').boundingBox()
      const titleBox = await page.locator('.ls-detail-page h1').boundingBox()
      const descriptionBox = await page.locator('.ls-detail-page .ls-page-header p').boundingBox()
      const commandsBox = await page.locator('.ls-detail-page__commands').boundingBox()
      expect(titleBox!.width).toBeGreaterThan(detailBox!.width * .8)
      expect(descriptionBox!.x).toBeCloseTo(titleBox!.x, 0)
      expect(descriptionBox!.width).toBeGreaterThan(0)
      expect(descriptionBox!.width).toBeLessThanOrEqual(titleBox!.width + 1)
      const descriptionMax = await page.locator('.ls-detail-page .ls-page-header p').evaluate(el => parseFloat(getComputedStyle(el).maxWidth))
      expect(descriptionBox!.width).toBeLessThanOrEqual(descriptionMax + 1)
      expect(commandsBox!.y).toBeGreaterThanOrEqual(descriptionBox!.y + descriptionBox!.height)
    }
  }
  const material = await page.locator('.ls-detail-page .ls-panel').evaluate(element => ({ background: getComputedStyle(element).backgroundImage, shadow: getComputedStyle(element).boxShadow }))
  expect(material.background).toContain('linear-gradient')
  expect(material.shadow).not.toBe('none')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.screenshot({ path: info.outputPath('detail-desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 375, height: 900 })
  await expect.poll(() => page.locator('.sidebar').evaluate(el => el.getBoundingClientRect().right)).toBeLessThanOrEqual(0)
  await page.screenshot({ path: info.outputPath('detail-mobile.png'), fullPage: true })
  // Enlarge even Naive's pixel-sized input/button text, not only rem-based headings.
  await page.evaluate(() => {
    const elements = [document.documentElement, ...document.querySelectorAll<HTMLElement>('body, body *')]
    const sizes = elements.map(element => parseFloat(getComputedStyle(element).fontSize))
    elements.forEach((element, index) => { element.style.fontSize = `${sizes[index] * 2}px` })
  })
  for (const width of [320, 768, 1440, 1920]) { await page.setViewportSize({ width, height: 1100 }); await noOverflow(page) }
  await page.reload()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.getByRole('button', { name: /暂停极光|播放极光/ })).toBeHidden()
  await page.getByRole('link', { name: '返回顾客列表' }).click()
  await expect(page).toHaveURL(/\/customers$/)
  await expect(page.locator('.team-scene')).toHaveCount(1)
  await expect(page.locator('.ls-theme-aurora')).toHaveCount(1)
  await expect(page.locator('.ls-workspace-header--scene')).toHaveCount(1)
  expect(state.errors).toEqual([])
  expect(state.consoleErrors).toEqual([])
  expect(state.failed).toEqual([])
  expect(state.unexpected).toEqual([])
})

test('detail pilot saves the complete relationship draft once and protects leaving', async ({ page }) => {
  const state = await fixture(page)
  await page.goto('http://demo.team.lostsky.work:5175/customers/518')
  await expect(page.locator('#customer-name')).toHaveValue('青空顾客')
  await page.locator('#customer-name').fill('改名后的顾客')
  await page.locator('#customer-description').fill('更新后的说明')
  await page.locator('#customer-avatar').fill('https://example.com/customer-avatar.png')
  await page.getByRole('switch', { name: '封禁顾客' }).click()
  await page.locator('label[for="customer-senders"]').click()
  await expect(page.getByRole('textbox', { name: '协作发单人' })).toBeFocused()
  await page.locator('.ls-entity-select-menu:visible .ls-entity-select-option').filter({ hasText: '青空归属人' }).click()
  await page.keyboard.press('Escape')
  const confirmation = page.waitForEvent('dialog').then(async dialog => { expect(dialog.message()).toContain('未保存'); await dialog.dismiss() })
  await page.getByRole('link', { name: '返回顾客列表' }).click()
  await confirmation
  await expect(page).toHaveURL(/\/customers\/518$/)
  await page.getByRole('button', { name: '保存顾客资料' }).click()
  await expect.poll(() => state.posts.length).toBe(1)
  expect(state.posts[0]).toMatchObject({ name: '改名后的顾客', description: '更新后的说明', avatar: 'https://example.com/customer-avatar.png', assignee_entity_id: 2, sender_entity_ids: [3, 2], is_blocked: 1 })
  await expect(page.getByRole('button', { name: '保存顾客资料' })).toHaveAttribute('aria-disabled', 'true')
  expect(state.errors).toEqual([])
  expect(state.unexpected).toEqual([])
})

test('detail pilot readonly relations retain names and explain the disabled save', async ({ page }) => {
  const state = await fixture(page, 'readonly')
  await page.goto('http://demo.team.lostsky.work:5175/customers/518')
  await expect(page.getByText('只读', { exact: true })).toBeVisible()
  await expect(page.locator('.ls-field').filter({ has: page.locator('label[for="customer-assignee"]') })).toContainText(owner.name)
  await expect(page.locator('.ls-field').filter({ has: page.locator('label[for="customer-senders"]') })).toContainText(sender.name)
  await expect(page.locator('#customer-name')).toBeDisabled()
  await page.getByRole('button', { name: '保存顾客资料' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.n-message')).toHaveCount(1)
  expect(state.requests).not.toContain('/api/customer/assignees')
  expect(state.posts).toEqual([])
  expect(state.errors).toEqual([])
})

test('detail pilot loading and empty relations retain usable navigation', async ({ page }) => {
  const state = await fixture(page, 'loading')
  await page.goto('http://demo.team.lostsky.work:5175/customers/518')
  await expect(page.locator('.ls-async-state[aria-busy="true"]')).toBeVisible()
  await expect(page.getByRole('link', { name: '返回顾客列表' })).toBeVisible()
  state.release()
  await expect(page.locator('#customer-name')).toHaveValue('青空顾客')
  expect(state.errors).toEqual([])
})

for (const mode of ['empty', 'denied', 'missing', 'error', 'incomplete', 'candidate-error'] as const) {
  test(`detail pilot handles ${mode} locally without losing the shell`, async ({ page }) => {
    const state = await fixture(page, mode)
    await page.goto('http://demo.team.lostsky.work:5175/customers/518')
    await expect(page.getByRole('link', { name: '返回顾客列表' })).toBeVisible()
    if (mode === 'empty') {
      await expect(page.locator('#customer-name')).toHaveValue('青空顾客')
      await expect(page.locator('.ls-detail-page')).toContainText('未归属')
      await expect(page.locator('.ls-detail-page')).toContainText('未绑定协作发单人')
    } else if (mode === 'denied') {
      await expect(page.locator('.ls-empty-state')).toContainText('无法读取数据')
      await expect(page.locator('.ls-metric-grid dd')).toHaveText(['-', '-', '-'])
      await expect(page.locator('.ls-description-list dd')).toHaveText(['-', '-', '-'])
      await expect(page.locator('.ls-async-state')).toHaveCount(0)
      await expect(page.locator('.n-message')).toHaveCount(1)
      expect(state.requests.filter(path => path === '/api/customer/518')).toHaveLength(1)
    } else if (mode === 'missing') {
      await expect(page.locator('.ls-empty-state')).toContainText('顾客不存在')
      expect(state.requests.filter(path => path === '/api/customer/518')).toHaveLength(1)
    } else if (mode === 'candidate-error') {
      await expect(page.locator('.ls-inline-error')).toBeVisible()
      await expect(page.locator('#customer-name')).toBeVisible()
    } else {
      await expect(page.locator('.ls-async-state')).toContainText('暂时无法读取顾客详情')
      if (mode === 'incomplete') await expect(page.locator('.ls-async-state')).toContainText('顾客详情数据不完整')
    }
    await noOverflow(page)
    expect(state.errors).toEqual([])
    expect(state.unexpected).toEqual([])
  })
}
