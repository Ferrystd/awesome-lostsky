import { expect, test, type Page } from './fixtures'

const origin = process.env.FORM_PILOT_ORIGIN || 'http://demo.shop.lostsky.work:5179'
const product = { id: 7, name: '已有商品', description: '', cover_image: '/fixture-cover.svg', kind: 1, price: '100.00', cost: '0.00', handler_cut: '80.00', sender_cut: '15.00', cs_cut: '0.00', is_active: 1 }
const options = { entities: [], products: [], service_defaults: { default_handler_rate_percent: 80, default_sender_rate_percent: 15, default_cs_rate_percent: 0, default_auto_complete_after_minutes: null } }

async function fixture(page: Page, permissions = ['shop.product.read', 'shop.product.write', 'shop.product.self.manage']) {
  const token = `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: 'teamMember', id: 11 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/' }])
  const state = { writes: [] as any[], failSave: false, failOptions: false, holdOptions: false, optionsReads: 0 }
  await page.route('**/fixture-cover.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#21434a"/></svg>' }))
  await page.route(`${origin}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname
    let data: unknown
    if (route.request().method() === 'POST') {
      if (path !== '/api/product') throw new Error(`Unexpected write: ${path}`)
      state.writes.push(route.request().postDataJSON())
      if (state.failSave) return route.fulfill({ json: { code: 1, message: '商品保存失败，请稍后再试', data: null } })
      data = { id: 7 }
    } else if (path.endsWith('/manage/access')) data = { team: { id: 1, slug: 'demo', name: '青空团队' }, identity: { type: 'teamMember', entity_id: 71 }, permissions, file_upload: { enabled: true } }
    else if (path.endsWith('/options')) {
      state.optionsReads++
      while (state.holdOptions) await new Promise(resolve => setTimeout(resolve, 50))
      if (state.failOptions) return route.fulfill({ json: { code: 1, message: '商品候选读取失败', data: null } })
      data = options
    } else if (path.endsWith('/product/7') || path.endsWith('/personal/products/7')) data = { ...product, ...(state.writes.at(-1) ?? {}) }
    else if (path.endsWith('/storefront')) data = { team: { name: '青空团队', slug: 'demo' }, profile: { name: '青空团队', description: '公开商城' }, available: true }
    else if (path.endsWith('/products') || path.endsWith('/product')) data = { list: [], total: 0, page: 1, limit: 20 }
    else throw new Error(`Missing fixture: ${path}`)
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
  return state
}

async function fillProduct(page: Page) {
  await page.locator('#product-name input').fill('青空商品草稿')
  await page.locator('#product-description textarea').fill('用于验证窄屏和文字放大的长商品说明。'.repeat(12))
  await page.locator('.milkdown .ProseMirror').fill('完整保留商品详情草稿')
  await page.getByRole('textbox', { name: '封面', exact: true }).fill('/fixture-cover.svg')
  await page.locator('#product-price input').fill('100')
  await page.locator('#product-name input').focus()
}

