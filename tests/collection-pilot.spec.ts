import { expect, test, type Page } from './fixtures'

const origin = process.env.TEAM_TEST_ORIGIN ?? 'http://demo.team.lostsky.work:5175'
test.describe.configure({ timeout: 90_000 })
const longTitle = '团队知识文档与跨岗位协作交接说明'.repeat(6)
const documents = Array.from({ length: 12 }, (_, index) => ({ id: index + 1, title: index ? `团队文档 ${index + 1}` : longTitle, content: '请核对文档中的协作流程和服务说明。'.repeat(16), visibility: index % 2 ? 4 : 5, update_time: 1780000000, entity_id: 1 }))

async function fixture(page: Page, options: { state?: 'empty' | 'error' | 'loading' | 'denied'; ability?: boolean } = {}) {
  const requests: URL[] = []
  const deletions: unknown[] = []
  let removed = false
  let releaseLoading: (() => void) | undefined
  const ready = new Promise<void>(resolve => { releaseLoading = resolve })
  await page.context().addCookies([{ name: 'lostsky_token', value: `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: 'team', id: 1 } })).toString('base64url')}.x`, domain: '.lostsky.work', path: '/' }])
  await page.route(`${origin}/api/**`, async route => {
    const url = new URL(route.request().url())
    const path = url.pathname
    const fulfill = (data: unknown) => route.fulfill({ json: { code: 0, data } })
    if (path.endsWith('/access')) return fulfill({ permissions: ['team'], abilities: { doc: { enabled: options.ability !== false, label: '文档' } }, identity: { type: 'team', entity_id: 1 } })
    if (path.endsWith('/doc/delete')) { deletions.push(route.request().postDataJSON()); removed = true; return fulfill({}) }
    if (path.endsWith('/doc/get')) return fulfill(documents[0])
    if (path.endsWith('/entity/options')) return fulfill([{ entity_id: 1, type: 'team', slug: 'demo', name: '示例团队' }])
    if (path.endsWith('/doc')) {
      requests.push(url)
      if (options.state === 'loading') await ready
      if (options.state === 'error') return route.fulfill({ status: 500, json: { code: 50000, message: '服务暂时不可用' } })
      if (options.state === 'denied') return route.fulfill({ status: 403, json: { code: 40301, message: '缺少文档读取权限', data: { kind: 'permission', required_any: ['team.doc.read'] } } })
      if (options.state === 'empty') return fulfill({ list: [], total: 0 })
      const pageNumber = Number(url.searchParams.get('page') || 1)
      const keyword = url.searchParams.get('keyword') || ''
      const visibility = url.searchParams.get('visibility')
      const list = documents.filter(item => (!removed || item.id !== 1) && (!keyword || item.title.includes(keyword)) && (!visibility || item.visibility === Number(visibility)))
      return fulfill({ list: pageNumber > 1 ? [{ ...documents[1], id: 99, title: '第二页文档' }] : list, total: keyword || visibility ? list.length : 132 })
    }
    await route.fallback()
  })
  return { requests, deletions, release: () => releaseLoading?.() }
}

