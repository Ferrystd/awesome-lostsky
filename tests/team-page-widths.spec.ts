import { expect, test } from './fixtures'

const origin = process.env.TEAM_TEST_ORIGIN ?? 'http://demo.team.lostsky.work:5175'

test('every Team workspace route declares and renders its standard page width', async ({ page }) => {
  test.setTimeout(180_000)
  await page.context().addCookies([{ name: 'lostsky_token', value: `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: 'team', id: 1 } })).toString('base64url')}.x`, domain: '.lostsky.work', path: '/' }])
  await page.route(`${origin}/api/**`, route => route.fulfill({ json: { code: 0, data: { permissions: [], abilities: {}, identity: { type: 'team', entity_id: 1 }, list: [], total: 0 } } }))
  await page.goto(`${origin}/settings`)
  const routes = await page.evaluate(async () => {
    const { router } = await import(/* @vite-ignore */ '/src/router.ts')
    return router.getRoutes().filter((route: any) => !route.redirect && !route.meta.public).map((route: any) => ({ path: route.path, width: route.meta.pageWidth }))
  })
  expect(routes.length).toBeGreaterThan(45)
  const evidence: unknown[] = []
  await page.setViewportSize({ width: 1920, height: 1080 })
  for (const route of routes) {
    expect(['form', 'content', 'wide'], route.path).toContain(route.width)
    const path = route.path.replace(/:id\([^)]*\)/g, '1').replace(':uuid', 'group')
    await page.evaluate(async (path) => { const { router } = await import(/* @vite-ignore */ '/src/router.ts'); await router.push(path) }, path)
    const frame = page.locator('#workspace .ls-page').first()
    await expect(frame).toHaveClass(new RegExp(`ls-page--${route.width}`))
    const box = await frame.boundingBox()
    const expected = { form: 672, content: 1024, wide: 1440 }[route.width as 'form' | 'content' | 'wide']
    expect(box!.width, route.path).toBeCloseTo(expected, 0)
    evidence.push({ route: route.path, standard: route.width, width: box!.width, x: box!.x })
  }
  await test.info().attach('team-route-widths.json', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' })
})

test('Team settings keeps compact fields and one group footer action across widths and text zoom', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.context().addCookies([{ name: 'lostsky_token', value: `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: 'team', id: 1 } })).toString('base64url')}.x`, domain: '.lostsky.work', path: '/' }])
  await page.route(`${origin}/api/**`, route => route.fulfill({ json: { code: 0, data: route.request().url().endsWith('/access')
    ? { permissions: ['team'], abilities: {}, identity: { type: 'team', entity_id: 1 } }
    : { apps: [{ app_name: 'entity', label: '人员查找与团队访问规则的完整业务分类名称', description: '管理人员查找规则。', settings: [
      { key: 'searchable', label: '允许查找团队', description: '允许通过标识找到当前团队。', type: 'boolean', control: 'switch', value: false, default: false },
      { key: 'default_expire_days', label: '默认权益有效天数', description: '新建权益项默认的有效期；0 表示永久有效。', type: 'integer', control: 'number', value: 30, default: 30, min: 0, max: 3650 },
      { key: 'welcome_text', label: '主页欢迎语', description: '向访问团队主页的人员展示欢迎说明。'.repeat(8), type: 'string', control: 'input', value: '欢迎了解团队的服务与工作方式。'.repeat(10), default: '', max_length: 200 },
      { key: 'priority', label: '查找设置优先级', description: '选择团队与成员设置冲突时的处理方式。'.repeat(4), type: 'enum', control: 'radio', value: 'team', default: 'team', options: [{ value: 'team', label: '团队优先', description: '遵循团队查找规则。'.repeat(5) }, { value: 'member', label: '成员优先', description: '成员自己的查找设置可以覆盖默认规则。'.repeat(8) }] },
    ] }] } } }))
  await page.goto(`${origin}/settings`)
  const panel = page.locator('.settings-panel')
  await expect(panel).toBeVisible()
  for (const fontSize of ['16px', '32px']) for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1200 })
    await page.evaluate(size => { document.documentElement.style.fontSize = size }, fontSize)
    // Let responsive media/container queries commit before comparing separate geometry reads.
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
    const header = await page.locator('.team-category-layout__content').boundingBox()
    const center = (await page.locator('.team-category-layout').boundingBox())!
    const pageHeader = (await page.locator('.ls-page-header').boundingBox())!
    expect(center.x).toBeCloseTo(pageHeader.x, 0)
    expect(center.width).toBeCloseTo(pageHeader.width, 0)
    if (fontSize === '16px' && width === 1920) expect(center.width).toBe(1024)
    const availableWidth = await page.locator('.team-category-layout').evaluate(element => element.clientWidth - parseFloat(getComputedStyle(element).paddingLeft) - parseFloat(getComputedStyle(element).paddingRight))
    const desktop = availableWidth >= 48 * parseInt(fontSize)
    await expect(page.locator('.team-category-navigation__desktop')).toBeVisible({ visible: desktop })
    await expect(page.locator('.team-category-navigation__mobile')).toBeVisible({ visible: !desktop })
    const box = await panel.boundingBox()
    expect(box!.x).toBeCloseTo(header!.x, 0)
    expect(box!.width).toBeCloseTo(header!.width, 0)
    const save = panel.locator('button[type=submit]')
    await expect(save).toHaveCount(1)
    const action = await save.boundingBox()
    const lastField = await panel.locator('.setting-row').last().boundingBox()
    expect(action!.y).toBeGreaterThanOrEqual(lastField!.y + lastField!.height)
    expect(action!.height).toBeGreaterThanOrEqual(44)
    expect(action!.x + action!.width).toBeLessThanOrEqual(box!.x + box!.width)
    const caption = (await save.locator('.settings-save-label').boundingBox())!
    expect(caption.width).toBeLessThanOrEqual(action!.width)
    expect(caption.y + caption.height).toBeLessThanOrEqual(action!.y + action!.height + 1)
    expect(Math.round((await panel.getByRole('switch').boundingBox())!.height)).toBeGreaterThanOrEqual(44)
    for (const field of await panel.locator('.setting-control').all()) {
      const bounds = (await field.boundingBox())!
      expect(bounds.x).toBeGreaterThanOrEqual(box!.x)
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(box!.x + box!.width)
    }
    if (fontSize === '16px' && width >= 1024) expect((await panel.locator('.setting-row--switch').boundingBox())!.height).toBeLessThan(96)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `settings overflow at ${width}px/${fontSize}`).toBe(true)
  }
})

