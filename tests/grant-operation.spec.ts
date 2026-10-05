import { expect, test } from './fixtures'

const base = 'http://demo.transaction.lostsky.work:5177'
const result = { entitlement_ids: [101], entitlement_count: 1, transaction_id: 201, order_id: null }
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

test('manual grant recovers a lost response after refresh without duplicate issuance', async ({ page }) => {
  const token = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamMember', id: 11 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  const requests: { body: any; requestId: string | undefined }[] = []
  const ledger = new Map<string, typeof result>()
  let candidatesUnavailable = false
  const pageErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.fallback()
    let data: unknown = null
    if (path.endsWith('/workspace/access')) {
      data = { team: { id: 1, slug: 'demo', name: '团队' }, identity: { type: 'teamMember', entity_id: 11, name: '发单人', belongs_to_team: true }, permissions: ['transaction.write', 'service.entitlement.grant'], abilities: { transaction: { enabled: true, label: '记账' } } }
    } else if (path.endsWith('/entitlement-grant/options')) {
      if (candidatesUnavailable) {
        await route.fulfill({ status: 503, json: { code: 503, message: '候选暂不可用', data: null } })
        return
      }
      data = { products: [{ id: 31, name: '三小时服务', price: '300.00' }], customers: [{ id: 8, nickname: '晚风顾客', is_blocked: 0 }], entities: [{ id: 11, type: 'teamMember', name: '发单人', slug: 'sender' }], sync_transaction: true }
    } else if (path.endsWith('/entitlement-grant')) {
      const body = route.request().postDataJSON()
      requests.push({ body, requestId: route.request().headers()['x-request-id'] })
      expect(body.idempotency_key).toMatch(uuidPattern)
      if (!ledger.has(body.idempotency_key)) ledger.set(body.idempotency_key, result)
      if (requests.length === 1) {
        // The server committed once, but the browser never receives its response.
        await route.abort('connectionreset')
        return
      }
      data = ledger.get(body.idempotency_key)
    }
    await route.fulfill({ json: { code: 0, message: '', data } })
  })

  await page.goto(`${base}/entitlements/new`)
  await expect(page.locator('#workspace')).toBeVisible().catch(error => { throw new Error(`${error.message}; ${page.url()}; ${pageErrors.join(' | ')}`) })
  await page.locator('#grant-product').click()
  await page.getByText('三小时服务 · ¥300.00', { exact: true }).click()
  await page.locator('#grant-customer').click()
  await page.getByText('晚风顾客', { exact: true }).last().click()
  await page.locator('#grant-quantity input').fill('')
  await page.locator('#grant-quantity input').press('Tab')
  await expect(page.getByRole('button', { name: '确认提交', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: '确认提交', exact: true }).click({ force: true })
  expect(requests).toHaveLength(0)
  await page.locator('#grant-quantity input').fill('1')
  await page.locator('#grant-quantity input').press('Tab')
  await page.getByRole('button', { name: '确认提交', exact: true }).click()
  await expect(page.getByRole('button', { name: '重试确认结果' })).toBeEnabled()
  await expect(page.getByText('发放结果待确认', { exact: true })).toBeVisible()
  await expect(page.locator('#grant-quantity')).toHaveCount(0)
  expect(requests).toHaveLength(1)
  candidatesUnavailable = true
  await page.reload()
  await expect(page.getByRole('button', { name: '重试确认结果' })).toBeEnabled()
  expect(requests).toHaveLength(1) // Restoration must not send automatically.
  await page.getByRole('button', { name: '重试确认结果' }).click()
  await expect(page.locator('.grant-result')).toContainText('已生成流水 #201')
  expect(requests).toHaveLength(2)
  expect(requests[1].body).toEqual(requests[0].body)
  expect(requests[1].requestId).not.toBe(requests[0].requestId)
  expect(ledger.size).toBe(1)
  expect(await page.evaluate(() => Object.keys(sessionStorage).filter(key => key.startsWith('lostsky:entitlement-grant:')))).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  candidatesUnavailable = false
  await page.reload()
  await page.locator('#grant-product').click()
  await page.getByText('三小时服务 · ¥300.00', { exact: true }).click()
  await page.locator('#grant-customer').click()
  await page.getByText('晚风顾客', { exact: true }).last().click()
  await page.getByRole('button', { name: '确认提交', exact: true }).click()
  await expect(page.locator('.grant-result')).toBeVisible()
  expect(requests[2].body.idempotency_key).not.toBe(requests[0].body.idempotency_key)
  expect(ledger.size).toBe(2)
  expect(pageErrors).toEqual([])
})
