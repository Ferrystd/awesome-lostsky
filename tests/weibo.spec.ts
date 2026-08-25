import { expect, test, type Page } from '@playwright/test'
import { formatAbilityDenied } from '../frontend/packages/api/src/error-format'

async function authenticate(page: Page) {
  const payload = Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamMember', id: 11 } })).toString('base64url')
  await page.context().addCookies([{ name: 'lostsky_token', value: `x.${payload}.x`, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
}

async function mockApi(page: Page, failOverview = false, failMedia = false) {
  let protectedWrites = 0
  let mediaUploads = 0
  await page.route('http://demo.weibo.lostsky.work:5181/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (route.request().method() === 'POST' && (/\/(posts|likes|comments)$/.test(path) || /\/tasks\/\d+\/(start|resume)$/.test(path))) protectedWrites++
    if (route.request().method() === 'POST' && path.endsWith('/media')) mediaUploads++
    if (failOverview && path.endsWith('/accounts')) {
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ code: 503, message: 'service unavailable', data: null }) })
      return
    }
    if (failMedia && route.request().method() === 'POST' && path.endsWith('/media')) {
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ code: 503, message: '图片上传服务暂时不可用', data: null }) })
      return
    }
    let data: unknown = null
    if (path.endsWith('/workspace/access')) data = {
      permissions: [],
      abilities: { weibo: { enabled: false, reason: 'missing', label: '微博' } },
      identity: { entity_id: 11, name: '青空成员', type: 'teamMember' },
    }
    else if (path.endsWith('/accounts')) data = [{ id: 1, binding_id: 2, entity_id: 11, uid: '10001', screen_name: '青空微博', health: 'Valid', checked_at: 1787600000 }]
    else if (path.endsWith('/tasks')) data = [{ id: 3, owner_entity_id: null, operation_type: 'Post', topic: { name: '测试', display_tag: '#测试[超话]#' }, content: '测试任务', account_ids: [1], media_ids: [], start_at: 1787600000, min_interval: 60, max_interval: 120, version: 2, status: 'Paused', block_reason: null, next_run_at: null }]
    else if (path.endsWith('/operations')) data = { list: [], total: 0, page: 1, limit: 20 }
    else if (path.endsWith('/media')) data = { id: 8, pid: 'fixture-pid', content_type: 'image/png', byte_count: 8 }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })
  return { protectedWrites: () => protectedWrites, mediaUploads: () => mediaUploads }
}

