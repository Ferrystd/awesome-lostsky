import { expect, test } from '@playwright/test'

test('landing page exposes the main journey without horizontal overflow', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/')
  await expect(page).toHaveTitle(/LostSky/)
  await expect(page.getByRole('heading', { name: /当喧闹退去/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /创建工作空间/ }).first()).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)
})

test('account login remains usable at mobile and desktop widths', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('http://127.0.0.1:5174/login')
  await expect(page.getByRole('heading', { name: '欢迎回来' }), `login did not render; ${errors.join(' | ')}`).toBeVisible()
  await expect(page.getByLabel('手机号码')).toBeVisible()
  await expect(page.getByRole('textbox', { name: '密码', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '登录' })).toBeVisible()
})

test('team workspace routes remain responsive with the API boundary mocked', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') pageErrors.push(message.text()) })
  page.on('requestfailed', (request) => pageErrors.push(`${request.url()}: ${request.failure()?.errorText}`))
  await page.addInitScript(() => localStorage.setItem('lostsky_token', 'e2e-token'))
  await page.route('http://127.0.0.1:5175/api/**', async (route) => {
    const url = new URL(route.request().url())
    let data: unknown = []
    if (url.pathname.endsWith('/file/usage')) data = { total_size: 0, count: 0 }
    else if (url.pathname.endsWith('/joinReview/index')) data = { list: [{ id: 1, user_id: 6, status: '审核中', name: '青空成员' }], total: 1 }
    else if (url.pathname.endsWith('/joinReview/get')) data = { id: 1, user_id: 6, status: '审核中', memo: '希望参与工作室协作', values: [], tasks: [{ id: 8, title: '确认协作约定', description: '阅读并确认团队协作方式', is_passed: 0 }] }
    else if (url.pathname.endsWith('/doc')) data = { list: [{ id: 11, title: '第一份文档', summary: '', visibility: 1 }, { id: 12, title: '第二份文档', summary: '这是一段长度不同的摘要，用来验证文档卡片底栏仍然共用同一条基线。', visibility: 1 }], total: 2 }
    else if (url.pathname.endsWith('/file/index') || url.pathname.endsWith('/notice/index')) data = { list: [], total: 0 }
    else if (url.pathname.endsWith('/setting')) data = { allow_join: '1', team_label: 'LostSky' }
    else if (url.pathname.endsWith('/me/get')) data = { id: 1, user_id: 1, nickname: '测试成员' }
    else if (url.pathname.endsWith('/join/form')) data = []
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })
  for (const path of ['/', '/members', '/roles', '/roles/new', '/posts', '/fields', '/notice', '/files', '/docs', '/settings', '/join-review', '/join-review/review?id=1', '/me']) {
    await page.goto(`http://127.0.0.1:5175${path}`)
    expect(page.url(), `unexpected navigation at ${path}; errors: ${pageErrors.join(' | ')}`).toContain('127.0.0.1:5175')
    if (!await page.locator('#workspace').count()) throw new Error(`workspace missing at ${path}; url=${page.url()}; token=${await page.evaluate(() => localStorage.getItem('lostsky_token'))}; errors=${pageErrors.join(' | ')}; body=${(await page.locator('body').innerText()).slice(0, 400)}`)
    await expect(page.locator('#workspace')).toBeVisible()
    await expect(page.locator('.admin-page')).toBeVisible()
    if (path === '/join-review') {
      await expect(page.getByRole('link', { name: /青空成员/ })).toBeVisible()
      await expect(page.getByText('查看申请状态，选择一条申请进入独立审核页面。')).toBeVisible()
    }
    if (path.startsWith('/join-review/review')) {
      await expect(page.getByText('审核任务')).toBeVisible()
      await expect(page.getByLabel('任务标题')).toHaveValue('确认协作约定')
      await expect(page.getByRole('checkbox', { name: '已完成' })).toBeVisible()
      await expect(page.getByRole('link', { name: '返回申请列表' })).toBeVisible()
    }
    if (path === '/roles/new') {
      await expect(page.getByRole('heading', { name: '新建角色', level: 2 })).toBeVisible()
      await expect(page.getByLabel('角色标识')).toBeVisible()
      await expect(page.getByLabel('角色名称')).toBeVisible()
    }
    if (path === '/docs' && await page.locator('.doc-list article').count() === 2) {
      await expect(page.getByText('暂无摘要')).toBeVisible()
      if ((page.viewportSize()?.width ?? 0) >= 720) {
        const footerTops = await page.locator('.doc-list article footer').evaluateAll((footers) => footers.map((footer) => footer.getBoundingClientRect().top))
        if (footerTops.length === 2) expect(Math.abs(footerTops[0] - footerTops[1])).toBeLessThan(1)
      }
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow, `horizontal overflow at ${path}`).toBe(false)
  }
})
