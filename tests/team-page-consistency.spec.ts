import { expect, test } from './fixtures'

const origin = process.env.TEAM_TEST_ORIGIN ?? 'http://demo.team.lostsky.work:5175'
const paths = ['/entities', '/customers', '/chat-groups', '/communities', '/docs', '/files', '/notices/sent', '/settings', '/audit']
const name = '用于验证名称换行与操作区域互不遮挡的团队资料'

test('team setting radio keyboard selection preserves a dirty draft and saves one group', async ({ page }) => {
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/' }])
  const writes: unknown[] = []
  let saved = 'team'
  await page.route(`${origin}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '')
    let data: unknown
    if (path === '/access') data = { team: { id: 1, slug: 'demo', name: '团队' }, permissions: ['team'], abilities: {}, identity: { type: 'team', entity_id: 1 } }
    else if (path === '/setting/schema') data = { apps: [{ app_name: 'entity', label: '人员', description: '查找规则', settings: [{ key: 'priority', label: '搜索优先级', description: '选择团队与成员设置冲突时的处理方式。', type: 'enum', control: 'radio', value: saved, default: 'team', options: [{ value: 'team', label: '团队优先', description: '遵循团队查找规则。' }, { value: 'member', label: '成员优先', description: '成员自己的查找设置可以覆盖默认规则。'.repeat(8) }] }] }] }
    else if (path === '/setting') { const body = route.request().postDataJSON(); writes.push(body); saved = body.settings.priority; data = {} }
    else throw new Error(`未声明请求 ${path}`)
    await route.fulfill({ json: { code: 0, data } })
  })
  await page.goto(`${origin}/settings`)
  const first = page.getByRole('radio', { name: /团队优先/ })
  const second = page.getByRole('radio', { name: /成员优先/ })
  const save = page.locator('form').getByRole('button')
  await expect(save).toBeDisabled()
  await first.focus()
  await page.keyboard.press('ArrowRight')
  await expect(second).toBeChecked()
  await expect(second).toBeFocused()
  await expect(save).toBeEnabled()
  for (const width of [1440, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    const boxes = await page.getByRole('radio').evaluateAll(nodes => nodes.map(node => { const r = node.closest('label')!.getBoundingClientRect(); return { x: r.x, right: r.right, y: r.y, bottom: r.bottom, width: r.width, height: r.height } }))
    expect(boxes.every(box => box.height >= 64)).toBe(true)
    expect(boxes[1].x >= boxes[0].right || boxes[1].y >= boxes[0].bottom).toBe(true)
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  await page.evaluate(() => { document.documentElement.style.fontSize = '' })
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(second).toBeChecked()
  await save.click()
  await expect.poll(() => writes).toEqual([{ app_name: 'entity', settings: { priority: 'member' } }])
  await expect(save).toBeDisabled()
})

test('team management pages share page geometry and resource row hierarchy across widths and text zoom', async ({ page }) => {
  test.setTimeout(150_000)
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/' }])
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route(`${origin}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '')
    const data: Record<string, unknown> = {
      '/access': { team: { id: 1, slug: 'demo', name: '团队' }, permissions: ['team', 'community.team.read', 'chat.group.manage', 'file.read', 'file.upload', 'file.delete'], abilities: {}, identity: { type: 'team', entity_id: 1 } },
      '/entity/index': { list: [{ id: 2, entityable_id: 2, entityable_type: 'teamMember', slug: 'member-with-a-long-stable-identifier'.repeat(4), profile: { name: name.repeat(4) } }] },
      '/customer': { total: 1, list: [{ id: 2, name, slug: 'customer', create_time: 1791500000, is_blocked: false, balance: { balance: '0' } }] },
      '/customer/assignees': [],
      '/chatGroup/index': [{ uuid: 'group', title: name, participants: [1, 2], is_closed: false }],
      '/communities': { total: 1, list: [{ id: 1, name, slug: 'community', description: '一起分享团队经验。', status: 'Active' }] },
      '/doc': { total: 1, list: [{ id: 1, title: name.repeat(3), content: '团队工作资料摘要。'.repeat(8), visibility: 5, update_time: 1791500000 }] },
      '/file/usage': { count: 1, total_size: 1024, size_limit: 134217728, available: true },
      '/file/index': { total: 1, list: [{ id: 1, name: `${name}.png`, mime_type: 'image/png', size: 1024, url: 'https://example.com/file.png', create_time: 1791500000 }] },
      '/notice/index': { total: 1, list: [{ id: 1, entity_id: 2, title: name, content: '请查看工作安排。', is_read: 0, create_time: 1791500000 }] },
      '/setting/schema': { apps: [{ app_name: 'entity', label: '人员', description: '人员查找设置', settings: [{ key: 'team_searchable', label: '允许查找团队', description: '允许通过标识找到当前团队。', type: 'boolean', control: 'switch', value: false, default: false }] }] },
      '/audit/catalog': { applications: [], actions: [], resource_types: [] },
      '/audit/index': { total: 1, list: [{ id: 1, application_label: '团队', resource_label: '文档', action_label: '更新', actor: { authenticated_user_id: 1, username: '成员' }, create_time: 1791500000, request_id: 'request-one' }] },
    }
    expect(Object.keys(data), '每个请求必须具有明确夹具').toContain(path)
    await route.fulfill({ json: { code: 0, data: data[path] } })
  })

  const frames = new Map<number, { x: number; width: number }>()
  for (const path of paths) {
    await page.goto(`${origin}${path}`)
    const header = page.locator('#workspace .ls-page-header')
    await expect(header).toHaveCount(1)
    await expect(page.locator('#workspace .ls-resource-list, #workspace .ls-responsive-data-table, #workspace .settings-panel')).toBeVisible()
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      const frame = await header.boundingBox()
      expect(frame).not.toBeNull()
      if (path !== '/settings' && frames.has(width)) {
        expect(frame!.x, `${path} header left at ${width}`).toBeCloseTo(frames.get(width)!.x, 0)
        expect(frame!.width, `${path} header width at ${width}`).toBeCloseTo(frames.get(width)!.width, 0)
      } else if (path !== '/settings') frames.set(width, { x: frame!.x, width: frame!.width })
      const toolbar = page.locator('#workspace .ls-list-toolbar')
      if (await toolbar.count()) {
        const bounds = await toolbar.boundingBox()
        expect(bounds!.x).toBeCloseTo(frame!.x, 0)
        expect(bounds!.width).toBeCloseTo(frame!.width, 0)
        for (const select of await toolbar.locator('.n-select').all()) {
          const control = await select.boundingBox()
          expect(control!.width, `${path} filter collapsed at ${width}`).toBeGreaterThan(0)
          expect(control!.x).toBeGreaterThanOrEqual(bounds!.x)
          expect(control!.x + control!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width)
          if (width >= 640) expect(control!.width).toBeCloseTo(160, 0)
        }
      }
      const list = page.locator('#workspace .ls-resource-list')
      if (await list.count()) {
        const bounds = await list.boundingBox()
        expect(bounds!.x).toBeCloseTo(frame!.x, 0)
        expect(bounds!.width).toBeCloseTo(frame!.width, 0)
        const row = list.locator('.ls-resource-row').first()
        const metrics = await row.evaluate(node => {
          const style = getComputedStyle(node)
          const main = node.querySelector('.ls-resource-row__main')!.getBoundingClientRect()
          const action = node.querySelector('.ls-resource-row__actions')?.getBoundingClientRect()
          const box = node.getBoundingClientRect()
          const title = node.querySelector('h2')
          return { padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft], mainRight: main.right, right: box.right, titleFont: title ? getComputedStyle(title).fontSize : null, separate: !action || action.left >= main.right - 1 || action.top >= main.bottom - 1 }
        })
        expect(metrics.padding, `${path} actual row padding`).toEqual(['16px', '16px', '16px', '16px'])
        expect(metrics.mainRight).toBeLessThanOrEqual(metrics.right - 15)
        expect(metrics.separate, `${path} content overlaps actions`).toBe(true)
        if (metrics.titleFont) expect(metrics.titleFont).toBe('16px')
        for (const button of await row.getByRole('button').all()) {
          if (await button.isVisible()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(width < 640 ? 44 : 40)
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${path} overflows at ${width}`).toBe(true)
    }
    await page.setViewportSize({ width: 320, height: 1000 })
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${path} 200% overflow`).toBe(true)
    for (const row of await page.locator('.ls-resource-row').all()) {
      expect(await row.evaluate(node => node.scrollWidth <= node.clientWidth), `${path} 200% row overflow`).toBe(true)
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = '' })
  }
  await page.goto(`${origin}/chat-groups`)
  const group = page.locator('.ls-resource-list').getByRole('link')
  await group.focus()
  await expect(group).toBeFocused()
  expect((await group.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  await expect(group).toHaveAttribute('href', '/chat-groups/group')
  expect(errors).toEqual([])
})

