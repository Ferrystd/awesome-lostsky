import { expect, test, type Locator, type Page } from './fixtures'

async function auth(page: Page, type: string) {
  const value = `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type, id: 31 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value, domain: '.lostsky.work', path: '/' }])
}

async function explain(page: Page, button: Locator, reason: string, keyboard = false) {
  await expect(button).toHaveAttribute('aria-disabled', 'true')
  await expect(button).not.toHaveAttribute('disabled')
  if (keyboard) {
    await button.focus()
    await page.keyboard.press('Enter')
  } else await button.click({ force: true })
  await expect(page.locator('.n-message').getByText(reason, { exact: true })).toHaveCount(1)
}

test('充值缺项提供可点击原因，清空金额后阻止请求并可恢复', async ({ page }) => {
  await auth(page, 'team')
  const origin = 'http://demo.transaction.lostsky.work:5177'
  const writes: unknown[] = []
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route(`${origin}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = {}
    if (path.endsWith('/workspace/access')) data = { permissions: ['transaction.write', 'transaction.read'], abilities: { transaction: { enabled: true } }, identity: { type: 'team', entity_id: 31 } }
    if (path.endsWith('/transaction/options')) data = { customers: [{ id: 5, nickname: '测试顾客', balance: { balance: '30.00' } }], entities: [] }
    if (path.endsWith('/transaction/balance/recharge')) { writes.push(route.request().postDataJSON()); data = { id: 1 } }
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
  await page.goto(`${origin}/recharge`)
  const submit = page.locator('form button[type=submit]')
  await expect(page.locator('#recharge-customer')).toBeVisible()
  await explain(page, submit, '请选择充值顾客')
  expect(writes).toHaveLength(0)
  await page.locator('#recharge-customer').click()
  await page.getByText('测试顾客', { exact: true }).click()
  await explain(page, submit, '请填写充值金额', true)
  expect(writes).toHaveLength(0)
  const amount = page.locator('#recharge-amount input')
  await amount.fill('25')
  await amount.blur()
  await expect(submit).toBeEnabled()
  await amount.fill('')
  await amount.blur()
  await explain(page, submit, '请填写充值金额')
  expect(writes).toHaveLength(0)
  await amount.fill('25')
  await amount.blur()
  await submit.click()
  await expect.poll(() => writes).toEqual([{ customer_id: 5, amount: 25, memo: '' }])
  expect(errors).toEqual([])
})

test('购买缺资料与接单人可解释，清空数量不写入且恢复后金额一致', async ({ page }) => {
  await auth(page, 'teamCustomer')
  const origin = 'http://demo.shop.lostsky.work:5179'
  const writes: unknown[] = []
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route(`${origin}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = {}
    if (path.endsWith('/customer/me')) data = { id: 31 }
    if (path.endsWith('/customer/balance')) data = { balance: '1000.00' }
    if (path.endsWith('/storefront/products/81')) data = {
      id: 81, name: '测试商品', kind: 1, price: '30.00',
      handlers: [{ id: 11, name: '接单甲', nickname: '接单甲', type: 'teamMember' }, { id: 12, name: '接单乙', nickname: '接单乙', type: 'teamMember' }], handler_groups: [],
      purchase_fields: [{ id: 1, name: '游戏账号', value_type: 'string', input_type: 'text', is_required: 1 }],
    }
    if (path.endsWith('/customer/orders') && route.request().method() === 'POST') { writes.push(route.request().postDataJSON()); data = { id: 91 } }
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
  await page.goto(`${origin}/product/81/checkout`)
  const submit = page.locator('.checkout-summary button[type=submit]')
  await explain(page, submit, '请补齐购买资料必填项', true)
  expect(writes).toHaveLength(0)
  await page.locator('#purchase-field-1 input').fill('player')
  await explain(page, submit, '请选择接单人')
  expect(writes).toHaveLength(0)
  await page.locator('.checkout-fields .ls-entity-select').click()
  await page.getByText('接单甲', { exact: true }).click()
  const quantity = page.locator('.checkout-fields .n-input-number input')
  await quantity.fill('')
  await quantity.blur()
  await explain(page, submit, '请填写购买数量', true)
  expect(writes).toHaveLength(0)
  await quantity.fill('2')
  await quantity.blur()
  await expect(page.locator('.checkout-summary')).toContainText('¥60.00')
  await expect(submit).toBeEnabled()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  await submit.click()
  await expect.poll(() => writes).toEqual([{ product_id: 81, quantity: 2, handler_entity_id: 11, purchase_values: { 1: 'player' } }])
  expect(errors).toEqual([])
})