test('collection pilot keeps search, filtering, pagination, details and mutations', async ({ page }) => {
  const { requests, deletions } = await fixture(page)
  await page.goto(`${origin}/docs?entity_id=7`)
  const list = page.getByRole('list', { name: '文档列表' })
  await expect(list.locator('.ls-resource-row')).toHaveCount(12)
  await expect(page.locator('a[href="/doc-create?entity_id=7"]')).toBeVisible()
  expect(requests[0].searchParams.get('entity_id')).toBe('7')
  await page.locator('.n-pagination-item').filter({ hasText: /^2$/ }).click()
  await expect(list).toContainText('第二页文档')
  await page.getByRole('searchbox', { name: '搜索文档' }).fill('团队文档 2')
  await expect(list.locator('.ls-resource-row')).toHaveCount(1)
  expect(requests.at(-1)!.searchParams.get('page')).toBe('1')
  await page.getByRole('searchbox', { name: '搜索文档' }).fill('')
  await page.locator('.ls-list-toolbar .n-select').click()
  await page.locator('.n-base-select-option').filter({ hasText: /^公开文档$/ }).click()
  await expect(list.locator('.ls-resource-row')).toHaveCount(6)
  expect(requests.at(-1)!.searchParams.get('visibility')).toBe('5')
  const first = list.locator('.ls-resource-row').first()
  await first.locator('a[href="/doc?id=1"]').click()
  await expect(page).toHaveURL(/\/doc\?id=1$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('文档')
  await expect(page.getByRole('heading', { level: 2, name: longTitle, exact: true })).toBeVisible()
  await expect(page.locator('.team-aurora-backdrop')).toHaveCount(1)
  await expect(page.locator('.ls-theme-aurora')).toHaveCount(1)
  await page.goBack()
  await expect(page.locator('.team-aurora-backdrop')).toHaveCount(1)
  const row = page.locator('.ls-resource-row').first()
  await row.getByRole('link', { name: '编辑', exact: true }).click()
  await expect(page).toHaveURL(/\/doc-edit\?id=1$/)
  await expect(page.locator('.ls-theme-aurora')).toHaveCount(1)
  await page.goBack()
  const deleteRow = page.locator('.ls-resource-row').first()
  if (await deleteRow.getByRole('button', { name: '更多', exact: true }).isVisible()) await deleteRow.getByRole('button', { name: '更多', exact: true }).click()
  page.once('dialog', dialog => dialog.accept())
  const deleteButton = deleteRow.getByRole('button', { name: '删除', exact: true })
  if (await deleteButton.isVisible()) await deleteButton.click()
  else await page.getByRole('menuitem', { name: '删除', exact: true }).click()
  await expect.poll(() => deletions).toEqual([{ id: 1 }])
  await expect(page.locator('.ls-resource-row').first()).not.toContainText(longTitle)
})

test('collection pilot distinguishes loading, empty and failed reads', async ({ page }) => {
  const loading = await fixture(page, { state: 'loading' })
  await page.goto(`${origin}/docs`)
  await expect(page.locator('.ls-async-state')).toBeVisible()
  await expect(page.getByRole('searchbox')).toBeVisible()
  loading.release()
  await expect(page.locator('.ls-resource-row')).toHaveCount(12)
  await page.unroute(`${origin}/api/**`)
  await fixture(page, { state: 'empty' })
  await page.reload()
  await expect(page.getByRole('status')).toContainText('文档库还是空的')
  await page.getByRole('searchbox').fill('不存在')
  await expect(page.getByRole('status')).toContainText('没有匹配的文档')
  await page.unroute(`${origin}/api/**`)
  await fixture(page, { state: 'error' })
  await page.reload()
  await expect(page.locator('.ls-async-state[role="alert"]')).toContainText('暂时无法读取文档')
  await expect(page.locator('.ls-empty-state')).toHaveCount(0)
  await expect(page.getByRole('searchbox')).toBeVisible()
})

test('collection pilot preserves ability and permission restricted states', async ({ page }) => {
  const blocked = await fixture(page, { ability: false })
  await page.goto(`${origin}/docs`)
  await expect(page.locator('.ls-empty-state')).toContainText('无法读取数据')
  expect(blocked.requests).toHaveLength(0)
  await expect(page.locator('a[href="/doc-create"]')).toBeVisible()
  await page.unroute(`${origin}/api/**`)
  const denied = await fixture(page, { state: 'denied' })
  await page.reload()
  await expect(page.locator('.ls-empty-state')).toContainText('无法读取数据')
  expect(denied.requests).toHaveLength(1)
  await expect(page.locator('.ls-resource-row')).toHaveCount(0)
})

test('collection pilot has one wide scene, readable geometry and keyboard controls across widths', async ({ page }) => {
  test.setTimeout(120_000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await fixture(page)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(`${origin}/docs`)
  await expect(page.locator('.ls-resource-row')).toHaveCount(12)
  await expect(page.locator('.team-aurora-backdrop')).toHaveCount(1)
  await expect(page.locator('.team-aurora-backdrop canvas.ready')).toBeVisible()
  const pause = page.getByRole('button', { name: '暂停极光' })
  await pause.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: '播放极光' })).toHaveAttribute('aria-pressed', 'true')
  const geometry: unknown[] = []
  for (const font of [16, 32]) for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1080 })
    await page.evaluate(value => { document.documentElement.style.fontSize = `${value}px` }, font)
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
    const result = await page.evaluate(() => {
      const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect().toJSON()
      const page = box('#workspace .ls-page')
      const header = box('.ls-page-header')
      const toolbar = box('.ls-list-toolbar')
      const list = box('.ls-resource-list')
      const pager = box('.n-pagination')
      const firstTitle = box('.ls-resource-row__heading h2')
      const firstLink = box('.ls-resource-row__main')
      const material = getComputedStyle(document.querySelector('.ls-resource-list')!).backgroundImage
      const content = document.querySelector('.ls-collection-page')!
      return { page, header, toolbar, list, pager, firstTitle, firstLink, material, gap: parseFloat(getComputedStyle(content).rowGap), scroll: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth, headerLayer: getComputedStyle(document.querySelector('.ls-workspace-header')!).zIndex }
    })
    expect(result.scroll, `${font}px/${width}px page overflow`).toBeLessThanOrEqual(result.viewport)
    expect(result.toolbar.y - result.header.bottom).toBeCloseTo(font * 1.5, 0)
    expect(result.list.y - result.toolbar.bottom).toBeCloseTo(font * 1.5, 0)
    expect(result.pager.width, `${font}px/${width}px pagination overflow`).toBeLessThanOrEqual(result.page.width)
    expect(result.material).toContain('linear-gradient')
    expect(result.firstTitle.right).toBeLessThanOrEqual(result.firstLink.right + 1)
    expect(result.firstTitle.height).toBeGreaterThan(0)
    expect(result.headerLayer).toBe('1')
    if (font === 16 && width === 1920) expect(result.page.width).toBe(1440)
    geometry.push({ font, width, ...result })
    if (font === 16 && [375, 1440].includes(width)) await page.screenshot({ path: test.info().outputPath(`collection-${width}.png`), fullPage: true })
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.getByRole('button', { name: '播放极光' })).toBeHidden()
  expect(errors).toEqual([])
  await test.info().attach('collection-geometry.json', { body: JSON.stringify(geometry, null, 2), contentType: 'application/json' })
})
