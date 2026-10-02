import { expect, test, type Page } from '@playwright/test'

const origin = 'http://demo.weibo.lostsky.work:5181'

for (const workspace of ['personal', 'team']) test(`preset ${workspace} denied list opens creation but blocks protected saves`, async ({ page }) => {
  const requests = await setup(page, { restricted: true })
  const path = `${workspace === 'personal' ? '/personal' : ''}/interactions/comment-presets`
  await page.goto(`${origin}${path}`)
  await expect(page.locator('.ls-empty-state')).toContainText('无法读取数据')
  await expect(page.locator('.ls-empty-state')).toContainText('Permission')
  await expect(page.locator('.ls-form-list')).toHaveCount(0)
  await expect(page.locator('.n-message')).toHaveCount(1)
  await expect(page.getByRole('button', { name: '保存预设评论' })).toHaveCount(0)
  const add = page.getByRole('link', { name: '添加预设', exact: true })
  await expect(add).toHaveAttribute('href', `${path}/new`)
  await expect(add).not.toHaveAttribute('aria-disabled', 'true')
  await add.focus()
  await add.press('Enter')
  await expect(page).toHaveURL(`${origin}${path}/new`)
  await expect(page.locator('#preset-0')).toHaveValue('')
  await page.locator('#preset-0').fill('无权限仍可输入草稿')
  const save = page.getByRole('button', { name: '保存预设评论' })
  await expect(save).toHaveAttribute('aria-disabled', 'true')
  await save.click({ force: true })
  await expect(page.locator('.n-message').filter({ hasText: 'Permission' }).first()).toBeVisible()
  await expect(page.locator('#preset-0')).toHaveValue('无权限仍可输入草稿')
  await expect(page).toHaveURL(`${origin}${path}/new`)
  expect(requests.candidates).toBe(0)
  expect(requests.saves).toHaveLength(0)
})

test('preset empty list can add and save then delete all atomically', async ({ page }) => {
  const requests = await setup(page, { presetCount: 0, ability: false })
  await page.goto(`${origin}/personal/interactions/comment-presets`)
  await expect(page.locator('.ls-empty-state')).toContainText('暂无预设评论')
  await page.getByRole('link', { name: '添加预设', exact: true }).click()
  await expect(page).toHaveURL(`${origin}/personal/interactions/comment-presets/new`)
  await page.locator('#preset-0').fill('第一条')
  await page.getByRole('button', { name: '保存预设评论' }).click()
  await expect.poll(() => requests.saves.length).toBe(1)
  await expect(page).toHaveURL(`${origin}/personal/interactions/comment-presets/new`)
  await expect(page.locator('#preset-0')).toHaveValue('第一条')
  await expect(page.getByRole('button', { name: '保存预设评论' })).toHaveAttribute('aria-disabled', 'true')
  await page.getByRole('button', { name: '删除预设 1' }).click()
  await expect(page.getByText('尚未添加预设评论', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '保存预设评论' }).click()
  await expect.poll(() => requests.saves.length).toBe(2)
  expect((requests.saves[1] as { contents: string[] }).contents).toEqual([])
})

for (const workspace of ['personal', 'team']) test(`preset ${workspace} list opens full edit and appends new entries without losing saved content`, async ({ page }) => {
  const requests = await setup(page, { ability: false })
  const path = `${workspace === 'personal' ? '/personal' : ''}/interactions/comment-presets`
  const original = workspace === 'personal' ? '个人常用评论' : '团队常用评论'
  await page.goto(`${origin}${path}`)
  await expect(page.getByText(original, { exact: true })).toBeVisible()
  await expect(page.locator('.ls-form-list, textarea')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '保存预设评论' })).toHaveCount(0)
  await page.getByRole('button', { name: '编辑预设', exact: true }).click()
  await expect(page).toHaveURL(`${origin}${path}/edit`)
  await expect(page.locator('#preset-0')).toHaveValue(original)
  await expect(page.locator('#preset-1')).toHaveCount(0)
  await page.getByRole('link', { name: '返回预设评论', exact: true }).click()
  await expect(page).toHaveURL(`${origin}${path}`)
  await page.getByRole('link', { name: '添加预设', exact: true }).click()
  await expect(page).toHaveURL(`${origin}${path}/new`)
  await expect(page.locator('#preset-0')).toHaveValue(original)
  await expect(page.locator('#preset-1')).toHaveValue('')
  await page.locator('#preset-1').fill('追加的预设评论')
  await page.getByRole('button', { name: '保存预设评论' }).click()
  await expect.poll(() => requests.saves.length).toBe(1)
  expect(requests.saves[0]).toEqual({ contents: [original, '追加的预设评论'], ...(workspace === 'personal' ? { expected_entity_id: 11 } : {}) })
  await expect(page).toHaveURL(`${origin}${path}/new`)
  await expect(page.locator('#preset-0')).toHaveValue(original)
  await expect(page.locator('#preset-1')).toHaveValue('追加的预设评论')
  await expect(page.getByRole('button', { name: '保存预设评论' })).toHaveAttribute('aria-disabled', 'true')
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const form = await page.locator('.ls-form-list').boundingBox()
    for (const selector of ['#preset-0', '#preset-1']) {
      const box = await page.locator(selector).boundingBox()
      expect(box!.x).toBeGreaterThanOrEqual(form!.x - 1)
      expect(box!.x + box!.width).toBeLessThanOrEqual(form!.x + form!.width + 1)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.getByRole('link', { name: '返回预设评论', exact: true }).click()
  await expect(page).toHaveURL(`${origin}${path}`)
  await expect(page.getByText(original, { exact: true })).toBeVisible()
  await expect(page.getByText('追加的预设评论', { exact: true })).toBeVisible()
})

for (const workspace of ['personal', 'team']) test(`preset ${workspace} restricted edit hides values and cannot submit`, async ({ page }) => {
  const requests = await setup(page, { restricted: true })
  const path = `${workspace === 'personal' ? '/personal' : ''}/interactions/comment-presets/edit`
  await page.goto(`${origin}${path}`)
  await expect(page.getByText('-', { exact: true })).toBeVisible()
  await expect(page.locator('textarea')).toHaveCount(0)
  const save = page.getByRole('button', { name: '保存预设评论' })
  await expect(save).toHaveAttribute('aria-disabled', 'true')
  await save.click({ force: true })
  await expect(page.locator('.n-message').filter({ hasText: 'Permission' }).first()).toBeVisible()
  expect(requests.candidates).toBe(0)
  expect(requests.saves).toHaveLength(0)
})

test('preset server denial replaces a successful empty list and preserves creation navigation', async ({ page }) => {
  const requests = await setup(page, { presetCount: 0 })
  await page.goto(`${origin}/personal/interactions/comment-presets`)
  await expect(page.locator('.ls-empty-state')).toContainText('暂无预设评论')
  let deniedReads = 0
  await page.route(`${origin}/api/**/personal/comment-presets`, async route => {
    deniedReads++
    await route.fulfill({ status: 403, json: { code: 40302, message: 'forbidden', data: { kind: 'permission', required_any: ['weibo.personal.use'] } } })
  })
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    window.dispatchEvent(new Event('visibilitychange'))
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    window.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(page.locator('.ls-empty-state')).toContainText('无法读取数据')
  await expect(page.getByRole('link', { name: '添加预设', exact: true })).toHaveAttribute('href', '/personal/interactions/comment-presets/new')
  await expect(page.getByRole('button', { name: '保存预设评论' })).toHaveCount(0)
  expect(requests.saves).toHaveLength(0)
  expect(deniedReads).toBeGreaterThanOrEqual(1)
})