test('Weibo pages stay available without Ability and only remote execution is disabled', async ({ page }) => {
  await authenticate(page)
  const requests = await mockApi(page)

  await page.goto('http://demo.weibo.lostsky.work:5181/overview')
  await expect(page.getByRole('heading', { name: '调度态势中心' })).toBeVisible()
  await expect(page.getByText('当前团队未开通微博 Ability')).toHaveCount(0)
  await expect(page.locator('.n-message')).toHaveCount(0)
  const hero = page.getByRole('region', { name: '调度态势中心' })
  const workEntries = page.getByRole('region', { name: '工作入口' })
  await expect(hero).toBeVisible()
  for (const label of ['账号', '发帖', '互动', '任务', '日志']) {
    await expect(workEntries.getByRole('link', { name: new RegExp(`^${label}`) })).toHaveCount(1)
  }

  const sidebar = page.getByRole('complementary', { name: '微博导航' })
  await expect(sidebar.getByText('工作空间', { exact: true })).toBeVisible()
  await expect(sidebar.locator('.weibo-brand a')).toHaveCSS('display', 'flex')
  await expect(sidebar.locator('.weibo-brand a')).toHaveCSS('align-items', 'baseline')
  for (const label of ['概览', '账号', '发帖', '互动', '任务', '日志']) {
    const link = sidebar.getByRole('link', { name: label })
    await expect(link).toHaveCount(1)
    await expect(link.locator('svg')).toHaveCount(2)
  }
  if ((page.viewportSize()?.width ?? 0) >= 900) {
    await expect(sidebar).toHaveCSS('position', 'sticky')
    const [sidebarBox, workspaceBox] = await Promise.all([
      sidebar.boundingBox(),
      page.locator('.weibo-layout').boundingBox(),
    ])
    expect(sidebarBox?.x).toBe(0)
    expect(sidebarBox?.width).toBeCloseTo(248, 0)
    expect(workspaceBox?.x).toBeGreaterThanOrEqual(248)
  } else {
    await expect(page.getByRole('navigation', { name: '移动端主导航' })).toBeVisible()
    await page.getByRole('button', { name: '更多' }).click()
    await expect(sidebar).toHaveClass(/open/)
    await expect(sidebar).toHaveCSS('transform', 'none')
    expect((await sidebar.boundingBox())?.x).toBeGreaterThanOrEqual(0)
    await page.getByRole('button', { name: '关闭导航' }).click()
  }

  for (const path of ['/accounts', '/accounts/bind', '/tasks', '/tasks/new', '/logs']) {
    await page.goto(`http://demo.weibo.lostsky.work:5181${path}`)
    await expect(page.locator('#workspace')).toBeVisible()
  }

  await page.goto('http://demo.weibo.lostsky.work:5181/tasks/new')
  const scheduleSection = page.getByRole('region', { name: '执行安排' })
  const contentSection = page.getByRole('region', { name: '发布内容' })
  await expect(scheduleSection).toBeVisible()
  await expect(contentSection).toBeVisible()
  await expect(page.locator('.n-form-item')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '保存为暂停' })).toBeVisible()
  await expect(page.getByRole('button', { name: '取消' })).toBeVisible()
  await page.getByText('每日签到', { exact: true }).click()
  await expect(page.getByRole('region', { name: '签到目标' })).toBeVisible()
  await expect(page.getByLabel('正文')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '选择并上传图片' })).toHaveCount(0)
  const [scheduleBox, targetBox] = await Promise.all([scheduleSection.boundingBox(), page.getByRole('region', { name: '签到目标' }).boundingBox()])
  expect(scheduleBox?.width).toBeCloseTo(targetBox?.width ?? 0, 0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)

  await page.goto('http://demo.weibo.lostsky.work:5181/tasks')
  await expect(page.getByRole('link', { name: '新建任务' })).toBeEnabled()
  await expect(page.getByRole('link', { name: '编辑' })).toBeEnabled()
  const start = page.getByRole('button', { name: '开启' })
  await expect(start).toHaveAttribute('aria-disabled', 'true')
  await expect(start).not.toHaveAttribute('title')
  await expect(page.locator('.n-message')).toHaveCount(0)
  await start.click({ force: true })
  await expect(page.locator('.n-message').filter({ hasText: formatAbilityDenied('weibo', '微博') })).toBeVisible()
  expect(requests.protectedWrites()).toBe(0)

  await page.goto('http://demo.weibo.lostsky.work:5181/compose')
  await expect(page.getByRole('heading', { name: '执行账号' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '发布内容' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '图片' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '执行', exact: true })).toBeVisible()
  await expect(page.getByLabel(/确认词/)).toHaveCount(0)
  const upload = page.getByRole('button', { name: '选择并上传图片' })
  await expect(upload).toHaveAttribute('aria-disabled', 'true')
  await upload.click({ force: true })
  await expect(page.locator('.n-message').filter({ hasText: '请先选择微博账号，再添加图片' })).toBeVisible()
  await page.locator('.n-select').click()
  await page.locator('.n-base-select-option').filter({ hasText: '青空微博' }).click()
  await page.locator('input[type="file"]').setInputFiles({ name: 'fixture.png', mimeType: 'image/png', buffer: Buffer.from('fixture') })
  await expect(page.getByText('1 / 9 已准备')).toBeVisible()
  await expect(page.getByText('图片 1', { exact: true })).toBeVisible()
  expect(requests.mediaUploads()).toBe(1)
  expect(requests.protectedWrites()).toBe(0)
  const publish = page.getByRole('button', { name: '发布微博' })
  await expect(publish).toHaveAttribute('aria-disabled', 'true')
  await expect(publish).not.toHaveAttribute('title')
  await publish.click({ force: true })
  await expect(page.locator('.n-message').filter({ hasText: formatAbilityDenied('weibo', '微博') })).toBeVisible()
  expect(requests.protectedWrites()).toBe(0)

  await page.goto('http://demo.weibo.lostsky.work:5181/interactions')
  await expect(page.getByLabel('微博帖子链接')).toBeVisible()
  await expect(page.getByLabel('微博 ID')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '读取图片' })).toHaveCount(0)
  await expect(page.getByText('从已有微博帖子读取')).toHaveCount(0)

  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
})

test('overview keeps the shared workspace design when live status is unavailable', async ({ page }) => {
  await authenticate(page)
  await mockApi(page, true)
  await page.goto('http://demo.weibo.lostsky.work:5181/overview')

  await expect(page.getByRole('region', { name: '调度态势中心' })).toBeVisible()
  await expect(page.getByRole('region', { name: '工作入口' })).toBeVisible()
  await expect(page.locator('.ls-async-state')).toContainText('无法读取微博态势')
  await expect(page.locator('.n-skeleton')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
})

test('image upload failures stay visible beside the upload control', async ({ page }) => {
  await authenticate(page)
  const requests = await mockApi(page, false, true)
  await page.goto('http://demo.weibo.lostsky.work:5181/compose')

  await page.locator('.n-select').click()
  await page.locator('.n-base-select-option').filter({ hasText: '青空微博' }).click()
  await page.locator('input[type="file"]').setInputFiles({ name: 'failed.png', mimeType: 'image/png', buffer: Buffer.from('fixture') })

  await expect(page.locator('.ls-inline-error')).toContainText('服务暂时不可用，请稍后再试')
  await expect(page.getByText('0 / 9 已准备')).toBeVisible()
  expect(requests.mediaUploads()).toBe(1)
  expect(requests.protectedWrites()).toBe(0)
})