test('Team virtual creation and populated customer detail use the intended form and content boundaries', async ({ page }) => {
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/' }])
  await page.route(`${origin}/api/**`, route => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/access') ? { permissions: ['team'], abilities: {} }
      : path.endsWith('/customer/assignees') ? []
      : { id: 518, slug: 'customer-518', name: '用于核对内容边界的顾客名称', avatar: null, description: '顾客资料说明。'.repeat(20), is_blocked: false, create_time: 1, balance: { balance: '123.00', recharged: '456.00', spent: '333.00' }, assignee: null, senders: [], summary: { transaction_count: 5, transaction_total: '456.00', order_count: 3, order_total: '333.00' }, can_manage: true }
    return route.fulfill({ json: { code: 0, data } })
  })
  for (const path of ['/chat-virtual-new', '/customers/518']) {
    await page.goto(`${origin}${path}`)
    const form = page.locator('#workspace form')
    await expect(form).toBeVisible()
    for (const fontSize of ['16px', '32px']) for (const width of [320, 768, 1024, 1920]) {
      await page.setViewportSize({ width, height: 1200 })
      await page.evaluate(size => { document.documentElement.style.fontSize = size }, fontSize)
    // Let responsive media/container queries commit before comparing separate geometry reads.
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
      const frame = (await page.locator('#workspace .ls-page').boundingBox())!
      const header = (await page.locator('#workspace .ls-page-header').boundingBox())!
      expect(header.x).toBeCloseTo(frame.x, 0)
      expect(header.width).toBeCloseTo(frame.width, 0)
      for (const panel of await page.locator('#workspace .ls-panel').all()) {
        const box = (await panel.boundingBox())!
        expect(box.x).toBeCloseTo(frame.x, 0)
        expect(box.width).toBeCloseTo(frame.width, 0)
      }
      const formBox = (await form.boundingBox())!
      for (const control of await form.locator('.ls-field, button[type=submit]').all()) {
        const box = (await control.boundingBox())!
        expect(box.x + box.width).toBeLessThanOrEqual(formBox.x + formBox.width + .1)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    }
  }
})

test('shared form actions keep both cancel and submit inside a narrow form at enlarged text', async ({ page }) => {
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/' }])
  await page.route(`${origin}/api/**`, route => route.fulfill({ json: { code: 0, data: { permissions: ['team'], abilities: {} } } }))
  await page.goto(`${origin}/roles/new`)
  const actions = page.locator('.ls-form-actions')
  await expect(actions.getByRole('button')).toHaveCount(2)
  for (const fontSize of ['16px', '32px']) for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.evaluate(size => { document.documentElement.style.fontSize = size }, fontSize)
    // Let responsive media/container queries commit before comparing separate geometry reads.
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
    const box = (await actions.boundingBox())!
    for (const button of await actions.getByRole('button').all()) {
      const control = (await button.boundingBox())!
      expect(control.x).toBeGreaterThanOrEqual(box.x)
      expect(control.x + control.width).toBeLessThanOrEqual(box.x + box.width + .1)
      expect(control.height).toBeGreaterThanOrEqual(44)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  }
})