test('preset edit server denial hides saved values and blocks submission despite the access snapshot', async ({ page }) => {
  const requests = await setup(page)
  let deniedReads = 0
  await page.route(`${origin}/api/**/personal/comment-presets`, async route => {
    if (route.request().method() !== 'GET') return route.fallback()
    deniedReads++
    await route.fulfill({ status: 403, json: { code: 40302, message: 'forbidden', data: { kind: 'permission', required_any: ['weibo.personal.use'] } } })
  })
  await page.goto(`${origin}/personal/interactions/comment-presets/edit`)
  await expect(page.getByText('-', { exact: true })).toBeVisible()
  await expect(page.locator('textarea, .ls-form-list')).toHaveCount(0)
  await expect(page.getByText('个人常用评论', { exact: true })).toHaveCount(0)
  const save = page.getByRole('button', { name: '保存预设评论' })
  await expect(save).toHaveAttribute('aria-disabled', 'true')
  await save.click({ force: true })
  await expect(page.locator('.n-message').filter({ hasText: 'Permission' }).first()).toBeVisible()
  expect(deniedReads).toBeGreaterThanOrEqual(1)
  expect(requests.saves).toHaveLength(0)
})

test('preset creation recovers from server denial without losing the new draft or existing presets', async ({ page }) => {
  const requests = await setup(page)
  let denyRead = true
  let recoveredReads = 0
  await page.route(`${origin}/api/**/personal/comment-presets`, async route => {
    if (route.request().method() !== 'GET') return route.fallback()
    if (denyRead) {
      await route.fulfill({ status: 403, json: { code: 40302, message: 'forbidden', data: { kind: 'permission', required_any: ['weibo.personal.use'] } } })
      return
    }
    recoveredReads++
    await route.fallback()
  })
  await page.goto(`${origin}/personal/interactions/comment-presets/new`)
  await expect(page.getByText('-', { exact: true })).toBeVisible()
  await page.locator('#preset-0').fill('读取恢复后保留的新增草稿')
  await expect(page.getByRole('button', { name: '保存预设评论' })).toHaveAttribute('aria-disabled', 'true')
  denyRead = false
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    window.dispatchEvent(new Event('visibilitychange'))
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    window.dispatchEvent(new Event('visibilitychange'))
  })
  await expect.poll(() => recoveredReads).toBeGreaterThan(0)
  await expect(page.locator('#preset-0')).toHaveValue('个人常用评论')
  await expect(page.locator('#preset-1')).toHaveValue('读取恢复后保留的新增草稿')
  await page.getByRole('button', { name: '保存预设评论' }).click()
  await expect.poll(() => requests.saves.length).toBe(1)
  expect(requests.saves[0]).toEqual({ contents: ['个人常用评论', '读取恢复后保留的新增草稿'], expected_entity_id: 11 })
  await expect(page).toHaveURL(`${origin}/personal/interactions/comment-presets/new`)
  await expect(page.locator('#preset-0')).toHaveValue('个人常用评论')
  await expect(page.locator('#preset-1')).toHaveValue('读取恢复后保留的新增草稿')
})

test('preset creation initial load failure cannot submit an empty replacement collection', async ({ page }) => {
  const requests = await setup(page)
  await page.route(`${origin}/api/**/personal/comment-presets`, async route => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({ status: 400, json: { code: 400, message: '预设暂不可用', data: null } })
  })
  await page.goto(`${origin}/personal/interactions/comment-presets/new`)
  await expect(page.locator('.ls-async-state')).toContainText('预设评论加载失败')
  await expect(page.locator('.ls-form-list, textarea, .ls-empty-state')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '保存预设评论' })).toHaveCount(0)
  expect(requests.saves).toHaveLength(0)
})

