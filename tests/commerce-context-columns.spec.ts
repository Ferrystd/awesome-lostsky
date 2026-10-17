import { expect, test, type Page } from './fixtures'

const shop = process.env.SHOP_TEST_ORIGIN ?? 'http://demo.shop.lostsky.work:5274'
const transaction = process.env.TRANSACTION_TEST_ORIGIN ?? 'http://demo.transaction.lostsky.work:5277'
const longName = '用于核对侧栏在长内容下仍能完整阅读的测试资料'.repeat(4)
const entity = { id: 1, entity_id: 1, type: 'teamMember', name: '测试人员', slug: 'member' }
const customer = { id: 1, entity_id: 2, nickname: longName, name: longName, profile: { name: longName }, is_blocked: 0, balance: { balance: '100.00', recharged: '100.00', spent: '0.00' } }
const product = { id: 1, team_id: 1, entity_id: null, name: longName, description: longName, kind: 1, price: '100.00', cost: '10.00', handler_cut: '80.00', sender_cut: '5.00', cs_cut: '0.00', team_cut: '5.00', is_active: 1, handlers: [], purchase_fields: [], items: [], variants: [] }
const record = { id: 1, type: '记账登记', handler_entity_id: 1, sender_entity_id: 1, cs_entity_id: null, customer_id: 1, handler: entity, sender: entity, customer, total_price: '100.00', cost: '10.00', cash: '90.00', prepaid: '10.00', handler_cut: '80.00', sender_cut: '5.00', cs_cut: '0.00', team_cut: '5.00', trans_at: 1792152000, memo: longName }
const task = { id: 1, status: 2, status_code: 2, quantity: '1.00', handler_cut: '80.00', service: { name: '测试核销服务' }, customer, handler: entity, sender: entity, entitlement: { unit_name: '次', quantity_step: '1' }, redemption_fields: [{ id: 1, name: longName, value_type: 'string', input_type: 'text', fill_stage: 'manager', is_required: 0 }], capabilities: { manage: true, approve_cancel: true }, memo: longName }

