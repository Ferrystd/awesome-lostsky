import { expect, test } from '@playwright/test'

test('shop customer can view, start and cancel a service at desktop and 390px', async ({ page }) => {
  const customerToken = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamCustomer', id: 31 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: customerToken, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  let status: 1 | 2 = 1
  let cancelPending = false
  let startPayload: Record<string, unknown> | null = null
  const customer = { id: 31, team_id: 1, is_blocked: 0, profile: { name: '晚风客户' }, identity: { slug: 'evening-sky' } }
  const service = () => ({
    id: 101, status, ordinal: 1, expire_time: 1_900_000_000, is_expired: false,
    service: { id: 7, name: '十次咨询', description: '一次独立的咨询权益' },
    handler: status === 2 ? { id: 11, name: '青空接单人' } : null,
    cancel_requests: cancelPending ? [{ id: 8, status: 1, reason: '时间冲突' }] : [],
    redemption_fields: [
      { id: 5, name: '预约说明', value_type: 'string', input_type: 'text', fill_stage: 'customer', is_required: 1 },
    ],
  })
  await page.route('http://demo.shop.lostsky.work:5179/api/**', async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    let data: unknown = null
    if (path.endsWith('/storefront')) data = { slug: 'demo', type: 'team', product_count: 0, profile: { name: '青空服务' } }
    else if (path.endsWith('/customer/me')) data = customer
    else if (path.endsWith('/customer/services/101/handlers')) data = [{ entity_id: 11, subject: { id: 11, name: '青空接单人' } }]
    else if (path.endsWith('/customer/services/101/start')) { startPayload = request.postDataJSON(); status = 2 }
    else if (path.endsWith('/customer/services/101/cancel')) { cancelPending = true }
    else if (path.endsWith('/customer/services/101')) data = service()
    else if (path.endsWith('/customer/services')) data = { total: 1, page: 1, limit: 20, list: [service()] }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('http://demo.shop.lostsky.work:5179/services')
  await expect(page.getByRole('heading', { name: '我的服务', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: /十次咨询/ }).click()
  await page.locator('.n-select').click()
  await page.getByText('青空接单人', { exact: true }).last().click()
  await page.getByRole('textbox').first().fill('明天下午')
  await page.getByRole('button', { name: '提交核销' }).click()
  await expect.poll(() => startPayload).toMatchObject({ handler_entity_id: 11 })
  await expect(page.getByRole('heading', { name: '申请取消核销' })).toBeVisible()
  await page.getByRole('textbox').fill('时间冲突')
  await page.getByRole('button', { name: '提交申请' }).click()
  await expect(page.getByText('取消申请正在等待处理')).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('http://demo.shop.lostsky.work:5179/services')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  await expect(page.getByRole('link', { name: '我的服务' })).toBeVisible()
})

test('transaction service redemption supports management and fixed 390px navigation', async ({ page }) => {
  const actorToken = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamMember', id: 11 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: actorToken, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  let completed = false
  let completePayload: Record<string, unknown> | null = null
  const entity = { id: 11, entityable_type: 'teamMember', entityable_id: 1, type: 'member', slug: 'handler', name: '青空接单人', profile: { name: '青空接单人' } }
  const customer = { id: 31, profile: { name: '晚风客户' } }
  const service = () => ({
    id: 101, status: completed ? 3 : 2, expire_time: 1_900_000_000, started_at: 1_785_000_000,
    completed_at: completed ? 1_785_003_600 : null, service: { name: '十次咨询' }, customer,
    handler_entity_id: 11, handler: entity, cancel_requests: [],
    redemption_fields: [{ id: 6, name: '服务结果', value_type: 'text', input_type: 'textarea', fill_stage: 'manager', is_required: 1 }],
  })
  await page.route('http://demo.transaction.lostsky.work:5177/api/**', async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    let data: unknown = null
    if (path.endsWith('/workspace/access')) data = {
      team: { id: 1, slug: 'demo', name: '青空团队' },
      permissions: ['transaction.read', 'transaction.write', 'transaction.report.read'],
      abilities: { transaction: { enabled: true, level: 1, expire_time: 0, reason: null, label: '记账' } },
      identity: { type: 'teamMember' },
    }
    else if (path.endsWith('/service/101/handlers')) data = [{ entity_id: 11, subject: entity }]
    else if (path.endsWith('/service/101/complete')) { completePayload = request.postDataJSON(); completed = true }
    else if (path.endsWith('/service/101')) data = service()
    else if (path.endsWith('/service')) data = { total: 1, page: 1, limit: 20, list: [service()] }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('http://demo.transaction.lostsky.work:5177/services')
  await expect(page.locator('#workspace').getByRole('heading', { name: '服务核销', level: 1 }).last()).toBeVisible()
  await page.getByRole('link', { name: /十次咨询/ }).click()
  await expect(page.getByRole('link', { name: '返回核销' })).toHaveAttribute('href', '/services')
  await page.getByRole('textbox', { name: /服务结果/ }).fill('已完成咨询并回访')
  await page.getByRole('button', { name: '确认已核销' }).click()
  await expect.poll(() => completePayload).toMatchObject({ field_values: { 6: '已完成咨询并回访' } })
  await expect(page.getByText(/已核销/).first()).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('http://demo.transaction.lostsky.work:5177/services')
  const mobileNav = page.getByRole('navigation', { name: '移动端导航' })
  await expect(mobileNav.getByText('概览', { exact: true })).toBeVisible()
  await expect(mobileNav.getByText('流水', { exact: true })).toBeVisible()
  await expect(mobileNav.getByText('服务核销', { exact: true })).toBeVisible()
  await expect(mobileNav.getByText('更多', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
})
