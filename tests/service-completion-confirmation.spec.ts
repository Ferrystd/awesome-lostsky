import { expect, test } from '@playwright/test'

test('顾客拒绝结单后可申请取消，重新请求后确认完成', async ({ page }) => {
  const value = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamCustomer', id: 31 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value, domain: '.lostsky.work', path: '/' }])
  const writes: Array<{ path: string; body: unknown }> = []
  let service: { id: number; name: string } | null = { id: 7, name: '服务测试' }
  const instance = { id: 201, status: 2, quantity: '1', completion_requested_at: 1_800_000_000 as number | null, completion_due_at: 1_800_003_600 as number | null, handler: { name: '接单人' }, cancel_requests: [], adjustments: [] }
  await page.route('http://demo.shop.lostsky.work:5179/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = {}
    if (route.request().method() === 'POST') {
      writes.push({ path, body: route.request().postDataJSON() })
      if (path.endsWith('/completion/reject')) { instance.completion_requested_at = null; instance.completion_due_at = null }
      if (path.endsWith('/complete')) instance.status = 3
    }
    if (path.endsWith('/customer/me')) data = { id: 31 }
    if (path.endsWith('/customer/services/101/handlers')) data = []
    if (path.endsWith('/customer/services/101')) data = {
      id: 101, granted_quantity: '2', available_quantity: '1', reserved_quantity: '1', consumed_quantity: '0',
      unit_name: '次', quantity_step: '1', expire_time: 0, is_expired: false, is_exhausted: false,
      unused_auto_complete_due_at: 1_800_008_000, service, instances: [instance, {
        id: 202, status: 3, quantity: '1', settlement_kind: 'unused', handler_cut: '80.00', team_cut: '20.00', settled_handler_cut: '0.00', settled_team_cut: '100.00',
      }],
    }
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
  await page.goto('http://demo.shop.lostsky.work:5179/services/101')
  const section = page.locator('.history-row').first()
  const unused = page.locator('.history-row').nth(1)
  await expect(unused).toContainText('未使用权益已结单')
  await expect(unused).not.toContainText(/实结|分成|80\.00|100\.00/)
  await expect(section.getByRole('button', { name: '确认结单', exact: true })).toBeVisible()
  await expect(section.getByRole('button', { name: '申请取消' })).toHaveCount(0)
  const reject = section.getByRole('button', { name: '拒绝结单', exact: true })
  await expect(reject).not.toHaveAttribute('disabled')
  await reject.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.n-message').getByText('请填写拒绝结单的原因')).toHaveCount(1)
  expect(writes).toHaveLength(0)
  await page.locator('#completion-reason-201 input').fill('  服务仍需补充  ')
  await reject.click()
  await expect.poll(() => writes).toEqual([{ path: '/api/customer/service-redemptions/201/completion/reject', body: { reason: '服务仍需补充' } }])
  await expect(section.getByRole('button', { name: '申请取消' })).toBeVisible()
  instance.completion_requested_at = 1_800_000_100
  instance.completion_due_at = null
  await page.reload()
  await expect(section).toContainText('请确认服务已完成')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  await section.getByRole('button', { name: '确认结单', exact: true }).click()
  await expect.poll(() => writes.length).toBe(2)
  expect(writes[1]).toEqual({ path: '/api/customer/service-redemptions/201/complete', body: {} })
  await expect(section.getByRole('button', { name: '确认结单', exact: true })).toHaveCount(0)
  await expect(section).toContainText('已核销')
  service = null
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: '服务权益', exact: true })).toBeVisible()
  await expect(section).toContainText('已核销')
})