async function mock(page: Page, permissions = ['shop', 'transaction', 'service', 'file']) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.context().addCookies([{ name: 'lostsky_token', value: `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: 'teamMember', id: 1 } })).toString('base64url')}.x`, domain: '.lostsky.work', path: '/' }])
  const access = { permissions, team: { id: 1, slug: 'demo', name: '测试团队' }, identity: { ...entity, belongs_to_team: true, is_external: false }, abilities: { transaction: { enabled: true }, shop: { enabled: true }, file: { enabled: true } }, file_upload: { available: true, count: 0, total_size: 0, size_limit: null, remaining_size: null, reason: null } }
  const options = { entities: [entity], customers: [customer], products: [product], services: [], packages: [], campaigns: [], service_defaults: { default_handler_rate_percent: 80, default_sender_rate_percent: 15, default_cs_rate_percent: 0, default_auto_complete_after_minutes: null } }
  const fixtures: Record<string, unknown> = {
    '/manage/access': access, '/workspace/access': access,
    '/manage/options': options, '/personal/products/options': options,
    '/product/1': product, '/personal/products/1': product,
    '/order/1': { ...record, product_id: 1, product_name: longName, status: 1, quantity: 1, unit_price: '100.00', create_time: 1792152000, trans_id: 1, purchase_fields: [{ id: 1, name: '购买说明', value_type: 'text', value: longName }] },
    '/transaction/options': options, '/personal/transaction-options': options,
    '/transaction/1': record, '/personal/transactions/1': record,
    '/entitlement-grant/options': { ...options, sync_transaction: false }, '/personal/entitlement-grant/options': { ...options, sync_transaction: false },
    '/service/1': task, '/service/1/handlers': [],
    '/personal/services/1': task, '/personal/services/available/1': task, '/personal/service-offers/1': { ...task, status: 1 },
  }
  for (const origin of [shop, transaction]) await page.route(`${origin}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '')
    if (route.request().method() !== 'GET' || !(path in fixtures)) throw new Error(`未声明业务请求 ${route.request().method()} ${path}`)
    await route.fulfill({ json: { code: 0, message: 'ok', data: fixtures[path] } })
  })
}

async function geometry(page: Page, width: number, font: number) {
  await page.setViewportSize({ width, height: 1000 })
  await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px` }, font)
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  const boxes = await page.locator('.page-context').evaluate(element => {
    const box = element.getBoundingClientRect()
    const main = element.querySelector('.page-context__main')!.getBoundingClientRect()
    const aside = element.querySelector('.page-context__aside')!.getBoundingClientRect()
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
    return { box: box.toJSON(), main: main.toJSON(), aside: aside.toJSON(), horizontal: box.width >= 48 * rem }
  })
  if (boxes.horizontal) {
    expect(boxes.aside.x).toBeGreaterThan(boxes.main.right)
    expect(Math.abs(boxes.main.width / boxes.aside.width - 2)).toBeLessThan(.02)
  } else {
    expect(boxes.aside.y).toBeGreaterThanOrEqual(boxes.main.bottom - 1)
    expect(boxes.aside.x).toBeCloseTo(boxes.main.x, 0)
  }
  expect(boxes.aside.right).toBeLessThanOrEqual(boxes.box.right + 1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${width}/${font}: no page overflow`).toBe(true)
  const overflow = await page.locator('.page-context__aside').evaluate(element => element.scrollWidth > element.clientWidth + 1)
  expect(overflow).toBe(false)
}

test('commerce context columns cover all 17 live task routes at actual container breakpoints', async ({ page }) => {
  test.setTimeout(240_000)
  await mock(page)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const paths = [
    [shop, '/manage/products/new'], [shop, '/manage/products/1'], [shop, '/manage/personal/products/new'], [shop, '/manage/personal/products/1'], [shop, '/manage/orders/new'], [shop, '/manage/orders/1'],
    [transaction, '/personal/transactions/new'], [transaction, '/edit?id=1'], [transaction, '/recharge?customer_id=1'], [transaction, '/entitlements/new'], [transaction, '/personal/entitlements/new'], [transaction, '/detail?id=1'], [transaction, '/personal/transactions/1'], [transaction, '/services/1'], [transaction, '/personal/service-offers/1'], [transaction, '/personal/services/available/1'], [transaction, '/personal/services/1'],
  ]
  for (const [origin, path] of paths) {
    await page.goto(origin + path)
    await expect(page.locator('.page-context__aside'), path).toBeVisible()
    await expect(page.locator('.page-context__main')).toBeVisible()
    for (const font of [16, 32]) for (const width of [320, 375, 768, 1024, 1440]) await geometry(page, width, font)
    await expect(page.locator('.page-context__aside button[type="submit"]')).toHaveCount(0)
  }
  expect(errors).toEqual([])
})

test('amount context follows draft values, preserves null amounts and original save payloads', async ({ page }) => {
  await mock(page)
  await page.goto(`${transaction}/edit?id=1`)
  const aside = page.getByRole('complementary', { name: '流水金额与顾客摘要' })
  await expect(aside).toContainText('¥100.00')
  await page.locator('#transaction-total input').fill('120')
  await page.locator('#transaction-total input').blur()
  await expect(aside).toContainText('¥120.00')
  await expect(aside).toContainText('金额未平衡')
  await page.locator('#transaction-total input').fill('')
  await page.locator('#transaction-total input').blur()
  await expect(aside).toContainText('金额待补全')
  await page.locator('#transaction-total input').fill('100')
  await page.locator('#transaction-memo textarea').fill('侧栏不能加入提交载荷')
  const request = page.waitForRequest(request => request.url() === `${transaction}/api/transaction/1` && request.method() === 'POST')
  await page.route(`${transaction}/api/transaction/1`, route => route.request().method() === 'POST' ? route.fulfill({ json: { code: 0, message: 'ok', data: { id: 1 } } }) : route.fulfill({ json: { code: 0, message: 'ok', data: record } }))
  await page.getByRole('button', { name: '保存流水', exact: true }).click()
  const body = (await request).postDataJSON()
  expect(body).toEqual({ expected_entity_id: 1, sender_entity_id: 1, cs_entity_id: null, customer_id: 1, total_price: 100, cost: 10, cash: 90, prepaid: 10, handler_cut: 80, sender_cut: 5, cs_cut: 0, team_cut: 5, trans_at: 1792152000, memo: '侧栏不能加入提交载荷' })
  await page.goto(`${transaction}/recharge?customer_id=1`)
  const recharge = page.getByRole('complementary', { name: '顾客充值核对' })
  await page.locator('#recharge-amount input').fill('25.5')
  await page.locator('#recharge-amount input').blur()
  await expect(recharge).toContainText('¥125.50')
})

test('contexts do not reveal initial or cached values when read permission is denied', async ({ page }) => {
  await mock(page, [])
  await page.goto(`${transaction}/edit?id=1`)
  const aside = page.getByRole('complementary', { name: '流水金额与顾客摘要' })
  await expect(aside).toContainText('暂无可查看')
  await expect(aside).not.toContainText('¥0.00')
  await expect(aside).not.toContainText(longName)
  await page.goto(`${shop}/manage/products/1`)
  await expect(page.getByRole('complementary', { name: '商品草稿摘要' })).toContainText('暂无可查看')
  await expect(page.getByRole('complementary', { name: '商品草稿摘要' })).not.toContainText(longName)
})

test('loading and failed reads never turn initial form zeroes into saved amounts', async ({ page }) => {
  await mock(page)
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route(`${transaction}/api/transaction/1`, async route => {
    await gate
    await route.fulfill({ status: 500, json: { code: 500, message: '模拟读取失败', data: null } })
  })
  await page.goto(`${transaction}/edit?id=1`)
  const aside = page.getByRole('complementary', { name: '流水金额与顾客摘要' })
  await expect(aside).toContainText('正在读取已保存流水')
  await expect(aside.getByText('¥0.00', { exact: true })).toHaveCount(0)
  release()
  await expect(aside).toContainText('流水读取失败', { timeout: 15_000 })
  await expect(aside.getByText('¥0.00', { exact: true })).toHaveCount(0)
})

test('unconfirmed entitlement context uses the stored operation instead of the empty draft', async ({ page }) => {
  await mock(page)
  await page.addInitScript(() => {
    sessionStorage.setItem('lostsky:entitlement-grant:' + JSON.stringify([location.host, 1, 1, 'team']), JSON.stringify({ version: 1, key: '6a9dd349-b764-4c72-b122-6f88c8722e81', payload: { product_id: 1, customer_id: 1, quantity: 3, sender_entity_id: 1, cs_entity_id: null } }))
  })
  await page.goto(`${transaction}/entitlements/new`)
  const aside = page.getByRole('complementary', { name: '权益发放核对' })
  await expect(aside).toContainText('本次待确认操作的固定内容')
  await expect(aside.locator('dt', { hasText: '份数' }).locator('+ dd')).toHaveText('3')
  await expect(aside).toContainText('以本次发放确认结果为准')
  await expect(page.locator('.page-context__main')).toContainText('发放结果待确认')
  await expect(page.locator('#grant-quantity')).toHaveCount(0)
})
