import { expect, test, type Page } from '@playwright/test'

const origin = 'http://demo.weibo.lostsky.work:5181'
async function setup(page: Page, options: { status?: string; accountsError?: boolean; presetsError?: boolean; restricted?: boolean } = {}) {
  const token = Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamMember', id: 11 } })).toString('base64url')
  await page.context().addCookies([{ name: 'lostsky_token', value: `x.${token}.x`, domain: '.lostsky.work', path: '/' }])
  const state = { allowed: !options.restricted, comments: [] as { path: string; body: unknown }[], candidates: 0 }
  await page.route(`${origin}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = null
    if (path.endsWith('/workspace/access')) data = { permissions: state.allowed ? ['weibo.personal.use'] : [], abilities: { weibo: { enabled: true, label: '微博' } }, identity: { entity_id: 11, type: 'teamMember', name: '本人', belongs_to_team: true, is_external: false } }
    else if (path.endsWith('/feed')) data = { list: [1, 2].map(id => ({ id, text: `帖子 ${id} ${'长正文内容'.repeat(30)}`, posted_at: 1789988000, restricted: !state.allowed })), total: 2, limit: 20, page: 1, restricted: !state.allowed, updated_at: 1789988000, poll_status: 'ready' }
    else if (path.endsWith('/accounts')) {
      state.candidates++
      if (options.accountsError) return route.fulfill({ status: 503, json: { code: 503, message: '账号服务不可用', data: null } })
      data = [1, 2].map(id => ({ id, binding_id: id, entity_id: 11, uid: String(id), screen_name: `评论账号${id}`, health: 'Valid' }))
    } else if (path.endsWith('/comment-presets')) {
      state.candidates++
      if (options.presetsError) return route.fulfill({ status: 503, json: { code: 503, message: '预设服务不可用', data: null } })
      data = [{ id: 1, scope: 'team', content: '团队评论' }, { id: 2, scope: 'personal', content: '个人评论' }]
    } else if (path.endsWith('/comments')) {
      state.comments.push({ path, body: route.request().postDataJSON() })
      data = { id: 1, status: options.status || 'Succeeded' }
    }
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
  await page.goto(`${origin}/personal/feed`)
  await expect(page.locator('.feed-post')).toHaveCount(2)
  return state
}
async function account(page: Page, id = 1) {
  await page.locator('#feed-comment-account').click()
  await page.getByText(`评论账号${id}`, { exact: true }).click()
}
async function expand(page: Page, index = 0) {
  await page.locator('.feed-post').nth(index).getByRole('button', { name: '评论', exact: true }).click()
}

test('inline presets, account switching and independent drafts stay on the feed', async ({ page }) => {
  const state = await setup(page)
  await page.setViewportSize({ width: 1280, height: 900 })
  await account(page)
  await expand(page)
  const rail = page.locator('#feed-comment-1')
  const preset = await rail.locator('#feed-1-preset').boundingBox()
  const input = await rail.locator('#feed-1-comment').boundingBox()
  const sendButton = await rail.getByRole('button', { name: '发表评论' }).boundingBox()
  const railBox = await rail.boundingBox()
  expect(input!.x).toBeGreaterThan(preset!.x + preset!.width)
  expect(sendButton!.x).toBeGreaterThan(input!.x + input!.width)
  expect(railBox!.height).toBeLessThan(80)
  await expect(rail.locator('#feed-1-comment')).toHaveAttribute('aria-label', '评论内容')
  await page.locator('#feed-1-preset').click()
  await page.getByText('团队 · 团队评论', { exact: true }).click()
  await expect(page.locator('#feed-1-comment')).toHaveValue('团队评论')
  await expand(page, 1)
  await page.locator('#feed-2-comment').fill('第二条草稿')
  await page.locator('.feed-post').first().getByRole('button', { name: '收起评论' }).click()
  await account(page, 2)
  await expand(page)
  await expect(page.locator('#feed-1-comment')).toHaveValue('团队评论')
  await page.locator('#feed-comment-1').getByRole('button', { name: '发表评论' }).click()
  await expect.poll(() => state.comments.length).toBe(1)
  expect(state.comments[0]).toEqual({ path: expect.stringMatching(/\/personal\/feed\/1\/comments$/), body: { account_id: 2, comment: '团队评论', expected_entity_id: 11 } })
  await expect(page.locator('#feed-1-comment')).toHaveValue('')
  await expect(page.locator('#feed-2-comment')).toHaveValue('第二条草稿')
  await expect(page).toHaveURL(`${origin}/personal/feed`)
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const form = await page.locator('#feed-comment-1').boundingBox()
    const content = await page.locator('.feed-content').first().boundingBox()
    const actions = await page.locator('.feed-actions').first().boundingBox()
    expect(form!.y).toBeGreaterThanOrEqual(Math.max(content!.y + content!.height, actions!.y + actions!.height))
    expect(form!.width).toBeGreaterThanOrEqual(content!.width)
    if (width < 768) {
      const presetBox = await page.locator('#feed-1-preset').boundingBox()
      const inputBox = await page.locator('#feed-1-comment').boundingBox()
      expect(inputBox!.y).toBeGreaterThanOrEqual(presetBox!.y + presetBox!.height)
    }
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.setViewportSize({ width: 320, height: 900 })
  await page.addStyleTag({ content: 'html { font-size: 200% !important }' })
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('pending submission freezes its payload and protects newer edits and other posts', async ({ page }) => {
  await setup(page)
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  const writes: unknown[] = []
  await page.route(`${origin}/api/**/personal/feed/1/comments`, async route => {
    writes.push(route.request().postDataJSON())
    await gate
    await route.fulfill({ json: { code: 0, message: 'ok', data: { status: 'Succeeded' } } })
  })
  await account(page)
  await expand(page)
  await page.locator('#feed-1-comment').fill('发送快照')
  const send = page.locator('#feed-comment-1').getByRole('button', { name: '发表评论' })
  await send.click()
  await expect.poll(() => writes.length).toBe(1)
  await send.click({ force: true })
  await page.locator('#feed-1-comment').fill('较新的内容')
  await account(page, 2)
  release()
  await expect(send).not.toHaveAttribute('aria-disabled', 'true')
  await expect(page.locator('#feed-1-comment')).toHaveValue('较新的内容')
  expect(writes).toEqual([{ account_id: 1, comment: '发送快照', expected_entity_id: 11 }])
  const dialog = page.waitForEvent('dialog')
  const navigation = page.evaluate(() => {
    const app = (document.querySelector('#app') as unknown as { __vue_app__: { config: { globalProperties: { $router: { push(path: string): Promise<unknown> } } } } }).__vue_app__
    return app.config.globalProperties.$router.push('/personal/interactions')
  })
  await (await dialog).dismiss()
  await navigation
  await expect(page).toHaveURL(`${origin}/personal/feed`)
  await expect(page.locator('#feed-1-comment')).toHaveValue('较新的内容')
})

for (const status of ['Failed', 'Unknown', 'Dispatching']) test(`inline ${status} preserves content and never reports success`, async ({ page }) => {
  const state = await setup(page, { status })
  await account(page)
  await expand(page)
  await page.locator('#feed-1-comment').fill('保留失败草稿')
  await page.getByRole('button', { name: '发表评论', exact: true }).click()
  await expect(page.locator('#feed-comment-1').getByRole('alert')).toContainText(status === 'Failed' ? '评论未完成' : status === 'Unknown' ? '尚未确认' : '正在处理')
  await expect(page.locator('#feed-1-comment')).toHaveValue('保留失败草稿')
  await expect(page.locator('.n-message').filter({ hasText: '评论已发表' })).toHaveCount(0)
  expect(state.comments).toHaveLength(1)
})

test('preset failure still allows custom comments while account failure blocks submission', async ({ page }) => {
  const state = await setup(page, { accountsError: true, presetsError: true })
  await expand(page)
  await page.locator('#feed-1-comment').fill('手动输入仍保留')
  await expect(page.getByText(/微博账号加载失败：/)).toBeVisible()
  await expect(page.getByText(/预设评论加载失败，可直接填写评论/)).toBeVisible()
  await page.getByRole('button', { name: '发表评论', exact: true }).click({ force: true })
  expect(state.comments).toHaveLength(0)
  await expect(page.locator('#feed-1-comment')).toHaveValue('手动输入仍保留')
})

test('permission withdrawal closes inline editors and prevents all comment writes', async ({ page }) => {
  const state = await setup(page)
  await expand(page)
  await page.locator('#feed-1-comment').fill('权限变化时的草稿')
  state.allowed = false
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect(page.locator('.feed-comment')).toHaveCount(0)
  const trigger = page.getByRole('button', { name: '评论', exact: true }).first()
  await expect(trigger).toHaveAttribute('aria-disabled', 'true')
  await trigger.press('Enter')
  expect(state.comments).toHaveLength(0)
})

test('removed account clears selection without discarding the comment', async ({ page }) => {
  const state = await setup(page)
  await account(page)
  await expand(page)
  await page.locator('#feed-1-comment').fill('账号失效后保留')
  await page.route(`${origin}/api/**/personal/accounts`, route => route.fulfill({ json: { code: 0, message: 'ok', data: [] } }))
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    window.dispatchEvent(new Event('visibilitychange'))
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    window.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(page.locator('#feed-comment-account')).not.toContainText('评论账号1')
  await expect(page.getByRole('button', { name: '发表评论', exact: true })).toHaveAttribute('aria-disabled', 'true')
  await expect(page.locator('#feed-1-comment')).toHaveValue('账号失效后保留')
  expect(state.comments).toHaveLength(0)
})

test('network failure preserves text and asks the user to verify the remote result', async ({ page }) => {
  await setup(page)
  let writes = 0
  await page.route(`${origin}/api/**/personal/feed/1/comments`, route => { writes++; return route.abort('failed') })
  await account(page)
  await expand(page)
  await page.locator('#feed-1-comment').fill('网络错误后保留')
  await page.getByRole('button', { name: '发表评论', exact: true }).click()
  await expect(page.locator('#feed-comment-1').getByRole('alert')).toContainText('请先核对微博或执行日志，避免重复发送')
  await expect(page.locator('#feed-1-comment')).toHaveValue('网络错误后保留')
  expect(writes).toBe(1)
})
