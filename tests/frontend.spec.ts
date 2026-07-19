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
  let emptyNotices = false
  let noticeConfirmRequests = 0
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') pageErrors.push(message.text()) })
  page.on('requestfailed', (request) => pageErrors.push(`${request.url()}: ${request.failure()?.errorText}`))
  await page.addInitScript(() => localStorage.setItem('lostsky_token', 'e2e-token'))
  await page.route('http://127.0.0.1:5175/api/**', async (route) => {
    const url = new URL(route.request().url())
    let data: unknown = []
    if (url.pathname.endsWith('/notice/get') && url.searchParams.get('id') === '404') {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 404, message: '站内信不存在', data: null }) })
      return
    }
    if (url.pathname.endsWith('/file/usage')) data = { total_size: 0, count: 0 }
    else if (url.pathname.endsWith('/joinReview/index')) data = { list: [{ id: 1, user_id: 6, status: '审核中', name: '青空成员' }], total: 1 }
    else if (url.pathname.endsWith('/joinReview/get')) data = { id: 1, user_id: 6, status: '审核中', memo: '希望参与工作室协作', values: [], tasks: [{ id: 8, title: '确认协作约定', description: '阅读并确认团队协作方式', is_passed: 0 }] }
    else if (url.pathname.endsWith('/doc/get')) data = { id: 11, title: '第一份文档', content: '欢迎 [@测试成员](lostsky://entity/alice)\n\n<script>window.__lostskyXss = 1</script>', target_type: 'team', target_id: 1, manager_scope: 1, visibility: 1, sort: 0 }
    else if (url.pathname.endsWith('/doc')) data = { list: [{ id: 11, title: '第一份文档', content: '', visibility: 1 }, { id: 12, title: '第二份文档', content: '这是一段长度不同的摘要，用来验证文档卡片底栏仍然共用同一条基线。', visibility: 1 }], total: 2 }
    else if (url.pathname.endsWith('/member/get')) data = { id: 1, user_id: 1, nickname: '测试成员', slug: 'alice', search_override: null, posts: [] }
    else if (url.pathname.endsWith('/member/index')) data = [{ id: 1, user_id: 1, nickname: '测试成员', slug: 'alice', is_blocked: 0 }]
    else if (url.pathname.endsWith('/postType/index')) data = []
    else if (url.pathname.endsWith('/entity/search')) data = [{ slug: 'alice', type: 'teamMember', display_name: '测试成员', available: true, team: { slug: 'demo', display_name: '测试团队' } }]
    else if (url.pathname.endsWith('/entity/resolve')) data = [{ slug: 'alice', type: 'teamMember', display_name: '测试成员', available: true, team: { slug: 'demo', display_name: '测试团队' }, href: '/member-detail?id=1' }]
    else if (url.pathname.endsWith('/notice/get')) data = { id: 21, title: '维护窗口提醒', content: '系统将在今晚进行维护。\n请提前保存正在处理的内容。', is_pinned: 1, is_read: 0, create_time: 1752883200 }
    else if (url.pathname.endsWith('/notice/index')) data = emptyNotices ? { list: [], total: 0 } : { list: [
      { id: 21, title: '维护窗口提醒', content: '系统将在今晚进行维护。', is_pinned: 1, is_read: 0, create_time: 1752883200 },
      { id: 20, title: '欢迎加入团队', content: '', is_pinned: 0, is_read: 1, create_time: 1752796800 },
    ], total: 2 }
    else if (url.pathname.endsWith('/notice/confirm')) { noticeConfirmRequests++; data = null }
    else if (url.pathname.endsWith('/file/index')) data = { list: [], total: 0 }
    else if (url.pathname.endsWith('/setting/schema')) data = {
      apps: [{
        app_name: 'entity', label: '对象搜索', description: '控制团队和成员是否可以通过对象标识被搜索。', order: 10,
        settings: [
          { key: 'team_searchable', label: '团队自身可搜索', description: '允许已登录用户通过 @slug 找到当前团队。', type: 'boolean', control: 'switch', order: 10, default: false, value: false },
          { key: 'member_searchable', label: '成员默认可搜索', description: '成员未设置个人覆盖值时采用此默认值。', type: 'boolean', control: 'switch', order: 20, default: false, value: false },
          { key: 'member_search_priority', label: '搜索优先级', description: '决定团队默认值与成员显式设置冲突时采用哪一个。', type: 'enum', control: 'radio', order: 30, default: 'team', value: 'team', options: [
            { value: 'team', label: '团队优先', description: '团队关闭搜索时，所有成员均不可被搜索。' },
            { value: 'member', label: '成员优先', description: '成员的显式设置可以覆盖团队默认值。' },
          ] },
        ],
      }],
    }
    else if (url.pathname.endsWith('/setting')) data = { team_searchable: false, member_searchable: false, member_search_priority: 'team' }
    else if (url.pathname.endsWith('/me/get')) data = { id: 1, user_id: 1, nickname: '测试成员' }
    else if (url.pathname.endsWith('/join/form')) data = []
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })
  for (const path of ['/', '/members', '/member-add', '/member-edit?id=1', '/roles', '/roles/new', '/posts', '/fields', '/notice', '/notice-detail?id=21', '/files', '/docs', '/doc-create', '/doc-edit?id=11', '/doc?id=11', '/settings', '/join-review', '/join-review/review?id=1', '/me']) {
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
    if (path === '/notice') {
      await expect(page.getByRole('link', { name: /维护窗口提醒/ })).toHaveAttribute('href', '/notice-detail?id=21')
      await expect(page.getByText('置顶', { exact: true })).toBeVisible()
      await expect(page.locator('.notice-detail-view')).toHaveCount(0)
    }
    if (path === '/notice-detail?id=21') {
      await expect(page.getByRole('heading', { name: '维护窗口提醒', level: 1 })).toBeVisible()
      await expect(page.getByText('请提前保存正在处理的内容。')).toBeVisible()
      await expect(page.getByRole('link', { name: '返回站内信列表' })).toHaveAttribute('href', '/notice')
      await expect(page.getByText('已确认', { exact: true })).toBeVisible()
      expect(noticeConfirmRequests).toBe(1)
    }
    if (path === '/doc-create') {
      await expect(page.getByRole('heading', { name: '新建文档', level: 2 })).toBeVisible()
      await expect(page.locator('.mode-tabs > button').filter({ hasText: '可视化' })).toBeVisible()
      await expect(page.locator('.mode-tabs > button').filter({ hasText: '源码' })).toBeVisible()
      await expect(page.locator('.mode-tabs > button').filter({ hasText: '预览' })).toBeVisible()
      await expect(page.locator('dialog')).toHaveCount(0)
      const mentionButton = page.getByRole('button', { name: '引用团队或成员' })
      await expect(mentionButton).toBeVisible()
      await expect(mentionButton).toHaveClass(/top-bar-item/)
      expect(await mentionButton.evaluate((button) => button.nextElementSibling?.classList.contains('top-bar-item'))).toBe(true)
      const toolbarIcon = page.locator('.milkdown-top-bar .top-bar-item svg').first()
      await expect(toolbarIcon).toBeVisible()
      await expect(page.locator('.milkdown-top-bar .top-bar-heading-button')).toContainText('段落')
      const toolbarIconColor = await toolbarIcon.evaluate((element) => getComputedStyle(element).color)
      const inkColor = await page.evaluate(() => {
        const sample = document.createElement('span')
        sample.style.color = 'var(--ink)'
        document.body.append(sample)
        const color = getComputedStyle(sample).color
        sample.remove()
        return color
      })
      expect(toolbarIconColor).toBe(inkColor)
      const visibilitySelect = page.locator('label.field').filter({ hasText: '可见范围' }).locator('.n-select')
      await visibilitySelect.click()
      await expect(page.locator('.n-base-select-option').filter({ hasText: '团队管理员可见' }).first()).toBeVisible()
      await expect(page.locator('.n-base-select-option').filter({ hasText: '团队管理员可见，不含成员本人' })).toHaveCount(0)
      await page.keyboard.press('Escape')
      const editor = page.locator('.ls-markdown-editor .ProseMirror').first()
      await mentionButton.dispatchEvent('pointerdown', { button: 0, buttons: 1, pointerId: 1, pointerType: 'mouse', isPrimary: true })
      await expect(page.locator('.picker-status')).toContainText('继续输入至少 2 个字符')
      await editor.pressSequentially('al')
      await expect(page.locator('.entity-picker [role="option"]')).toContainText('@alice')
      await page.keyboard.press('Enter')
      await page.locator('.mode-tabs > button').filter({ hasText: '源码' }).click()
      await expect(page.locator('.ls-markdown-editor textarea')).toHaveValue(/\[@测试成员\]\(lostsky:\/\/entity\/alice\)/)
    }
    if (path === '/member-edit?id=1') {
      await expect(page.getByRole('heading', { name: '对象身份设置' })).toBeVisible()
      await expect(page.getByText('@alice')).toBeVisible()
      await expect(page.getByText('管理员入口', { exact: true })).toBeVisible()
    }
    if (path === '/settings') {
      await expect(page.getByRole('heading', { name: '对象搜索', level: 2 })).toBeVisible()
      await expect(page.getByRole('switch', { name: '团队自身可搜索' })).toBeVisible()
      await expect(page.getByRole('switch', { name: '成员默认可搜索' })).toBeVisible()
      await expect(page.getByRole('radio', { name: /团队优先/ })).toBeChecked()
      await expect(page.getByText('成员优先', { exact: true })).toBeVisible()
      await page.getByText('成员优先', { exact: true }).click()
      await expect(page.getByRole('radio', { name: /成员优先/ })).toBeChecked()
    }
    if (path === '/me') {
      await expect(page.getByRole('heading', { name: '我的对象标识' })).toBeVisible()
      await expect(page.getByText('本人入口', { exact: true })).toBeVisible()
      await expect(page.getByText('管理员入口', { exact: true })).toHaveCount(0)
    }
    if (path === '/doc?id=11') {
      await expect(page.locator('[data-entity-slug="alice"]')).toBeVisible()
      await expect(page.locator('a[href^="lostsky://"]')).toHaveCount(0)
      expect(await page.evaluate(() => (window as typeof window & { __lostskyXss?: number }).__lostskyXss)).toBeUndefined()
    }
    if (path === '/docs' && await page.locator('.document-list article').count() === 2) {
      await expect(page.getByText('这份文档还没有正文。')).toBeVisible()
      await expect(page.locator('dialog')).toHaveCount(0)
      if ((page.viewportSize()?.width ?? 0) >= 720) {
        const footerTops = await page.locator('.document-list article footer').evaluateAll((footers) => footers.map((footer) => footer.getBoundingClientRect().top))
        if (footerTops.length === 2) expect(Math.abs(footerTops[0] - footerTops[1])).toBeLessThan(1)
      }
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow, `horizontal overflow at ${path}`).toBe(false)
  }

  await page.goto('http://127.0.0.1:5175/notice-detail')
  await expect(page.getByRole('alert')).toContainText('缺少有效的站内信编号')
  await page.goto('http://127.0.0.1:5175/notice-detail?id=404')
  await expect(page.getByRole('alert')).toContainText('站内信不存在')
  emptyNotices = true
  await page.goto('http://127.0.0.1:5175/notice')
  await expect(page.getByRole('heading', { name: '目前没有站内信' })).toBeVisible()
})
