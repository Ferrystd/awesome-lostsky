import { expect, test } from '@playwright/test'

test('creates a multi variant product in one atomic request', async ({ page }) => {
  const token = `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: 'teamMember', id: 11 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  const writes: Record<string, any>[] = []
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('http://demo.shop.lostsky.work:5179/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = null
    if (route.request().method() === 'POST') { writes.push(route.request().postDataJSON()); data = { id: 81 } }
    else if (path.endsWith('/manage/access')) data = { identity: { type: 'teamMember', entity_id: 71 }, permissions: ['shop.product.self.manage', 'shop.product.self.reprice'] }
    else if (path.endsWith('/personal/products/options')) data = { entities: [], products: [], service_defaults: { default_handler_rate_percent: 80, default_sender_rate_percent: 15, default_cs_rate_percent: 0 } }
    else if (path.endsWith('/personal/products/81')) data = { ...writes[0], id: 81, price: '0.00', cost: '0.00' }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })
  await page.goto('http://demo.shop.lostsky.work:5179/manage/personal/products/new')
  await page.locator('#product-name input').fill('多规格测试商品')
  await page.getByRole('textbox', { name: '封面', exact: true }).fill('https://example.com/product.webp')
  await page.locator('#product-kind').click()
  await page.getByText('多规格商品', { exact: true }).click()
  await page.getByRole('button', { name: '添加规格', exact: true }).click()
  await page.locator('#variant-0-name input').fill('体验版')
  await page.locator('#variant-0-price input').fill('30')
  await page.locator('#variant-0-name input').focus()
  await expect(page.getByRole('button', { name: '保存商品', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: '保存商品', exact: true }).click()
  await expect(page).toHaveURL(/\/personal\/products\/81$/)
  expect(writes).toHaveLength(1)
  expect(writes[0].kind).toBe(5)
  expect(writes[0]).not.toHaveProperty('price')
  expect(writes[0].variants).toHaveLength(1)
  expect(writes[0].variants[0]).toMatchObject({ name: '体验版', kind: 1, price: '30.00', handler_cut: '24.00', sender_cut: '4.50' })
  expect(errors).toEqual([])
})

test('checkout switches variant price and submits the selected hidden product', async ({ page }) => {
  const token = `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: 'teamCustomer', id: 31 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  let purchase: unknown
  const variants = [
    { id: 82, name: '基础版', kind: 1, price: '30.00', cover_image: '', handlers: [], handler_groups: [] },
    { id: 83, name: '豪华版', kind: 4, price: '60.00', cover_image: '', handlers: [], handler_groups: [], description: '豪华版核销服务' },
  ]
  await page.route('http://demo.shop.lostsky.work:5179/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = null
    if (path.endsWith('/customer/me')) data = { id: 31 }
    else if (path.endsWith('/customer/balance')) data = { balance: '1000.00' }
    else if (path.endsWith('/storefront/products/81')) data = { id: 81, name: '多规格服务', kind: 5, price: '30.00', variants }
    else if (path.endsWith('/customer/orders') && route.request().method() === 'POST') {
      purchase = route.request().postDataJSON()
      data = { id: 91 }
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })
  await page.goto('http://demo.shop.lostsky.work:5179/product/81/checkout')
  const buy = page.getByRole('button', { name: '使用余额购买', exact: true })
  await expect(buy).toBeDisabled()
  await expect(buy).not.toHaveAttribute('disabled')
  await buy.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('请选择购买规格', { exact: true })).toHaveCount(1)
  expect(purchase).toBeUndefined()
  await page.locator('.checkout-fields .n-select').click()
  await page.getByText('豪华版 · ¥60.00', { exact: true }).click()
  await expect(page.locator('.checkout-product')).toContainText('¥60.00 / 件')
  await expect(page.locator('.checkout-summary')).toContainText('¥60.00')
  await expect(page.getByText('豪华版核销服务', { exact: true })).toBeVisible()
  await expect(buy).toBeEnabled()
  await buy.click()
  await expect(page).toHaveURL(/\/orders\/91$/)
  expect(purchase).toEqual({ product_id: 83, quantity: 1 })
  expect(errors).toEqual([])
})

test('variant composition restores baseline prices when nesting is introduced', async ({ page }) => {
  const token = `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: 'teamMember', id: 11 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const candidates = [
    { id: 101, name: '基础服务', kind: 1, entity_id: 71, price: '30.00', cost: '0.00', handler_cut: '24.00', sender_cut: '4.50', cs_cut: '0.00' },
    { id: 102, name: '嵌套套餐', kind: 2, entity_id: 71, price: '50.00', cost: '0.00', handler_cut: '40.00', sender_cut: '7.50', cs_cut: '0.00' },
  ]
  let payload: Record<string, any> | undefined
  await page.route('http://demo.shop.lostsky.work:5179/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = null
    if (route.request().method() === 'POST') { payload = route.request().postDataJSON(); data = { id: 81 } }
    else if (path.endsWith('/manage/access')) data = { identity: { type: 'teamMember', entity_id: 71 }, permissions: ['shop.product.self.manage', 'shop.product.self.reprice'] }
    else if (path.endsWith('/personal/products/options')) data = { entities: [], products: candidates, service_defaults: { default_handler_rate_percent: 80, default_sender_rate_percent: 15, default_cs_rate_percent: 0 } }
    else if (path.endsWith('/personal/products/81')) data = { ...payload, id: 81, price: '0.00', cost: '0.00' }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })
  await page.goto('http://demo.shop.lostsky.work:5179/manage/personal/products/new')
  await page.locator('#product-name input').fill('套餐规格测试')
  await page.getByRole('textbox', { name: '封面', exact: true }).fill('https://example.com/product.webp')
  await page.locator('#product-kind').click()
  await page.getByText('多规格商品', { exact: true }).click()
  await page.getByRole('button', { name: '添加规格', exact: true }).click()
  await page.locator('#variant-0-name input').fill('组合版')
  await page.locator('#variant-0-kind').click()
  await page.locator('.n-base-select-menu:visible').getByText('套餐', { exact: true }).click()
  await page.getByRole('button', { name: '添加商品', exact: true }).click()
  await page.locator('#variant-0-item-0').click()
  await page.locator('.n-base-select-menu:visible').getByText('基础服务', { exact: true }).click()
  const price = page.locator('#variant-0-unit_price-0 input')
  const save = page.getByRole('button', { name: '保存商品', exact: true })
  await price.fill('')
  await page.locator('#variant-0-name input').focus()
  await expect(save).toBeDisabled()
  await price.fill('40')
  await page.locator('#variant-0-name input').focus()
  await expect(save).toBeEnabled()
  await page.getByRole('button', { name: '添加商品', exact: true }).click()
  await page.locator('#variant-0-item-1').click()
  await page.locator('.n-base-select-menu:visible').getByText('嵌套套餐', { exact: true }).click()
  await expect(price).toBeDisabled()
  await expect(price).toHaveValue('30.00')
  await expect(page.getByText('规格售价：¥80.00，由各分项按份数汇总。', { exact: true })).toBeVisible()
  await save.click()
  await expect(page).toHaveURL(/\/personal\/products\/81$/)
  expect(payload?.variants[0].items).toEqual([{ product_id: 101, quantity: 1 }, { product_id: 102, quantity: 1 }])
  expect(errors).toEqual([])
})
