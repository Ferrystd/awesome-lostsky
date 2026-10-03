import { expect, test } from '@playwright/test'

test('new product is immediately selectable in a new bundle without reloading', async ({ page }) => {
  const token = `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: 'teamMember', id: 11 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  const writes: any[] = []
  let optionsReads = 0
  await page.route('http://demo.shop.lostsky.work:5179/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = null
    if (route.request().method() === 'POST') {
      writes.push(route.request().postDataJSON()); data = { id: 8 }
    } else if (path.endsWith('/manage/access')) {
      data = { identity: { type: 'teamMember', entity_id: 71 }, permissions: ['shop.product.self.manage'] }
    } else if (path.endsWith('/personal/products/options')) {
      optionsReads++
      data = { entities: [], products: writes.length ? [{ id: 8, name: '刚创建的普通商品', kind: 1, entity_id: 71, price: '10.00', cost: '0.00', handler_cut: '0.00', sender_cut: '0.00', cs_cut: '0.00', is_active: 1 }] : [] }
    } else if (path.endsWith('/personal/products/8')) data = { ...writes[0], id: 8 }
    else if (path.endsWith('/personal/products')) data = { total: 0, page: 1, limit: 20, list: [] }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })
  await page.goto('http://demo.shop.lostsky.work:5179/manage/personal/products/new')
  await page.locator('#product-name input').fill('刚创建的普通商品')
  await page.getByRole('textbox', { name: '封面', exact: true }).fill('https://example.com/product.webp')
  await page.locator('#product-price input').fill('10')
  await page.locator('#product-name input').focus()
  await page.getByRole('button', { name: '保存商品' }).click()
  await expect(page).toHaveURL(/\/manage\/personal\/products\/8$/)
  await page.getByRole('link', { name: '返回我的商品', exact: true }).click()
  await page.getByRole('link', { name: '新建商品', exact: true }).click()
  await page.locator('#product-kind').click()
  await page.getByText('套餐', { exact: true }).click()
  await page.getByRole('button', { name: '添加商品', exact: true }).click()
  await page.locator('#product-item-0').click()
  await page.getByText('刚创建的普通商品', { exact: false }).click()
  await expect(page.locator('#product-price input')).toHaveValue('10.00')
  expect(optionsReads).toBeGreaterThan(1)
  expect(writes).toHaveLength(1)
})

for (const kind of [4, 2, 3]) {
test(`product kind ${kind} edits quantity in one product request`, async ({ page }) => {
  const token = `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: 'teamMember', id: 11 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  const errors: string[] = []
  const writes: Array<{ path: string; body: any }> = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('http://demo.shop.lostsky.work:5179/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = null
    if (route.request().method() === 'POST') {
      writes.push({ path, body: route.request().postDataJSON() })
      data = { id: 7 }
    } else if (path.endsWith('/manage/access')) {
      data = { identity: { type: 'teamMember', entity_id: 71, name: '成员' }, permissions: ['shop.product.self.manage'] }
    } else if (path.endsWith('/personal/products/options')) {
      data = { entities: [], packages: [], campaigns: [], service_defaults: {}, products: [{ id: 8, name: '普通子项', kind: 1, entity_id: null, price: '10.00', cost: '0.00', handler_cut: '8.00', sender_cut: '1.00', cs_cut: '0.00', is_active: 1 }] }
    } else if (path.endsWith('/personal/products/7')) {
      data = { id: 7, name: '测试商品', kind, price: '10.00', cost: '0.00', handler_cut: '8.00', sender_cut: '1.00', cs_cut: '0.00', cover_image: '/product.webp', is_active: 1,
        ...(kind === 4 ? {} : { items: [{ product_id: 8, quantity: 2 }] }),
        redemption: { unit_name: '小时', quantity: '2', quantity_step: '0.5', valid_days: 30, handler_entity_ids: [] } }
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })
  await page.goto('http://demo.shop.lostsky.work:5179/manage/personal/products/7')
  const quota = page.locator(kind === 4 ? '#product-quota input' : '#product-item-quantity-0 input')
  await expect(quota).toHaveValue(kind === 4 ? '2.0000' : '2')
  await quota.fill('')
  await page.locator('#product-name input').focus()
  await expect(page.getByRole('button', { name: '保存商品' })).toBeDisabled()
  await quota.fill('3')
  await page.locator('#product-name input').focus()
  if (kind !== 4) await expect(page.locator('#product-price input')).toHaveValue('30.00')
  if (kind === 4) {
    await page.locator('#product-unused-auto-complete input').fill('120')
    await page.locator('#product-auto-complete input').fill('60')
    await page.locator('#product-auto-complete input').fill('')
    await page.locator('#product-name input').focus()
    await page.getByRole('button', { name: '添加核销字段' }).click()
    await expect(page.getByRole('button', { name: '保存商品' })).toBeDisabled()
    await page.locator('[id^="field-name-"] input').fill('核销备注')
  }
  await page.getByRole('button', { name: '保存商品' }).click()
  await expect.poll(() => writes.length).toBe(1)
  if (kind === 4) {
    expect(writes[0].body.redemption.quantity).toBe('3')
    expect(writes[0].body.redemption.unused_auto_complete_after_minutes).toBe(120)
    expect(writes[0].body.redemption.auto_complete_after_minutes).toBeNull()
    expect(writes[0].body.redemption.redemption_fields).toEqual([expect.objectContaining({ name: '核销备注', value_type: 'string', fill_stage: 'manager' })])
  }
  else {
    expect(writes[0].body.items).toEqual([{ product_id: 8, quantity: 3 }])
    for (const key of ['price', 'cost', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut']) expect(writes[0].body).not.toHaveProperty(key)
  }
  expect(writes[0].body).not.toHaveProperty('benefit_package_id')
  expect(writes[0].body).not.toHaveProperty('handler_entity_ids')
  expect(errors).toEqual([])
})
}

for (const scenario of [
  { name: 'own without reprice', owner: 71, kind: 1, reprice: false, priceLocked: false, cutLocked: true },
  { name: 'public without reprice', owner: null, kind: 1, reprice: false, priceLocked: true, cutLocked: true },
  { name: 'public with reprice', owner: null, kind: 1, reprice: true, priceLocked: false, cutLocked: false },
  { name: 'nested with reprice', owner: 71, kind: 2, reprice: true, priceLocked: true, cutLocked: true },
]) {
  test(`composition prices: ${scenario.name}`, async ({ page }) => {
    const token = `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: 'teamMember', id: 11 } })).toString('base64url')}.x`
    await page.context().addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
    const writes: any[] = []
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('http://demo.shop.lostsky.work:5179/api/**', async route => {
      const path = new URL(route.request().url()).pathname
      let data: unknown = null
      const money = { price: '10.00', cost: '0.00', handler_cut: '8.00', sender_cut: '1.00', cs_cut: '0.00' }
      if (route.request().method() === 'POST') { writes.push(route.request().postDataJSON()); data = { id: 7 } }
      else if (path.endsWith('/manage/access')) data = { identity: { type: 'teamMember', entity_id: 71 }, permissions: ['shop.product.self.manage', ...(scenario.reprice ? ['shop.product.self.reprice'] : [])] }
      else if (path.endsWith('/personal/products/options')) data = { entities: [], packages: [], campaigns: [], products: [{ id: 8, name: '用于分项调价验证的商品', kind: scenario.kind, entity_id: scenario.owner, ...money, is_active: 1 }] }
      else if (path.endsWith('/personal/products/7')) data = { id: 7, name: '组合商品', kind: 2, ...money, cover_image: '/product.webp', is_active: 1, items: [{ product_id: 8, quantity: 2 }] }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
    })
    await page.goto('http://demo.shop.lostsky.work:5179/manage/personal/products/7')
    const price = page.locator('#product-item-unit_price-0 input')
    const handler = page.locator('#product-item-unit_handler_cut-0 input')
    await expect(price).toHaveValue('10.00')
    if (scenario.priceLocked) await expect(price).toBeDisabled()
    else await expect(price).toBeEnabled()
    if (scenario.cutLocked) await expect(handler).toBeDisabled()
    else await expect(handler).toBeEnabled()
    if (!scenario.priceLocked) {
      await price.fill('')
      await page.locator('#product-name input').focus()
      await expect(page.getByRole('button', { name: '保存商品' })).toBeDisabled()
      await price.fill('5')
      await page.locator('#product-name input').focus()
      await expect(page.getByRole('button', { name: '保存商品' })).toBeDisabled()
      await price.fill('20')
      await page.locator('#product-name input').focus()
      await expect(page.locator('#product-price input')).toHaveValue('40.00')
      if (!scenario.cutLocked) { await handler.fill('11'); await page.locator('#product-name input').focus() }
      else await expect(handler).toHaveValue('8.00')
    }
    const fitsViewport = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
    expect(fitsViewport).toBe(true)
    await page.getByRole('button', { name: '保存商品' }).click()
    await expect.poll(() => writes.length).toBe(1)
    if (!scenario.priceLocked) expect(writes[0].items[0].unit_price).toBe('20.00')
    if (!scenario.cutLocked) expect(writes[0].items[0].unit_handler_cut).toBe('11.00')
    expect(writes[0]).not.toHaveProperty('price')
    expect(errors).toEqual([])
  })
}