async function setup(page: Page, options: { restricted?: boolean; ability?: boolean; feedError?: boolean; candidateError?: boolean; status?: string; pollStatus?: string; empty?: boolean; presetCount?: number } = {}) {
  const payload = Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamMember', id: 11 } })).toString('base64url')
  await page.context().addCookies([{ name: 'lostsky_token', value: `x.${payload}.x`, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  const requests = { writes: [] as string[], feed: 0, targets: [] as string[], candidates: 0, comments: [] as unknown[], commentPaths: [] as string[], saves: [] as unknown[] }
  let presets = [{ id: 1, content: '团队常用评论', scope: 'team' }, { id: 2, content: '个人常用评论', scope: 'personal' }]
  if (options.presetCount != null) presets = Array.from({ length: options.presetCount }, (_, index) => ({ id: index + 1, content: `常用评论 ${index + 1}`, scope: 'personal' }))
  await page.route(`${origin}/api/**`, async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    if (request.method() === 'POST') requests.writes.push(path)
    let data: unknown = null
    const restricted = options.restricted || options.ability === false
    if (path.endsWith('/workspace/access')) data = { permissions: options.restricted ? [] : ['weibo.personal.use', 'weibo.team.manage'], abilities: { weibo: { enabled: options.ability !== false, label: '微博' } }, identity: { entity_id: 11, name: '青空成员', type: 'teamMember', belongs_to_team: true, is_external: false } }
    else if (path.endsWith('/feed')) {
      requests.feed++
      if (options.feedError) { await route.fulfill({ status: 503, json: { code: 503, message: '信息流暂不可用', data: null } }); return }
      data = { list: options.empty ? [] : [{ id: 1, text: restricted ? '最新点单……需要陪玩' : `最新点单信息 ${'完整文字内容，'.repeat(30)}`, posted_at: 1789988000, restricted, ...(restricted ? {} : { author_name: '点单用户', status_url: 'https://m.weibo.cn/detail/12345', app_url: 'sinaweibo://detail?mblogid=12345' }) }, { id: 2, text: '较早的点单', posted_at: 1789987000, restricted }], total: options.empty ? 0 : 25, page: 1, limit: 20, restricted, updated_at: 1789988000, poll_status: options.pollStatus || 'ready', last_error: options.pollStatus === 'failed' ? 'INTERNAL_SQL_DIAGNOSTIC' : null }
    } else if (/\/feed\/\d+$/.test(path)) {
      requests.targets.push(path)
      data = { id: Number(path.split('/').at(-1)), text: '最新点单信息', posted_at: 1789988000, restricted, ...(restricted ? {} : { author_name: '点单用户', status_url: 'https://m.weibo.cn/detail/12345', app_url: 'sinaweibo://detail?mblogid=12345' }) }
    } else if (path.endsWith('/accounts')) {
      requests.candidates++
      if (options.candidateError) { await route.fulfill({ status: 503, json: { code: 503, message: '账号服务暂不可用', data: null } }); return }
      data = [{ id: 1, binding_id: 2, entity_id: 11, uid: '10001', screen_name: '授权账号', health: 'Valid' }]
    } else if (path.endsWith('/comment-presets')) {
      if (request.method() === 'POST') {
        requests.saves.push(request.postDataJSON())
        const scope = path.includes('/personal/') ? 'personal' : 'team'
        presets = [...presets.filter(item => item.scope !== scope), ...request.postDataJSON().contents.map((content: string, index: number) => ({ id: index + 3, content, scope }))]
      } else requests.candidates++
      data = path.includes('/personal/') ? presets : presets.filter(item => item.scope === 'team')
    } else if (path.endsWith('/comments')) { requests.comments.push(request.postDataJSON()); requests.commentPaths.push(path); data = { id: 4, status: options.status || 'Succeeded' } }
    else if (path.endsWith('/likes')) data = { id: 5, status: options.status || 'Succeeded' }
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
  return requests
}

test('feed remains readable at all widths and loads the page account selector', async ({ page }, testInfo) => {
  const requests = await setup(page)
  await page.clock.install()
  await page.goto(`${origin}/personal/feed`)
  await expect(page.locator('.feed-post')).toHaveCount(2)
  await expect(page.locator('.feed-post').first()).toContainText('最新点单信息')
  await expect(page.locator('.feed-text').first()).toHaveText(`最新点单信息 ${'完整文字内容，'.repeat(30)}`)
  await expect(page.locator('.ls-list-toolbar')).toHaveCount(0)
  await expect(page.locator('.feed-summary')).toContainText('共 25 条点单')
  await expect(page.locator('.feed-post img, textarea')).toHaveCount(0)
  await expect(page.locator('#feed-comment-account')).toBeVisible()
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    const shortRow = page.locator('.n-list-item').nth(1)
    const row = await shortRow.boundingBox()
    const content = await shortRow.locator('.feed-content').boundingBox()
    const actions = await shortRow.locator('.feed-actions').boundingBox()
    expect(row!.height).toBeLessThan(width >= 768 ? 110 : 160)
    if (width >= 768) expect(actions!.x).toBeGreaterThanOrEqual(content!.x + content!.width)
    else expect(actions!.y).toBeGreaterThanOrEqual(content!.y + content!.height)
    for (const control of await shortRow.locator('button, a').all()) {
      const box = await control.boundingBox()
      expect(box!.height).toBeGreaterThanOrEqual(44)
      expect(box!.width).toBeGreaterThanOrEqual(44)
    }
    if (width === 375 || width === 1440) await page.screenshot({ path: testInfo.outputPath(`feed-redesign-${width}.png`), fullPage: true })
  }
  await page.setViewportSize({ width: 320, height: 900 })
  const zoom = await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  await zoom.evaluate(element => element.remove())
  await page.setViewportSize({ width: 1440, height: 900 })
  expect(requests.candidates).toBe(1)
  expect(requests.comments).toHaveLength(0)
  const reads = requests.feed
  await page.clock.fastForward(31_000)
  await expect.poll(() => requests.feed).toBeGreaterThan(reads)
  await pushRoute(page, '/personal/interactions?action=comment&feed_post_id=1&from=feed')
  await expect(page).toHaveURL(/\/personal\/interactions\?.*feed_post_id=1/)
  await expect(page.locator('#weibo-comment')).toHaveValue('')
  expect(requests.comments).toHaveLength(0)
  await page.getByRole('link', { name: '返回点单信息流', exact: true }).click()
  await expect(page).toHaveURL(/\/personal\/feed(?:\?|$)/)
  await expect(page.locator('.feed-post')).toHaveCount(2)
})

for (const restriction of ['permission', 'ability'] as const) test(`${restriction} restriction preserves preview without protected reads or actions`, async ({ page }) => {
  const requests = await setup(page, restriction === 'permission' ? { restricted: true } : { ability: false })
  await page.goto(`${origin}/personal/feed`)
  await expect(page.getByText('最新点单……需要陪玩')).toBeVisible()
  await expect(page.getByText('完整文字内容')).toHaveCount(0)
  await expect(page.locator('.n-message')).toHaveCount(0)
  const open = page.getByRole('button', { name: '前往' }).first()
  await expect(open).toHaveAttribute('aria-disabled', 'true')
  await open.focus()
  await expect(open).toBeFocused()
  await open.press('Enter')
  await expect(page.locator('.n-message')).toHaveCount(1)
  expect(requests.candidates).toBe(0)
  expect(requests.comments).toHaveLength(0)
  await expect(page).toHaveURL(/\/personal\/feed$/)
  await page.getByRole('button', { name: '评论', exact: true }).first().press('Enter')
  await expect(page).toHaveURL(/\/personal\/feed$/)
  await expect(page.locator('.feed-comment')).toHaveCount(0)
  expect(requests.targets).toHaveLength(0)
  expect(requests.comments).toHaveLength(0)
  expect(requests.writes).toHaveLength(0)
})

for (const status of ['Succeeded', 'Failed', 'Unknown', 'Dispatching']) test(`comment handles ${status} and sends selected account and preset`, async ({ page }) => {
  const requests = await setup(page, { status })
  await page.goto(`${origin}/personal/feed`)
  await pushRoute(page, '/personal/interactions?action=comment&feed_post_id=1&from=feed')
  await page.locator('#weibo-account').click()
  await page.getByText('授权账号', { exact: true }).click()
  await page.locator('#weibo-preset').click()
  await page.getByText('团队 · 团队常用评论', { exact: true }).click()
  await expect(page.locator('#weibo-comment')).toHaveValue('团队常用评论')
  await page.getByRole('button', { name: '发表评论', exact: true }).click()
  await expect.poll(() => requests.comments.length).toBe(1)
  expect(requests.comments[0]).toEqual({ account_id: 1, comment: '团队常用评论', expected_entity_id: 11 })
  expect(requests.commentPaths[0]).toMatch(/\/personal\/feed\/1\/comments$/)
  if (status === 'Succeeded') {
    await expect(page.locator('.n-message')).toContainText('评论已发表')
    await expect(page.locator('#weibo-comment')).toHaveValue('团队常用评论')
  } else {
    await expect(page.locator('.n-message').filter({ hasText: '评论已发表' })).toHaveCount(0)
    await expect(page.locator('#weibo-comment')).toHaveValue('团队常用评论')
    await expect(page.locator('.n-message')).toContainText(status === 'Failed' ? '互动未完成' : status === 'Unknown' ? '结果尚未确认' : '正在处理')
  }
})

test('query errors are distinct from empty feed and empty account candidates', async ({ page }) => {
  await setup(page, { feedError: true })
  await page.goto(`${origin}/personal/feed`)
  await expect(page.getByText(/点单信息流加载失败/)).toBeVisible()
  await expect(page.getByText('暂无点单微博', { exact: true })).toHaveCount(0)
})

test('candidate failure prevents submit but keeps comment draft usable', async ({ page }) => {
  await setup(page, { candidateError: true })
  await page.goto(`${origin}/personal/feed`)
  await pushRoute(page, '/personal/interactions?action=comment&feed_post_id=1&from=feed')
  await expect(page.getByText(/微博账号加载失败/)).toBeVisible()
  await page.locator('#weibo-comment').fill('保留输入')
  await expect(page.getByRole('button', { name: '发表评论', exact: true })).toHaveAttribute('aria-disabled', 'true')
})

test('personal presets save atomically without requiring ability and protect dirty navigation', async ({ page }) => {
  const requests = await setup(page, { ability: false })
  await page.goto(`${origin}/personal/interactions/comment-presets/edit`)
  await expect(page.locator('#preset-0')).toHaveValue('个人常用评论')
  await expect(page.getByRole('button', { name: '保存预设评论' })).toHaveAttribute('aria-disabled', 'true')
  await page.locator('#preset-0').fill('更新个人预设')
  await page.getByRole('button', { name: '添加预设' }).click()
  await page.locator('#preset-1').fill('第二条预设')
  await page.getByRole('button', { name: '保存预设评论' }).click()
  await expect(page.locator('.n-message')).toContainText('预设评论已保存')
  expect(requests.saves).toEqual([{ contents: ['更新个人预设', '第二条预设'], expected_entity_id: 11 }])
  await page.locator('#preset-0').fill('未保存')
  page.once('dialog', dialog => dialog.dismiss())
  await page.evaluate(() => history.back())
  await expect(page.locator('#preset-0')).toHaveValue('未保存')
})

for (const pollStatus of ['unconfigured', 'failed', 'ready']) test(`source ${pollStatus} is distinguished from an empty result`, async ({ page }) => {
  await setup(page, { pollStatus, empty: true })
  await page.goto(`${origin}/personal/feed`)
  if (pollStatus === 'ready') await expect(page.getByText('暂无点单微博', { exact: true })).toBeVisible()
  else {
    await expect(page.getByText(pollStatus === 'unconfigured' ? /点单来源尚未配置/ : /点单来源更新暂时失败/)).toBeVisible()
    await expect(page.getByText('暂无点单微博', { exact: true })).toHaveCount(0)
  }
})

test('visibility pauses feed polling and interaction drafts survive visibility changes', async ({ page }) => {
  const requests = await setup(page)
  await page.clock.install()
  await page.goto(`${origin}/personal/feed`)
  await expect(page.locator('.feed-post')).toHaveCount(2)
  const visibility = async (hidden: boolean) => page.evaluate(value => {
    Object.defineProperty(document, 'hidden', { configurable: true, value })
    document.dispatchEvent(new Event('visibilitychange'))
  }, hidden)
  await visibility(true)
  await page.waitForLoadState('networkidle')
  const reads = requests.feed
  await page.clock.fastForward(31_000)
  expect(requests.feed).toBe(reads)
  await visibility(false)
  await expect.poll(() => requests.feed).toBeGreaterThan(reads)
  await pushRoute(page, '/personal/interactions?action=comment&feed_post_id=1&from=feed')
  await page.locator('#weibo-comment').fill('窗口恢复保留草稿')
  const editingReads = requests.feed
  await visibility(true)
  await visibility(false)
  expect(requests.feed).toBe(editingReads)
  await expect(page.locator('#weibo-comment')).toHaveValue('窗口恢复保留草稿')
})

test('a personal save response cannot overwrite the team preset scope after navigation', async ({ page }) => {
  await setup(page)
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route(`${origin}/api/**/personal/comment-presets`, async route => {
    if (route.request().method() !== 'POST') return route.fallback()
    await gate
    await route.fulfill({ json: { code: 0, message: 'ok', data: [{ id: 1, content: '团队常用评论', scope: 'team' }, { id: 3, content: '个人保存回包', scope: 'personal' }] } })
  })
  await page.goto(`${origin}/personal/interactions/comment-presets/edit`)
  await page.locator('#preset-0').fill('个人保存回包')
  await page.getByRole('button', { name: '保存预设评论' }).click()
  page.once('dialog', dialog => dialog.accept())
  await page.evaluate(() => {
    const router = (document.querySelector('#app') as HTMLElement & { __vue_app__: { config: { globalProperties: { $router: { push(path: string): Promise<unknown> } } } } }).__vue_app__.config.globalProperties.$router
    void router.push('/interactions/comment-presets/edit')
  })
  await expect(page).toHaveURL(`${origin}/interactions/comment-presets/edit`)
  await expect(page.locator('#preset-0')).toHaveValue('团队常用评论')
  await page.locator('#preset-0').fill('团队未保存草稿')
  release()
  await expect(page.locator('.n-message')).toContainText('预设评论已保存')
  await expect(page.locator('#preset-0')).toHaveValue('团队未保存草稿')
  await expect(page.locator('#preset-1')).toHaveCount(0)
})

test('an already running feed poll cannot replace the independent interaction target or draft', async ({ page }) => {
  await setup(page)
  await page.clock.install()
  await page.goto(`${origin}/personal/feed`)
  await expect(page.locator('.feed-post')).toHaveCount(2)
  let release!: () => void
  let started = false
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route(`${origin}/api/**/personal/feed?**`, async route => {
    started = true
    await gate
    await route.fulfill({ json: { code: 0, message: 'ok', data: { list: [], total: 0, page: 1, limit: 20, restricted: false, updated_at: 1789989000, poll_status: 'ready', last_error: null } } })
  })
  await page.clock.fastForward(31_000)
  await expect.poll(() => started).toBe(true)
  await pushRoute(page, '/personal/interactions?action=comment&feed_post_id=1&from=feed')
  await page.locator('#weibo-comment').fill('后台响应不能移动这条草稿')
  release()
  await expect(page).toHaveURL(/\/personal\/interactions\?.*feed_post_id=1/)
  await expect(page.getByText('最新点单信息', { exact: true })).toBeVisible()
  await expect(page.locator('#weibo-comment')).toHaveValue('后台响应不能移动这条草稿')
})

test('Weibo app launch falls back to the web post', async ({ page }) => {
  await setup(page)
  await page.route('https://m.weibo.cn/detail/12345', route => route.fulfill({ body: '<h1>微博正文页</h1>', contentType: 'text/html' }))
  await page.goto(`${origin}/personal/feed`)
  await page.getByRole('button', { name: '前往' }).first().click()
  await expect(page).toHaveURL('https://m.weibo.cn/detail/12345')
})

test('leaving for the app cancels the delayed web fallback', async ({ page }) => {
  await setup(page)
  await page.clock.install()
  await page.goto(`${origin}/personal/feed`)
  await page.getByRole('button', { name: '前往' }).first().click()
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
  await page.clock.fastForward(2000)
  await expect(page).toHaveURL(/\/personal\/feed$/)
})

for (const pollStatus of ['unconfigured', 'failed', 'ready']) test(`empty ${pollStatus} renders a bounded standard state without an empty list divider`, async ({ page }, testInfo) => {
  await setup(page, { pollStatus, empty: true })
  await page.goto(`${origin}/personal/feed`)
  const state = page.locator(pollStatus === 'failed' ? '.ls-async-state' : '.ls-empty-state')
  await expect(state).toBeVisible()
  if (pollStatus === 'unconfigured') await page.screenshot({ path: testInfo.outputPath('feed-unconfigured.png'), fullPage: true })
  await expect(page.locator('.n-list, .feed-summary, .ls-list-toolbar')).toHaveCount(0)
  await expect(page.getByText('共 0 条')).toHaveCount(0)
  await expect(page.getByText('INTERNAL_SQL_DIAGNOSTIC')).toHaveCount(0)
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const root = await page.locator('.ls-page').boundingBox()
    const box = await state.boundingBox()
    expect(box!.width).toBeGreaterThan(100)
    if (pollStatus !== 'failed') {
      const metrics = await state.evaluate(element => ({ minHeight: parseFloat(getComputedStyle(element).minHeight), rem: parseFloat(getComputedStyle(document.documentElement).fontSize) }))
      expect(metrics.minHeight).toBe(metrics.rem * 12)
      expect(box!.height).toBeLessThan(400)
      const colors = await state.evaluate(element => ({ title: getComputedStyle(element.querySelector('.n-empty__description')!).color, description: getComputedStyle(element.querySelector('.ls-empty-state__description')!).color }))
      expect(colors.title).toBe(colors.description)
    }
    expect(Math.abs(box!.x - root!.x)).toBeLessThan(1)
    expect(Math.abs(box!.width - root!.width)).toBeLessThan(1)
    expect(box!.y).toBeGreaterThan(root!.y)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.setViewportSize({ width: 320, height: 900 })
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('cached posts survive source failure with one feedback message and compact actions', async ({ page }) => {
  await setup(page, { pollStatus: 'failed' })
  await page.goto(`${origin}/personal/feed`)
  await expect(page.locator('.feed-post')).toHaveCount(2)
  await expect(page.locator('.n-message').filter({ hasText: '点单来源更新暂时失败，已有内容仍可查看。' })).toHaveCount(1)
  await expect(page.locator('.ls-inline-error')).toHaveCount(0)
  await expect(page.locator('.feed-post').first()).toContainText('完整文字内容')
  await expect(page.locator('.feed-post').last()).toContainText('较早的点单')
  await expect(page.getByText('INTERNAL_SQL_DIAGNOSTIC')).toHaveCount(0)
  await expect(page.getByRole('status').filter({ hasText: '共 25 条' })).toHaveCount(1)
  await expect(page.locator('textarea')).toHaveCount(0)
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const post of await page.locator('.feed-post').all()) {
      await expect(post.getByRole('button', { name: '评论', exact: true })).toBeVisible()
      await expect(post.getByRole('button', { name: '前往' })).toBeVisible()
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('preset editor explains disabled reordering and validates the twenty item save limit', async ({ page }) => {
  const requests = await setup(page, { presetCount: 20 })
  await page.goto(`${origin}/personal/interactions/comment-presets/edit`)
  await expect(page.locator('#preset-19')).toBeVisible()
  const up = page.getByRole('button', { name: '上移预设 1', exact: true })
  await expect(up).toHaveAttribute('aria-disabled', 'true')
  await up.focus()
  await up.press('Enter')
  await expect(page.locator('.n-message')).toContainText('已经是第一项')
  await page.getByRole('button', { name: '添加预设', exact: true }).click()
  await page.locator('#preset-20').fill('第 21 条')
  const save = page.getByRole('button', { name: '保存预设评论' })
  await expect(save).toHaveAttribute('aria-disabled', 'true')
  await save.click({ force: true })
  expect(requests.saves).toHaveLength(0)
  await expect(page.locator('.ls-inline-error')).toContainText('最多保存 20 条预设')
  await page.getByRole('button', { name: '删除预设 20', exact: true }).click()
  await expect(save).not.toHaveAttribute('aria-disabled', 'true')
  await save.click()
  await expect.poll(() => requests.saves.length).toBe(1)
  expect((requests.saves[0] as { contents: string[] }).contents).toHaveLength(20)
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const capacity = await page.locator('#workspace').evaluate(element => ({ max: parseFloat(getComputedStyle(element).maxWidth), width: element.getBoundingClientRect().width, rem: parseFloat(getComputedStyle(document.documentElement).fontSize) }))
    expect(capacity.max).toBe(capacity.rem * 42)
    expect(capacity.width).toBeLessThanOrEqual(capacity.max)
    const buttons = await page.locator('.ls-form-list__actions button').evaluateAll(elements => elements.map(element => { const box = element.getBoundingClientRect(); return { width: box.width, height: box.height } }))
    expect(buttons).toHaveLength(60)
    for (const box of buttons) {
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.width).toBeGreaterThanOrEqual(44)
    }
  }
  await page.setViewportSize({ width: 320, height: 900 })
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})


test('cached feed query failure preserves posts and reports a feedback message', async ({ page }) => {
  await setup(page)
  await page.route(`${origin}/api/**/personal/feed?**`, route => route.fulfill({ json: { code: 0, message: 'ok', data: {
    list: [1, 2].map(id => ({ id, text: `点单 ${id}`, posted_at: 1789988000, restricted: false })),
    total: 2, page: 1, limit: 20, restricted: false, poll_status: 'ready',
  } } }))
  await page.clock.install()
  await page.goto(`${origin}/personal/feed`)
  await expect(page.locator('.feed-post')).toHaveCount(2)
  await page.route(`${origin}/api/**/personal/feed?**`, route => route.fulfill({ status: 400, json: { code: 400, message: '暂时无法更新', data: null } }))
  await page.clock.fastForward(31_000)
  await expect(page.locator('.n-message').filter({ hasText: '点单更新失败：暂时无法更新。已有内容仍可查看。' })).toHaveCount(1)
  await expect(page.locator('.ls-inline-error')).toHaveCount(0)
  await expect(page.locator('.feed-post').first()).toContainText('点单 1')
  await expect(page.locator('.feed-post').last()).toContainText('点单 2')
  await expect(page.locator('.ls-async-state, .ls-empty-state')).toHaveCount(0)
  await expect(page.locator('.feed-post')).toHaveCount(2)
})

test('initial preset failure does not claim an empty editable list', async ({ page }) => {
  await setup(page)
  await page.route(`${origin}/api/**/personal/comment-presets`, route => route.fulfill({ status: 400, json: { code: 400, message: '预设暂不可用', data: null } }))
  await page.goto(`${origin}/personal/interactions/comment-presets`)
  await expect(page.locator('.ls-async-state')).toContainText('预设评论加载失败')
  await expect(page.locator('.ls-form-list')).toHaveCount(0)
})


async function pushRoute(page: Page, path: string) {
  await page.evaluate(target => {
    const router = (document.querySelector('#app') as HTMLElement & { __vue_app__: { config: { globalProperties: { $router: { push(path: string): Promise<unknown> } } } } }).__vue_app__.config.globalProperties.$router
    void router.push(target)
  }, path)
}

for (const prefix of ['', '/personal']) test(`compose retains post fields after interaction extraction in ${prefix || 'team'}`, async ({ page }) => {
  const requests = await setup(page)
  await page.goto(`${origin}${prefix}/compose`)
  await expect(page.getByText('发布内容', { exact: true })).toBeVisible()
  await expect(page.locator('#weibo-topic input')).toBeVisible()
  await expect(page.locator('#weibo-content textarea')).toBeVisible()
  await expect(page.getByRole('button', { name: '发布微博', exact: true })).toBeVisible()
  await expect(page.locator('#weibo-comment')).toHaveCount(0)
  expect(requests.writes).toHaveLength(0)
})

for (const prefix of ['', '/personal']) test(`default like in ${prefix || 'team'} stays manual and uses its workspace endpoint`, async ({ page }) => {
  const requests = await setup(page)
  await page.goto(`${origin}${prefix}/interactions?status_url=https%3A%2F%2Fm.weibo.cn%2Fdetail%2F12345`)
  await page.locator('#weibo-account').click()
  await page.getByText('授权账号', { exact: true }).click()
  expect(requests.writes).toHaveLength(0)
  await page.getByRole('button', { name: '点赞微博', exact: true }).click()
  await expect(page.locator('.n-message')).toContainText('已点赞微博')
  expect(requests.writes).toHaveLength(1)
  expect(requests.writes[0]).toMatch(new RegExp(`${prefix}/likes$`))
})

test('late comment success cannot clear a newer target draft after confirmed navigation', async ({ page }) => {
  await setup(page)
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  let submitted = false
  await page.route(`${origin}/api/**/personal/feed/1/comments`, async route => {
    submitted = true
    await gate
    await route.fulfill({ json: { code: 0, message: 'ok', data: { id: 4, status: 'Succeeded' } } })
  })
  await page.goto(`${origin}/personal/interactions?action=comment&feed_post_id=1&from=feed`)
  await page.locator('#weibo-account').click()
  await page.getByText('授权账号', { exact: true }).click()
  await page.locator('#weibo-comment').fill('已提交的旧目标内容')
  await page.getByRole('button', { name: '发表评论', exact: true }).click()
  await expect.poll(() => submitted).toBe(true)
  page.once('dialog', dialog => dialog.accept())
  await pushRoute(page, '/personal/interactions?action=comment&feed_post_id=2&from=feed')
  await page.locator('#weibo-comment').fill('新目标未提交草稿')
  const response = page.waitForResponse(url => url.url().endsWith('/personal/feed/1/comments'))
  release()
  await response
  await expect(page.locator('#weibo-comment')).toHaveValue('新目标未提交草稿')
  await expect(page.locator('.n-message').filter({ hasText: '评论已发表' })).toHaveCount(0)
})

test('browser Back from preset management restores an unsent feed draft', async ({ page }) => {
  await setup(page)
  await page.goto(`${origin}/personal/feed`)
  await page.getByRole('button', { name: '评论', exact: true }).first().click()
  await page.locator('#feed-1-comment').fill('浏览器后退仍保留')
  await page.getByRole('button', { name: '管理预设评论', exact: true }).click()
  await expect(page).toHaveURL(`${origin}/personal/interactions/comment-presets`)
  await page.goBack()
  await expect(page.locator('#feed-1-comment')).toHaveValue('浏览器后退仍保留')
  await expect(page.locator('.feed-post').first()).toContainText('最新点单信息')
})

test('returning from interaction restores all loaded feed batches and scroll position without an immediate refetch', async ({ page }) => {
  await setup(page)
  const pages: number[] = []
  await page.route(`${origin}/api/**/personal/feed?**`, route => {
    const number = Number(new URL(route.request().url()).searchParams.get('page'))
    pages.push(number)
    return route.fulfill({ json: { code: 0, message: 'ok', data: {
      list: Array.from({ length: 20 }, (_, index) => ({ id: (number - 1) * 20 + index + 1, text: `第 ${number} 批帖子 ${index + 1}`, posted_at: 1789988000, restricted: false })),
      total: 40, page: number, limit: 20, restricted: false, updated_at: 1789988000, poll_status: 'ready', last_error: null,
    } } })
  })
  await page.goto(`${origin}/personal/feed`)
  await expect(page.locator('.feed-post')).toHaveCount(20)
  await page.locator('.feed-tail').scrollIntoViewIfNeeded()
  await expect(page.locator('.feed-post')).toHaveCount(40)
  const item = page.locator('.feed-post').nth(28)
  await item.scrollIntoViewIfNeeded()
  const top = await page.evaluate(() => window.scrollY)
  expect(top).toBeGreaterThan(100)
  await pushRoute(page, '/personal/interactions?action=comment&feed_post_id=29&from=feed')
  await page.getByRole('link', { name: '返回点单信息流', exact: true }).click()
  await expect(page.locator('.feed-post')).toHaveCount(40)
  await expect(page.locator('.feed-post').first()).toContainText('第 1 批')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(top - 100)
  expect(pages).toEqual([1, 2])
})

function infiniteFeedPage(number: number, ids: number[], total: number, restricted = false, prefix = '点单') {
  return {
    list: ids.map(id => ({ id, text: `${prefix} ${id}`, posted_at: 1789988000 - id, restricted })),
    total, page: number, limit: 20, restricted, updated_at: 1789988000, poll_status: 'ready', last_error: null,
  }
}

test('infinite feed reports access snapshot failure instead of claiming no posts', async ({ page }) => {
  const requests = await setup(page)
  await page.route(`${origin}/api/**/workspace/access`, route => route.fulfill({ status: 400, json: { code: 400, message: '访问快照暂不可用', data: null } }))
  await page.goto(`${origin}/personal/feed`)
  await expect(page.locator('.ls-async-state')).toContainText('访问权限加载失败')
  await expect(page.locator('.ls-empty-state, .feed-post')).toHaveCount(0)
  expect(requests.feed).toBe(0)
  const deniedAgain = page.waitForResponse(response => response.url().endsWith('/workspace/access'))
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await deniedAgain
  await expect(page.locator('.ls-async-state')).toContainText('访问权限加载失败')
  expect(requests.feed).toBe(0)
})

test('infinite feed appends unique posts and serializes bottom loading with background polling', async ({ page }) => {
  await setup(page)
  await page.clock.install()
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  const reads: number[] = []
  let concurrent = 0
  let maximumConcurrent = 0
  await page.route(`${origin}/api/**/personal/feed?**`, async route => {
    const number = Number(new URL(route.request().url()).searchParams.get('page'))
    reads.push(number)
    maximumConcurrent = Math.max(maximumConcurrent, ++concurrent)
    if (number === 2) await gate
    const ids = number === 1 ? Array.from({ length: 20 }, (_, index) => index + 1)
      : number === 2 ? Array.from({ length: 20 }, (_, index) => index + 20)
        : [40, 41, 42, 43, 44]
    await route.fulfill({ json: { code: 0, message: 'ok', data: infiniteFeedPage(number, ids, 45) } })
    concurrent--
  })
  await page.goto(`${origin}/personal/feed?page=9`)
  await expect(page.locator('.feed-post')).toHaveCount(20)
  await expect(page.locator('.n-pagination')).toHaveCount(0)
  await page.clock.fastForward(29_000)
  await page.locator('.feed-tail').scrollIntoViewIfNeeded()
  await expect(page.locator('.feed-tail')).toContainText('正在加载更多点单')
  const readsDuringAppend = reads.length
  await page.clock.fastForward(2_000)
  expect(reads).toHaveLength(readsDuringAppend)
  await expect(page.locator('.feed-post')).toHaveCount(20)
  release()
  await expect(page.locator('.feed-post')).toHaveCount(39)
  await expect(page.locator('.feed-post').first()).toContainText('点单 1')
  await page.locator('.feed-tail').scrollIntoViewIfNeeded()
  await expect(page.locator('.feed-post')).toHaveCount(44)
  await expect(page.locator('.feed-tail')).toContainText('已看完当前点单')
  expect(reads.filter(number => number === 2)).toHaveLength(1)
  expect(reads.filter(number => number === 3)).toHaveLength(1)
  expect(maximumConcurrent).toBe(1)
})

test('infinite feed preserves loaded posts after an append failure and resumes only on explicit continuation', async ({ page }) => {
  await setup(page)
  await page.clock.install()
  let secondReads = 0
  await page.route(`${origin}/api/**/personal/feed?**`, route => {
    const number = Number(new URL(route.request().url()).searchParams.get('page'))
    if (number === 2 && ++secondReads === 1) return route.fulfill({ status: 400, json: { code: 400, message: '暂时无法加载更多', data: null } })
    return route.fulfill({ json: { code: 0, message: 'ok', data: infiniteFeedPage(number, Array.from({ length: 20 }, (_, index) => (number - 1) * 20 + index + 1), 40) } })
  })
  await page.goto(`${origin}/personal/feed`)
  await expect(page.locator('.feed-post')).toHaveCount(20)
  await page.locator('.feed-tail').scrollIntoViewIfNeeded()
  await expect(page.locator('.feed-tail')).toContainText('更多点单加载失败')
  await expect(page.locator('.feed-post')).toHaveCount(20)
  await page.clock.fastForward(31_000)
  await expect(page.locator('.feed-tail')).toContainText('更多点单加载失败')
  expect(secondReads).toBe(1)
  await page.getByRole('button', { name: '继续加载', exact: true }).click()
  await expect(page.locator('.feed-post')).toHaveCount(40)
  await expect(page.locator('.feed-tail')).toContainText('已看完当前点单')
  expect(secondReads).toBe(2)
})

test('infinite feed fills a short viewport and stops at an empty page even when total is stale', async ({ page }) => {
  await setup(page)
  await page.setViewportSize({ width: 1440, height: 1200 })
  const reads: number[] = []
  await page.route(`${origin}/api/**/personal/feed?**`, route => {
    const number = Number(new URL(route.request().url()).searchParams.get('page'))
    reads.push(number)
    return route.fulfill({ json: { code: 0, message: 'ok', data: infiniteFeedPage(number, number < 3 ? [number] : [], 100) } })
  })
  await page.goto(`${origin}/personal/feed`)
  await expect(page.locator('.feed-post')).toHaveCount(2)
  await expect(page.locator('.feed-tail')).toContainText('已看完当前点单')
  expect(reads).toEqual([1, 2, 3])
})

test('infinite feed retires a continuation error when a successful refresh reaches the new end', async ({ page }) => {
  await setup(page)
  await page.clock.install()
  let total = 40
  await page.route(`${origin}/api/**/personal/feed?**`, route => {
    const number = Number(new URL(route.request().url()).searchParams.get('page'))
    if (number === 2) return route.fulfill({ status: 400, json: { code: 400, message: '暂时无法加载更多', data: null } })
    return route.fulfill({ json: { code: 0, message: 'ok', data: infiniteFeedPage(1, Array.from({ length: 20 }, (_, index) => index + 1), total) } })
  })
  await page.goto(`${origin}/personal/feed`)
  await expect(page.locator('.feed-post')).toHaveCount(20)
  await page.locator('.feed-tail').scrollIntoViewIfNeeded()
  await expect(page.getByRole('button', { name: '继续加载', exact: true })).toBeVisible()
  total = 20
  await page.clock.fastForward(31_000)
  await expect(page.locator('.feed-tail')).toContainText('已看完当前点单')
  await expect(page.getByRole('button', { name: '继续加载', exact: true })).toHaveCount(0)
})

test('infinite feed clears old authorization batches and ignores an in-flight old response', async ({ page }) => {
  await setup(page)
  let allowed = true
  let version = 1
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  const reads: string[] = []
  await page.route(`${origin}/api/**/workspace/access`, route => route.fulfill({ json: { code: 0, message: 'ok', data: {
    permissions: allowed ? ['weibo.personal.use'] : [], abilities: { weibo: { enabled: true, label: '微博' } },
    identity: { entity_id: 11, name: '青空成员', type: 'teamMember', belongs_to_team: true, is_external: false },
  } } }))
  await page.route(`${origin}/api/**/personal/feed?**`, async route => {
    const number = Number(new URL(route.request().url()).searchParams.get('page'))
    const restricted = !allowed
    const prefix = restricted ? '安全预览' : `完整正文版本${version}`
    reads.push(`${prefix}:${number}`)
    if (number === 2 && !restricted && version === 1) await gate
    await route.fulfill({ json: { code: 0, message: 'ok', data: infiniteFeedPage(number, Array.from({ length: 20 }, (_, index) => (number - 1) * 20 + index + 1), 40, restricted, prefix) } })
  })
  await page.goto(`${origin}/personal/feed`)
  await expect(page.locator('.feed-post')).toHaveCount(20)
  await page.locator('.feed-tail').scrollIntoViewIfNeeded()
  await expect.poll(() => reads.includes('完整正文版本1:2')).toBe(true)
  allowed = false
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect(page.locator('.feed-post').first()).toContainText('安全预览')
  await expect(page.getByText(/完整正文版本1/)).toHaveCount(0)
  release()
  await expect(page.getByRole('button', { name: '前往' }).first()).toHaveAttribute('aria-disabled', 'true')
  await expect(page.getByRole('button', { name: '评论', exact: true }).first()).toHaveAttribute('aria-disabled', 'true')
  allowed = true
  version = 2
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect(page.locator('.feed-post').first()).toContainText('完整正文版本2')
  await expect(page.getByText(/完整正文版本1|安全预览/)).toHaveCount(0)
  await expect(page.locator('.feed-post')).toHaveCount(20)
  expect(reads).toContain('完整正文版本2:1')
})

test('infinite feed discards an obsolete authorization cache when returning from interaction', async ({ page }) => {
  await setup(page)
  let allowed = true
  let version = 1
  await page.route(`${origin}/api/**/workspace/access`, route => route.fulfill({ json: { code: 0, message: 'ok', data: {
    permissions: allowed ? ['weibo.personal.use'] : [], abilities: { weibo: { enabled: true, label: '微博' } },
    identity: { entity_id: 11, name: '青空成员', type: 'teamMember', belongs_to_team: true, is_external: false },
  } } }))
  await page.route(`${origin}/api/**/personal/feed?**`, route => route.fulfill({ json: { code: 0, message: 'ok', data:
    infiniteFeedPage(1, [1, 2], 2, !allowed, allowed ? `返回正文版本${version}` : '返回安全预览'),
  } }))
  await page.goto(`${origin}/personal/feed`)
  await expect(page.locator('.feed-post').first()).toContainText('返回正文版本1')
  await pushRoute(page, '/personal/interactions?action=comment&feed_post_id=1&from=feed')
  allowed = false
  await page.getByRole('link', { name: '返回点单信息流', exact: true }).click()
  await expect(page.locator('.feed-post').first()).toContainText('返回安全预览')
  allowed = true
  version = 2
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect(page.locator('.feed-post').first()).toContainText('返回正文版本2')
  await expect(page.getByText(/返回正文版本1|返回安全预览/)).toHaveCount(0)
})

for (const query of [
  'action=comment&feed_post_id=1&feed_post_id=2',
  'action=comment&feed_post_id=0',
  'action=comment&feed_post_id=1.5',
  'action=comment&feed_post_id=abc',
  'action=comment&feed_post_id=1&status_url=https%3A%2F%2Fm.weibo.cn%2Fdetail%2F12345',
  'action=comment&status_url=javascript%3Aalert(1)',
  'action=comment&status_url=https%3A%2F%2Fevil.example%2F12345',
  'action=comment&status_url=https%3A%2F%2Fm.weibo.cn%2Fdetail%2F12345&status_url=https%3A%2F%2Fm.weibo.cn%2Fdetail%2F67890',
]) test(`interaction rejects ambiguous or invalid target query: ${query}`, async ({ page }) => {
  const requests = await setup(page)
  await page.goto(`${origin}/personal/interactions?${query}`)
  await expect(page.locator('#workspace').getByRole('heading', { name: '互动', exact: true })).toBeVisible()
  await expect(page.locator('.ls-inline-error')).toBeVisible()
  await expect(page.getByRole('button', { name: '发表评论', exact: true })).toHaveAttribute('aria-disabled', 'true')
  expect(requests.targets).toHaveLength(0)
  expect(requests.comments).toHaveLength(0)
  expect(requests.writes).toHaveLength(0)
})

for (const action of ['invalid', 'comment&action=like', '']) test(`invalid action query uses safe default without writes: ${action}`, async ({ page }) => {
  const requests = await setup(page)
  await page.goto(`${origin}/personal/interactions?action=${action}&status_url=https%3A%2F%2Fm.weibo.cn%2Fdetail%2F12345`)
  await expect(page.getByRole('button', { name: '点赞微博', exact: true })).toBeVisible()
  await expect(page.locator('#weibo-comment')).toHaveCount(0)
  expect(requests.targets).toHaveLength(0)
  expect(requests.comments).toHaveLength(0)
  expect(requests.writes).toHaveLength(0)
})

for (const scope of ['团队 · 团队常用评论', '个人 · 个人常用评论']) test(`ordinary comment accepts ${scope} and edited text without automatic submission`, async ({ page }) => {
  const requests = await setup(page)
  await page.goto(`${origin}/personal/interactions?action=comment&status_url=https%3A%2F%2Fm.weibo.cn%2Fdetail%2F12345`)
  await expect(page.locator('#weibo-status-url')).toHaveValue('https://m.weibo.cn/detail/12345')
  await page.locator('#weibo-account').click()
  await page.getByText('授权账号', { exact: true }).click()
  await page.locator('#weibo-preset').click()
  await page.getByText(scope, { exact: true }).click()
  await expect(page.locator('#weibo-comment')).toHaveValue(scope.split(' · ')[1])
  await page.locator('#weibo-comment').fill('手动改写后的评论')
  expect(requests.comments).toHaveLength(0)
  await page.getByRole('button', { name: '发表评论', exact: true }).click()
  await expect.poll(() => requests.comments.length).toBe(1)
  expect(requests.comments[0]).toEqual({ account_id: 1, status_url: 'https://m.weibo.cn/detail/12345', comment: '手动改写后的评论', expected_entity_id: 11 })
  expect(requests.commentPaths[0]).toMatch(/\/personal\/comments$/)
  expect(requests.targets).toHaveLength(0)
})

for (const status of [403, 404]) test(`feed target ${status} blocks commenting without exposing cached post data`, async ({ page }) => {
  const requests = await setup(page)
  await page.route(`${origin}/api/**/personal/feed/1`, route => route.fulfill({ status, json: { code: status, message: status === 403 ? '无权读取该目标' : '点单已过期', data: null } }))
  await page.goto(`${origin}/personal/interactions?action=comment&feed_post_id=1&from=feed`)
  await expect(page.getByText('最新点单信息', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '发表评论', exact: true })).toHaveAttribute('aria-disabled', 'true')
  await expect(page.locator('.ls-inline-error')).toBeVisible()
  expect(requests.comments).toHaveLength(0)
  await page.getByRole('link', { name: '返回点单信息流', exact: true }).click()
  await expect(page).toHaveURL(/\/personal\/feed(?:\?|$)/)
})

for (const workspace of ['personal', 'team']) test(`preset ${workspace} direct entry returns to its workspace parent and selects only the parent navigation`, async ({ page }) => {
  await setup(page)
  const prefix = workspace === 'personal' ? '/personal' : ''
  await page.goto(`${origin}${prefix}/interactions/comment-presets`)
  const nav = page.locator('.weibo-sidebar')
  await expect(nav.getByRole('link', { name: '预设评论', exact: true })).toHaveCount(0)
  await expect(nav.locator(`a[href="${workspace === 'personal' ? '/personal/feed' : '/interactions'}"]`)).toHaveAttribute('aria-current', 'page')
  await expect(nav.locator('nav a[aria-current="page"]')).toHaveCount(1)
  await page.getByRole('link', { name: workspace === 'personal' ? '返回点单信息流' : '返回互动', exact: true }).click()
  await expect(page).toHaveURL(`${origin}${workspace === 'personal' ? '/personal/feed' : '/interactions'}`)
})

test('failed source with cached posts shows one popup and keeps the feed readable', async ({ page }) => {
  const requests = await setup(page, { pollStatus: 'failed' })
  await page.goto(`${origin}/personal/feed`)
  await expect(page.locator('.feed-post')).toHaveCount(2)
  await expect(page.locator('.n-message').filter({ hasText: '点单来源更新暂时失败' })).toHaveCount(1)
  await expect(page.locator('.weibo-stack').getByRole('alert')).toHaveCount(0)
  await expect(page.getByText('INTERNAL_SQL_DIAGNOSTIC')).toHaveCount(0)
  const reads = requests.feed
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect.poll(() => requests.feed).toBeGreaterThan(reads)
  await expect(page.locator('.n-message').filter({ hasText: '点单来源更新暂时失败' })).toHaveCount(1)
})

test('preset management round trip restores the account and edited comment on the feed', async ({ page }) => {
  const requests = await setup(page)
  await page.goto(`${origin}/personal/feed`)
  await page.getByRole('button', { name: '评论', exact: true }).first().click()
  await page.locator('#feed-comment-account').click()
  await page.getByText('授权账号', { exact: true }).click()
  await page.locator('#feed-1-comment').fill('进入管理前保留的私密草稿')
  let dialogs = 0
  page.on('dialog', async dialog => { dialogs++; await dialog.dismiss() })
  await page.getByRole('button', { name: '管理预设评论', exact: true }).click()
  await expect(page).toHaveURL(`${origin}/personal/interactions/comment-presets`)
  const managementUrl = new URL(page.url())
  expect(managementUrl.search).toBe('')
  expect(decodeURIComponent(page.url())).not.toContain('私密草稿')
  await page.getByRole('button', { name: '编辑预设', exact: true }).click()
  await page.locator('#preset-0').fill('管理中更新后的个人预设')
  await page.getByRole('button', { name: '保存预设评论' }).click()
  await expect.poll(() => requests.saves.length).toBe(1)
  await page.getByRole('link', { name: '返回预设评论', exact: true }).click()
  await page.getByRole('link', { name: '返回点单信息流', exact: true }).click()
  await expect(page.locator('#feed-1-comment')).toHaveValue('进入管理前保留的私密草稿')
  await expect(page.locator('#feed-comment-account')).toContainText('授权账号')
  await expect(page.locator('.feed-post').first()).toContainText('最新点单信息')
  const updatedPreset = page.locator('#feed-1-presets').getByRole('button', { name: '个人 · 管理中更新后的个人预设' })
  await expect(updatedPreset).toBeVisible()
  expect(dialogs).toBe(0)
  await updatedPreset.click()
  await expect(page.locator('#feed-1-comment')).toHaveValue('管理中更新后的个人预设')
  expect(requests.comments).toHaveLength(0)
})

test('preset entry moves only the personal management action and stays available without ability', async ({ page }) => {
  await setup(page, { ability: false })
  await page.goto(`${origin}/personal/interactions`)
  await expect(page.getByRole('button', { name: '管理预设评论', exact: true })).toHaveCount(0)
  await page.goto(`${origin}/interactions`)
  await expect(page.getByRole('button', { name: '管理预设评论', exact: true })).toBeVisible()
  await page.goto(`${origin}/personal/feed`)
  await page.getByRole('button', { name: '管理预设评论', exact: true }).click()
  await expect(page).toHaveURL(`${origin}/personal/interactions/comment-presets`)
  await expect(page.getByText('个人常用评论', { exact: true })).toBeVisible()
})

test('preset feed return keeps independent collapsed drafts and ordinary leave still confirms', async ({ page }) => {
  await setup(page)
  await page.goto(`${origin}/personal/feed`)
  await page.locator('.feed-post').nth(0).getByRole('button', { name: '评论', exact: true }).click()
  await page.locator('#feed-1-comment').fill('第一条草稿')
  await page.locator('.feed-post').nth(0).getByRole('button', { name: '收起评论' }).click()
  await page.locator('.feed-post').nth(1).getByRole('button', { name: '评论', exact: true }).click()
  await page.locator('#feed-2-comment').fill('第二条草稿')
  let dialogs = 0
  page.on('dialog', async dialog => { dialogs++; await dialog.dismiss() })
  await page.getByRole('button', { name: '管理预设评论', exact: true }).click()
  await page.getByRole('link', { name: '返回点单信息流', exact: true }).click()
  await expect(page.locator('#feed-2-comment')).toHaveValue('第二条草稿')
  await expect(page.locator('#feed-1-comment')).toHaveCount(0)
  await page.locator('.feed-post').nth(0).getByRole('button', { name: '评论', exact: true }).click()
  await expect(page.locator('#feed-1-comment')).toHaveValue('第一条草稿')
  expect(dialogs).toBe(0)
  await page.evaluate(async () => {
    const router = (document.querySelector('#app') as unknown as { __vue_app__: { config: { globalProperties: { $router: { push: (path: string) => Promise<unknown> } } } } }).__vue_app__.config.globalProperties.$router
    await router.push('/personal/accounts')
  })
  expect(dialogs).toBe(1)
  await expect(page).toHaveURL(`${origin}/personal/feed`)
  await expect(page.locator('#feed-1-comment')).toHaveValue('第一条草稿')
})

test('preset feed return discards drafts after access is revoked', async ({ page }) => {
  const options = { restricted: false }
  await setup(page, options)
  await page.goto(`${origin}/personal/feed`)
  await page.getByRole('button', { name: '评论', exact: true }).first().click()
  await page.locator('#feed-1-comment').fill('权限撤回前的草稿')
  await page.getByRole('button', { name: '管理预设评论', exact: true }).click()
  options.restricted = true
  await page.getByRole('link', { name: '返回点单信息流', exact: true }).click()
  await expect(page.locator('.feed-post').first()).toContainText('最新点单……需要陪玩')
  await expect(page.locator('#feed-1-comment')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '评论', exact: true }).first()).toHaveAttribute('aria-disabled', 'true')
})

test('cancelling a same-page target switch keeps the URL, target and comment draft', async ({ page }) => {
  const requests = await setup(page)
  const path = '/personal/interactions?action=comment&feed_post_id=1&from=feed'
  await page.goto(`${origin}${path}`)
  await expect(page.getByText('最新点单信息', { exact: true })).toBeVisible()
  await page.locator('#weibo-comment').fill('不能丢失的评论')
  const dialog = page.waitForEvent('dialog')
  const navigation = pushRoute(page, '/personal/interactions?action=comment&feed_post_id=2&from=feed')
  await (await dialog).dismiss()
  await navigation
  await expect(page).toHaveURL(`${origin}${path}`)
  await expect(page.locator('#weibo-comment')).toHaveValue('不能丢失的评论')
  await expect(page.getByText('最新点单信息', { exact: true })).toBeVisible()
  expect(requests.targets.every(path => path.endsWith('/1'))).toBe(true)
  expect(requests.comments).toHaveLength(0)
  expect(requests.writes).toHaveLength(0)
})


for (const restriction of ['permission', 'ability'] as const) test(`interaction target query cannot bypass ${restriction} restrictions`, async ({ page }) => {
  const requests = await setup(page, restriction === 'permission' ? { restricted: true } : { ability: false })
  await page.goto(`${origin}/personal/interactions?action=comment&feed_post_id=1&from=feed`)
  await expect(page.locator('#workspace').getByRole('heading', { name: '互动', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '发表评论', exact: true })).toHaveAttribute('aria-disabled', 'true')
  await expect(page.getByText('最新点单信息', { exact: true })).toHaveCount(0)
  expect(requests.targets).toHaveLength(0)
  if (restriction === 'permission') expect(requests.candidates).toBe(0)
  expect(requests.writes).toHaveLength(0)
})

test('a stale target response cannot overwrite a newer interaction target', async ({ page }) => {
  const requests = await setup(page)
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  let firstStarted = false
  await page.route(`${origin}/api/**/personal/feed/1`, async route => {
    firstStarted = true
    await gate
    await route.fulfill({ json: { code: 0, message: 'ok', data: { id: 1, text: '已离开的旧目标正文', posted_at: 1789988000, restricted: false, status_url: 'https://m.weibo.cn/detail/12345' } } })
  })
  await page.route(`${origin}/api/**/personal/feed/2`, route => route.fulfill({ json: { code: 0, message: 'ok', data: { id: 2, text: '新目标正文', posted_at: 1789988000, restricted: false, status_url: 'https://m.weibo.cn/detail/67890' } } }))
  await page.goto(`${origin}/personal/interactions?action=comment&feed_post_id=1&from=feed`)
  await expect.poll(() => firstStarted).toBe(true)
  await pushRoute(page, '/personal/interactions?action=comment&feed_post_id=2&from=feed')
  await expect(page.getByText('新目标正文', { exact: true })).toBeVisible()
  await page.locator('#weibo-comment').fill('新目标的评论草稿')
  const response = page.waitForResponse(url => url.url().endsWith('/personal/feed/1'))
  release()
  await response
  await expect(page.getByText('新目标正文', { exact: true })).toBeVisible()
  await expect(page.getByText('已离开的旧目标正文', { exact: true })).toHaveCount(0)
  await expect(page.locator('#weibo-comment')).toHaveValue('新目标的评论草稿')
  expect(requests.writes).toHaveLength(0)
})