test('form scene preserves geometry, keyboard, draft guard and save failure recovery', async ({ page }, testInfo) => {
  test.setTimeout(120_000)
  const state = await fixture(page)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('requestfailed', request => { if (request.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(`${request.method()} ${new URL(request.url()).pathname}: ${request.failure()?.errorText}`) })
  await page.goto(`${origin}/manage/products/new`)
  await expect(page.locator('.ls-form-page')).toBeVisible()
  await expect(page.locator('main form')).toHaveCount(1)
  await expect(page.locator('.team-scene')).toHaveCount(1)
  await expect(page.locator('.ls-theme-aurora')).toHaveCount(1)
  await expect(page.locator('main h1')).toHaveText('新建商品')
  const geometry: unknown[] = []
  for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    const metrics = await page.evaluate(() => {
      const main = document.querySelector('main')!
      const template = document.querySelector('.ls-form-page')!
      const header = template.firstElementChild!
      const body = template.children[1]
      const panels = Array.from(main.querySelectorAll('.ls-panel')).map(panel => {
        const style = getComputedStyle(panel)
        return { background: style.backgroundColor, material: style.backgroundImage, elevation: style.boxShadow, text: style.color }
      })
      return { width: innerWidth, scroll: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth, mainWidth: main.getBoundingClientRect().width, maxWidth: getComputedStyle(main).maxWidth, gap: body.getBoundingClientRect().top - header.getBoundingClientRect().bottom, panels }
    })
    expect(metrics.scroll).toBeLessThanOrEqual(metrics.viewport)
    expect(metrics.mainWidth).toBeLessThanOrEqual(672)
    expect(metrics.gap).toBe(24)
    expect(metrics.panels.length).toBeGreaterThan(1)
    for (const panel of metrics.panels) {
      expect(panel.background).toBe('rgba(0, 0, 0, 0)')
      expect(panel.material).toContain('linear-gradient')
      expect(panel.material).toContain('0.52')
      expect(panel.material).toContain('0.42')
      expect(panel.elevation).not.toBe('none')
      expect(panel.text).toBe('rgb(237, 243, 243)')
    }
    geometry.push(metrics)
    if (width === 375 || width === 1440) await page.screenshot({ path: testInfo.outputPath(`form-${width}.png`), fullPage: true })
  }
  await page.setViewportSize({ width: 320, height: 900 })
  await page.evaluate(() => {
    const sizes = Array.from(document.querySelectorAll<HTMLElement>('html, body, body *'))
      .filter(element => element instanceof HTMLElement)
      .map(element => ({ element, size: Number.parseFloat(getComputedStyle(element).fontSize) }))
    for (const { element, size } of sizes) element.style.fontSize = `${size * 2}px`
  })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  await page.getByRole('link', { name: '返回商品', exact: true }).focus()
  await expect(page.getByRole('link', { name: '返回商品', exact: true })).toBeFocused()
  await fillProduct(page)
  page.once('dialog', dialog => dialog.dismiss())
  await page.getByRole('link', { name: '返回商品', exact: true }).click()
  await expect(page).toHaveURL(/\/manage\/products\/new$/)
  await expect(page.locator('#product-name input')).toHaveValue('青空商品草稿')
  await page.locator('#product-price input').fill('')
  await page.locator('#product-name input').focus()
  await expect(page.getByRole('button', { name: '保存商品', exact: true })).toBeDisabled()
  await page.locator('#product-price input').fill('100')
  await page.locator('#product-name input').focus()
  state.failSave = true
  await page.getByRole('button', { name: '保存商品', exact: true }).click()
  await expect(page.locator('main').getByRole('alert')).toContainText('商品保存失败')
  await expect(page.locator('#product-name input')).toHaveValue('青空商品草稿')
  state.failSave = false
  await page.getByRole('button', { name: '保存商品', exact: true }).click()
  await expect(page).toHaveURL(/\/manage\/products\/7$/)
  expect(state.writes).toHaveLength(2)
  expect(state.writes[1]).toMatchObject({ name: '青空商品草稿', price: 100, handler_cut: 80, sender_cut: 15, cs_cut: 0, team_cut: 5 })
  expect(state.writes[1].description).toBe('用于验证窄屏和文字放大的长商品说明。'.repeat(12))
  expect(state.writes[1].introduction_markdown).toContain('完整保留商品详情草稿')
  expect(state.optionsReads).toBeGreaterThan(1)
  await expect(page.locator('.team-scene')).toHaveCount(1)
  await expect(page.locator('.ls-theme-aurora')).toHaveCount(1)
  expect(errors).toEqual([])
  await testInfo.attach('geometry', { body: JSON.stringify(geometry, null, 2), contentType: 'application/json' })
})

test('form scene preserves loading, empty candidates and recoverable options error', async ({ page }) => {
  const state = await fixture(page)
  state.holdOptions = true
  await page.goto(`${origin}/manage/products/new`)
  await expect(page.locator('.ls-form-page')).toBeVisible()
  await expect(page.getByRole('button', { name: '保存商品', exact: true })).toBeDisabled()
  state.failOptions = true
  state.holdOptions = false
  await expect(page.locator('main').getByRole('alert')).toContainText('商品候选读取失败')
  await expect(page.locator('#product-name input')).toBeVisible()
  state.failOptions = false
  await page.reload()
  await expect(page.locator('#product-owner')).toBeVisible()
  await page.locator('#product-owner').click()
  await expect(page.getByText('无数据', { exact: true })).toBeVisible()
})

test('form scene keeps permission explanation and prevents writes', async ({ page }) => {
  const state = await fixture(page, [])
  await page.goto(`${origin}/manage/products/new`)
  await expect(page.locator('.ls-form-page')).toBeVisible()
  const save = page.getByRole('button', { name: '保存商品', exact: true })
  await expect(save).toHaveAttribute('aria-disabled', 'true')
  // Wait for the route's initial denial toast before exercising the action feedback.
  await expect(page.locator('.n-message')).toHaveCount(0)
  await save.focus()
  await save.press('Enter')
  await expect(page.locator('.n-message')).toBeVisible()
  expect(state.writes).toHaveLength(0)
  expect(state.optionsReads).toBe(0)
})

test('form scene includes internal creation and editing but excludes public storefront', async ({ page }) => {
  await fixture(page)
  await page.goto(`${origin}/manage/products/new`)
  await expect(page.locator('.ls-theme-aurora')).toHaveCount(1)
  // Native history navigation exercises the same live provider without reloading the document.
  await page.evaluate(() => {
    document.documentElement.dataset.pilotDocument = 'same-document'
    history.pushState({}, '', '/')
    dispatchEvent(new PopStateEvent('popstate'))
  })
  await expect(page.locator('.shop-app')).toBeVisible()
  await expect(page.locator('.ls-theme-aurora')).toHaveCount(0)
  await expect(page.locator('html')).toHaveAttribute('data-pilot-document', 'same-document')
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark')
  for (const path of ['/manage/personal/products/new', '/manage/personal/products/7', '/manage/products/7']) {
    await page.goto(`${origin}${path}`)
    await expect(page.locator('.ls-form-page')).toHaveCount(1)
    await expect(page.locator('.team-scene')).toHaveCount(1)
    await expect(page.locator('.ls-theme-aurora')).toHaveCount(1)
  }
  await page.goto(`${origin}/`)
  await expect(page.locator('.shop-app')).toBeVisible()
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark')
})