test('resource list loading error empty and read-only states preserve the page frame', async ({ page }) => {
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/' }])
  let state: 'loading' | 'error' | 'empty' | 'restricted' = 'loading'
  let unblock: () => void = () => {}
  await page.route(`${origin}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/access')) return route.fulfill({ json: { code: 0, data: { permissions: state === 'restricted' ? [] : ['team'], abilities: {} } } })
    if (state === 'loading') await new Promise<void>(resolve => { unblock = resolve })
    await route.fulfill({ status: state === 'error' ? 500 : 200, json: state === 'error' ? { code: 500, message: '读取失败' } : { code: 0, data: { list: [], total: 0 } } })
  })
  await page.goto(`${origin}/docs`)
  await expect(page.locator('.ls-async-state')).toBeVisible()
  const frame = await page.locator('.ls-page-header').boundingBox()
  state = 'empty'; unblock()
  await expect(page.locator('.ls-empty-state')).toBeVisible()
  for (const next of ['error', 'restricted'] as const) {
    state = next
    await page.reload()
    await expect(page.locator(next === 'error' ? '.ls-async-state' : '.ls-empty-state')).toBeVisible()
    const bounds = await page.locator('.ls-page-header').boundingBox()
    expect(bounds!.x).toBe(frame!.x)
    expect(bounds!.width).toBe(frame!.width)
  }
  await expect(page.locator('.ls-resource-list')).toHaveCount(0)
})
