import { test, expect, type Page } from './fixtures'
const origin = 'http://127.0.0.1:5182'
const entity = { id: 9, slug: 'sky-person', name: '青空同学', is_valid: true, avatar: null }
const timestamp = 1791331200
const originalCommunity = { id: 1, slug: 'sky', name: '青空交流社区', description: '一起交流经验与想法', owner_type: 'Platform', team_id: null, owner: null, is_official: true, status: 'Active', entity_id: 9, is_joined: true, is_muted: false, mute_reason: '', can_manage: true, team_available: true, create_time: timestamp, update_time: timestamp }
const originalPost = { id: 11, community_id: 1, board_id: 1, author_entity_id: 9, author: entity, title: '一起交流经验', content: '**欢迎**参与讨论', status: 'Visible', hidden_reason: '', pinned: false, like_count: 0, comment_count: 0, is_liked: false, can_edit: true, create_time: timestamp, update_time: timestamp }
async function setup(page: Page, options: { guest?: boolean; joined?: boolean; muted?: boolean; paused?: boolean; hidden?: boolean; boardDisabled?: boolean; failure?: boolean } = {}) {
  if (!options.guest) await page.addInitScript(() => localStorage.setItem('lostsky_token', 'community-fixture'))
  const community = { ...originalCommunity, entity_id: options.guest ? null : 9, can_manage: !options.guest, is_joined: !options.guest && options.joined !== false, is_muted: Boolean(options.muted), mute_reason: options.muted ? '请勿重复推广' : '', status: options.paused ? 'Paused' : 'Active' }
  let post = { ...originalPost, status: options.hidden ? 'Hidden' : 'Visible', hidden_reason: options.hidden ? '不符合板块主题' : '', content: options.hidden ? '' : originalPost.content, can_edit: !options.guest && !options.hidden }
  let comments: Record<string, unknown>[] = []
  let boards = [{ id: 1, community_id: 1, name: '经验交流', enabled: !options.boardDisabled, sort: 0 }]
  let announcements = [{ id: 1, community_id: 1, title: '欢迎来到社区', content: '请友善交流', pinned: true }]
  const writes: { path: string; body: Record<string, unknown> }[] = []
  let failure = Boolean(options.failure)
  const pageData = (list: unknown[]) => ({ list, total: list.length, page: 1, limit: 20 })
  await page.route(`${origin}/api/**`, async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname.replace('/api', '')
    const body = request.method() === 'POST' ? request.postDataJSON() as Record<string, unknown> : {}
    if (request.method() === 'POST') writes.push({ path, body })
    let data: unknown
    if (path === '/session') data = { entity, upload_team_slug: 'demo' }
    else if (path === '/communities' || path === '/mine') data = pageData([community])
    else if (path === '/communities/sky') data = community
    else if (path === '/communities/sky/join' || path === '/communities/sky/leave') { community.is_joined = path.endsWith('/join'); data = community }
    else if (path === '/communities/sky/boards') data = pageData(boards)
    else if (path === '/communities/sky/announcements') data = pageData(announcements)
    else if (path === '/communities/sky/posts' && request.method() === 'POST') { post = { ...post, ...body } as typeof post; data = post }
    else if (path === '/communities/sky/posts') {
      if (failure) { failure = false; return route.fulfill({ status: 400, json: { code: 400, message: '列表暂时不可用', data: null } }) }
      data = pageData(options.hidden ? [] : [post])
    }
    else if (path === '/communities/sky/posts/11' && request.method() === 'POST') { post = { ...post, ...body } as typeof post; data = post }
    else if (path === '/communities/sky/posts/11') data = post
    else if (path === '/communities/sky/posts/11/delete') { post.status = 'Deleted'; post.content = ''; post.can_edit = false; data = post }
    else if (path === '/communities/sky/posts/11/like') { post.is_liked = Boolean(body.liked); post.like_count = post.is_liked ? 1 : 0; data = post }
    else if (path === '/communities/sky/posts/11/comments' && request.method() === 'POST') { comments.push({ ...originalPost, id: 21, post_id: 11, content: body.content }); post.comment_count = comments.length; data = comments[0] }
    else if (path === '/communities/sky/posts/11/comments') data = pageData(comments)
    else if (path === '/communities/sky/comments/21') { comments[0].content = body.content; data = comments[0] }
    else if (path === '/communities/sky/comments/21/delete') { comments[0].status = 'Deleted'; comments[0].content = ''; comments[0].can_edit = false; data = comments[0] }
    else if (path === '/communities/sky/manage/boards') data = pageData(boards)
    else if (path === '/communities/sky/manage/boards/1' && request.method() === 'GET') data = boards[0]
    else if (path === '/communities/sky/manage/boards/1') { boards[0] = { ...boards[0], ...body } as typeof boards[0]; data = boards[0] }
    else if (path === '/communities/sky/manage/boards/0') { boards.push({ ...boards[0], id: 2, ...body } as typeof boards[0]); data = boards[1] }
    else if (path === '/communities/sky/manage/announcements') data = pageData(announcements)
    else if (path === '/communities/sky/manage/announcements/1' && request.method() === 'GET') data = announcements[0]
    else if (path === '/communities/sky/manage/announcements/1') { announcements[0] = { ...announcements[0], ...body } as typeof announcements[0]; data = announcements[0] }
    else if (path === '/communities/sky/manage/posts') data = pageData([post])
    else if (path === '/communities/sky/manage/posts/11/moderate') { if ('hidden' in body) { post.status = body.hidden ? 'Hidden' : 'Visible'; post.hidden_reason = String(body.reason) }; if ('pinned' in body) post.pinned = Boolean(body.pinned); data = post }
    else if (path === '/communities/sky/manage/comments') data = pageData(comments)
    else if (path === '/communities/sky/manage/members') data = pageData([{ entity_id: 9, entity, joined: true, muted: community.is_muted, reason: community.mute_reason, create_time: timestamp }])
    else if (path === '/communities/sky/manage/members/9/mute') { community.is_muted = Boolean(body.muted); community.mute_reason = String(body.reason); data = {} }
    else throw new Error(`Unmocked community API: ${request.method()} ${path}`)
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
  return { writes, community }
}
async function markdown(page: Page, text: string) { if (await page.getByRole('button', { name: '写评论', exact: true }).count() && !await page.getByRole('tab', { name: '源码', exact: true }).count()) await page.getByRole('button', { name: '写评论', exact: true }).click(); await page.getByRole('tab', { name: '源码', exact: true }).click(); await page.getByRole('textbox', { name: 'Markdown 源码' }).fill(text) }
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true) }

test('Community guest browses square and content, keeps identity read-only and explains write boundary', async ({ page }) => {
  const { writes } = await setup(page, { guest: true })
  await page.goto(origin)
  await page.getByRole('link', { name: '青空交流社区', exact: true }).click()
  await expect(page.getByRole('heading', { name: '青空交流社区' })).toBeVisible()
  await expect(page.getByRole('link', { name: '登录并选择身份' })).toHaveAttribute('href', /login\?redirect=/)
  expect(writes).toHaveLength(0)
  await page.getByRole('link', { name: '一起交流经验', exact: true }).click()
  await expect(page.getByText('参与讨论', { exact: false }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: '登录', exact: true })).toHaveAttribute('href', /5174\/login\?redirect=/)
  await noOverflow(page)
})
test('Community joins, publishes Markdown, edits own post, comments, likes and deletes with actor snapshot', async ({ page }) => {
  const { writes } = await setup(page, { joined: false })
  await page.goto(`${origin}/c/sky`)
  await page.getByRole('button', { name: '加入社区', exact: true }).press('Enter')
  await expect(page.getByRole('button', { name: '退出社区', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '发布帖子', exact: true }).press('Enter')
  await expect(page.locator('#post-board')).toContainText('经验交流')
  await page.getByRole('textbox', { name: '标题', exact: true }).fill('新的讨论')
  await markdown(page, '这是 **新帖子**')
  await page.getByRole('button', { name: '发布帖子', exact: true }).press('Enter')
  await expect(page.getByRole('heading', { name: '新的讨论', exact: true })).toBeVisible()
  await page.getByRole('link', { name: '编辑帖子' }).click()
  await page.getByRole('textbox', { name: '标题', exact: true }).fill('更新后的讨论')
  await page.getByRole('button', { name: '保存修改' }).click()
  await expect(page.getByRole('heading', { name: '更新后的讨论' })).toBeVisible()
  await page.getByRole('button', { name: '点赞 · 0', exact: true }).click()
  await expect(page.getByRole('button', { name: '取消点赞 · 1', exact: true })).toBeVisible()
  await markdown(page, '第一条评论')
  await page.getByRole('button', { name: '发表评论', exact: true }).press('Enter')
  await expect(page.getByText('第一条评论', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '编辑评论' }).click()
  await page.getByRole('textbox', { name: 'Markdown 源码' }).fill('修改后的评论')
  await page.getByRole('button', { name: '保存评论' }).click()
  await expect(page.getByText('修改后的评论', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '删除评论', exact: true }).click()
  await page.getByRole('button', { name: '确认删除', exact: true }).click()
  await expect(page.getByText('作者已删除此内容', { exact: true })).toBeVisible()
  expect(writes.every(write => write.body.expected_entity_id === 9)).toBe(true)
  await noOverflow(page)
})
test('Community retains list filters on detail return and shows recoverable request errors', async ({ page }) => {
  await setup(page, { failure: true })
  await page.goto(`${origin}/c/sky`)
  await expect(page.getByText('列表暂时不可用')).toBeVisible()
  await page.getByRole('link', { name: '社区广场', exact: true }).first().click()
  await page.getByRole('link', { name: '青空交流社区', exact: true }).click()
  await page.getByRole('searchbox', { name: '搜索帖子' }).fill('经验')
  await page.getByRole('link', { name: '一起交流经验', exact: true }).click()
  await page.getByRole('link', { name: '返回', exact: true }).click()
  await expect(page.getByRole('searchbox', { name: '搜索帖子' })).toHaveValue('经验')
})
test('Community muted and paused states explain separate restrictions and hide author-hidden body', async ({ page }) => {
  const { writes } = await setup(page, { muted: true, hidden: true })
  await page.goto(`${origin}/c/sky/posts/11`)
  await expect(page.getByText('处理原因：不符合板块主题')).toBeVisible()
  await expect(page.getByText('参与讨论', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '写评论', exact: true }).press('Enter')
  await expect(page.getByText('你在此社区被禁言：请勿重复推广', { exact: true }).first()).toBeVisible()
  expect(writes).toHaveLength(0)
})
test('Community paused community and disabled board keep browsing but prevent posting', async ({ page }) => {
  const { writes } = await setup(page, { paused: true, boardDisabled: true })
  await page.goto(`${origin}/c/sky/posts/new`)
  await page.getByRole('button', { name: '发布帖子', exact: true }).press('Enter')
  await expect(page.getByText('社区已暂停，暂时不能加入或互动', { exact: true }).first()).toBeVisible()
  expect(writes).toHaveLength(0)
})
test('Community administrator manages board, announcement, hidden content, pinning and mute', async ({ page }) => {
  const { writes } = await setup(page)
  await page.goto(`${origin}/c/sky/manage/boards/1`)
  await page.getByRole('textbox', { name: '板块名称' }).fill('常见问题')
  await page.locator('#board-sort').fill('')
  await page.getByRole('button', { name: '保存板块' }).press('Enter')
  expect(writes).toHaveLength(0)
  await page.locator('#board-sort').fill('3')
  await page.getByRole('button', { name: '保存板块' }).press('Enter')
  await expect(page.getByText('常见问题', { exact: true })).toBeVisible()
  await page.getByRole('tab', { name: '公告', exact: true }).click()
  await page.getByRole('link', { name: '编辑公告', exact: true }).click()
  await page.getByRole('textbox', { name: '公告标题' }).fill('社区规则')
  await page.getByRole('button', { name: '保存公告' }).click()
  await expect(page.getByText('社区规则', { exact: true })).toBeVisible()
  await page.getByRole('tab', { name: '帖子', exact: true }).click()
  await page.getByRole('button', { name: '隐藏内容', exact: true }).click()
  await page.getByRole('textbox', { name: '处理原因' }).fill('重复主题')
  await page.getByRole('button', { name: '确认', exact: true }).click()
  await expect(page.getByRole('button', { name: '恢复内容', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '恢复内容', exact: true }).click(); await page.getByRole('button', { name: '确认', exact: true }).click()
  await page.getByRole('button', { name: '置顶帖子', exact: true }).click(); await page.getByRole('button', { name: '确认', exact: true }).click()
  await expect(page.getByRole('button', { name: '取消置顶', exact: true })).toBeVisible()
  await page.getByRole('tab', { name: '成员', exact: true }).click()
  await page.getByRole('button', { name: '禁言', exact: true }).click(); await page.getByRole('textbox', { name: '处理原因' }).fill('重复推广'); await page.getByRole('button', { name: '确认', exact: true }).click()
  await expect(page.getByText('禁言原因：重复推广')).toBeVisible()
  await page.getByRole('button', { name: '解除禁言', exact: true }).click(); await page.getByRole('button', { name: '确认', exact: true }).click()
  await expect(page.getByRole('button', { name: '禁言', exact: true })).toBeVisible()
  expect(writes.every(write => write.body.expected_entity_id === 9)).toBe(true)
  await noOverflow(page)
})
test('Community rejects a stale identity before submitting and explains disabled boards', async ({ page }) => {
  const { writes } = await setup(page, { boardDisabled: true })
  await page.goto(`${origin}/c/sky/posts/new`)
  await page.getByRole('textbox', { name: '标题', exact: true }).fill('需要一个可用板块')
  await markdown(page, '正文')
  await page.getByRole('button', { name: '发布帖子', exact: true }).press('Enter')
  await expect(page.getByText('当前没有启用的板块，暂时不能发布帖子', { exact: true })).toBeVisible()
  page.on('dialog', dialog => dialog.accept())
  await page.getByRole('link', { name: '返回', exact: true }).click()
  await page.getByRole('link', { name: '一起交流经验', exact: true }).click()
  await expect(page.getByRole('button', { name: '点赞 · 0', exact: true })).toBeVisible()
  await page.evaluate(() => {
    const token = `fixture.${btoa(JSON.stringify({ uid: 2, act: { type: 'teamMember', id: 88 } }))}.signature`
    localStorage.setItem('lostsky_token', token); document.cookie = `lostsky_token=${token}; path=/`
  })
  await page.getByRole('button', { name: '点赞 · 0', exact: true }).click()
  await expect(page.locator('.n-message__content').getByText('当前登录身份已在其他页面改变，请刷新页面后重新操作。', { exact: true })).toBeVisible()
  expect(writes).toHaveLength(0)
})
test('Community keeps controls and long headings within 320–1440px and enlarged text', async ({ page }) => {
  const { community } = await setup(page)
  community.name = '这是一个使用较长中文名称来交流日常协作经验的社区'
  await page.goto(`${origin}/c/sky`)
  await expect(page.getByRole('heading', { name: community.name })).toBeVisible()
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await noOverflow(page)
    const target = await page.getByRole('button', { name: '发布帖子', exact: true }).boundingBox()
    expect(target!.height).toBeGreaterThanOrEqual(44)
    expect(target!.x + target!.width).toBeLessThanOrEqual(width)
  }
  await page.setViewportSize({ width: 375, height: 900 })
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  await noOverflow(page)
})


test('Community draft survives joining, failed submission and background data refresh', async ({ page }) => {
  const { writes } = await setup(page, { joined: false })
  await page.goto(`${origin}/c/sky/posts/new`)
  await page.getByRole('textbox', { name: '标题', exact: true }).fill('不能丢失的新讨论')
  await markdown(page, '加入之前写好的正文')
  await page.getByRole('button', { name: '加入社区', exact: true }).click()
  await expect(page.getByRole('button', { name: '加入社区', exact: true })).toHaveCount(0)
  await expect(page.getByRole('textbox', { name: '标题', exact: true })).toHaveValue('不能丢失的新讨论')
  await expect(page.getByRole('textbox', { name: 'Markdown 源码' })).toHaveValue('加入之前写好的正文')
  await page.route(`${origin}/api/communities/sky/posts`, async route => {
    if (route.request().method() === 'POST') await route.fulfill({ status: 400, json: { code: 400, message: '暂时无法保存，请稍后提交', data: null } })
    else await route.fallback()
  })
  await page.getByRole('button', { name: '发布帖子', exact: true }).click()
  await expect(page.getByText('暂时无法保存，请稍后提交', { exact: true })).toBeVisible()
  await expect(page.getByRole('textbox', { name: '标题', exact: true })).toHaveValue('不能丢失的新讨论')
  await expect(page.getByRole('textbox', { name: 'Markdown 源码' })).toHaveValue('加入之前写好的正文')
  page.once('dialog', dialog => dialog.dismiss())
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await expect(page).toHaveURL(`${origin}/c/sky/posts/new`)
  await page.unroute(`${origin}/api/communities/sky/posts`)
  await page.getByRole('button', { name: '发布帖子', exact: true }).click()
  await expect(page.getByRole('heading', { name: '不能丢失的新讨论', exact: true })).toBeVisible()
  expect(writes.find(write => write.path === '/communities/sky/posts')?.body.content).toBe('加入之前写好的正文')
  await page.getByRole('link', { name: '编辑帖子', exact: true }).click()
  await page.getByRole('textbox', { name: '标题', exact: true }).fill('编辑中保留这个标题')
  let reads = 0
  await page.route(`${origin}/api/communities/sky/posts/11`, async route => {
    if (route.request().method() !== 'GET') return route.fallback()
    reads++
    await route.fulfill({ json: { code: 0, data: { ...originalPost, title: '另一个页面已经保存的标题' } } })
  })
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')))
  await expect.poll(() => reads).toBeGreaterThan(0)
  await expect(page.getByRole('textbox', { name: '标题', exact: true })).toHaveValue('编辑中保留这个标题')
})

test('Community failed image upload and comment submission preserve the discussion draft', async ({ page }) => {
  await setup(page)
  let uploads = 0
  await page.route(`${origin}/api/upload`, async route => {
    uploads++
    await route.fulfill({ status: 400, json: { code: 400, message: '图片上传失败，请稍后再试', data: null } })
  })
  await page.goto(`${origin}/c/sky/posts/11`)
  await page.getByRole('button', { name: '写评论', exact: true }).click()
  await markdown(page, '图片失败也保留这段评论')
  await page.getByRole('tab', { name: '可视化', exact: true }).click()
  const editor = page.locator('[contenteditable="true"]').first()
  await editor.click()
  await editor.evaluate(element => {
    const clipboard = new DataTransfer()
    clipboard.items.add(new File([new Uint8Array([137,80,78,71])], 'discussion.png', { type: 'image/png' }))
    element.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: clipboard }))
  })
  await expect.poll(() => uploads).toBe(1)
  await expect(page.getByRole('alert').filter({ hasText: '图片上传失败' })).toBeVisible()
  await page.getByRole('tab', { name: '源码', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Markdown 源码' })).toHaveValue(/图片失败也保留这段评论/)
  await page.route(`${origin}/api/communities/sky/posts/11/comments`, async route => {
    if (route.request().method() !== 'POST') return route.fallback()
    await route.fulfill({ status: 400, json: { code: 400, message: '评论暂时无法保存', data: null } })
  })
  await page.getByRole('button', { name: '发表评论', exact: true }).click()
  await expect(page.getByText('评论暂时无法保存', { exact: true })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Markdown 源码' })).toHaveValue(/图片失败也保留这段评论/)
})

test('Community design covers directory, announcements, keyboard boards, reading and editor geometry', async ({ page }, testInfo) => {
  await setup(page)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(origin)
  await expect(page.getByRole('link', { name: '青空交流社区', exact: true })).toBeVisible()
  for (const path of ['/', '/mine', '/c/sky', '/c/sky/posts/11', '/c/sky/posts/new', '/c/sky/manage/boards']) {
    await page.goto(`${origin}${path}`)
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 960 })
      await noOverflow(page)
    }
    await page.setViewportSize({ width: 375, height: 960 })
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    await noOverflow(page)
    await page.evaluate(() => { document.documentElement.style.fontSize = '' })
  }
  await page.goto(`${origin}/c/sky`)
  await expect(page.getByText('请友善交流', { exact: true })).toBeVisible()
  const tabs = page.getByRole('tablist', { name: '社区板块' })
  await tabs.getByRole('tab', { name: '全部讨论', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(tabs.getByRole('tab', { name: '经验交流', exact: true })).toHaveAttribute('aria-selected', 'true')
  const tabBox = await tabs.getByRole('tab', { name: '经验交流', exact: true }).boundingBox()
  expect(tabBox!.height).toBeGreaterThanOrEqual(44)
  await page.screenshot({ path: testInfo.outputPath('community-home.png'), fullPage: true })
  await page.getByRole('link', { name: '一起交流经验', exact: true }).click()
  await expect(page.getByRole('tab', { name: '源码', exact: true })).toHaveCount(0)
  await page.setViewportSize({ width: 1440, height: 960 })
  const articleBox = await page.locator('.community-reading').boundingBox()
  expect(articleBox!.width).toBeLessThan(850)
  const headingBox = await page.getByRole('heading', { level: 1 }).boundingBox()
  expect(Math.abs(headingBox!.x - articleBox!.x)).toBeLessThanOrEqual(1)
  const skip = page.getByRole('link', { name: '跳到主要内容', exact: true })
  expect((await skip.boundingBox())!.y).toBeLessThan(0)
  await skip.focus()
  expect((await skip.boundingBox())!.y).toBeGreaterThanOrEqual(0)
  await skip.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
  await page.screenshot({ path: testInfo.outputPath('community-reading.png'), fullPage: true })
  await page.getByRole('button', { name: '写评论', exact: true }).click()
  await expect(page.getByRole('region', { name: '评论编辑区' })).toBeFocused()
  expect(errors).toEqual([])
})


test('Community comment cancellation confirms once and preserves the editor when declined', async ({ page }) => {
  await setup(page)
  await page.goto(`${origin}/c/sky/posts/11`)
  await expect(page.getByRole('button', { name: '写评论', exact: true })).toBeVisible()
  await markdown(page, '不要因为取消而丢失')
  let confirmations = 0, accept = false
  page.on('dialog', async dialog => { confirmations++; if (accept) await dialog.accept(); else await dialog.dismiss() })
  await page.getByRole('region', { name: '评论编辑区' }).getByRole('button', { name: '取消', exact: true }).click()
  expect(confirmations).toBe(1)
  await expect(page.getByRole('textbox', { name: 'Markdown 源码' })).toHaveValue('不要因为取消而丢失')
  accept = true
  await page.getByRole('region', { name: '评论编辑区' }).getByRole('button', { name: '取消', exact: true }).click()
  expect(confirmations).toBe(2)
  await expect(page.getByRole('region', { name: '评论编辑区' })).toHaveCount(0)
  await page.getByRole('button', { name: '写评论', exact: true }).click()
  await markdown(page, '')
  await expect(page.getByRole('textbox', { name: 'Markdown 源码' })).toHaveValue('')
})


test('Community governance retains keyboard focus across consecutive routed tabs', async ({ page }) => {
  await setup(page)
  await page.goto(`${origin}/c/sky/manage/boards`)
  const tabs = page.getByRole('tablist', { name: '社区管理分区' })
  await tabs.getByRole('tab', { name: '板块', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page).toHaveURL(`${origin}/c/sky/manage/announcements`)
  await expect(tabs.getByRole('tab', { name: '公告', exact: true })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(page).toHaveURL(`${origin}/c/sky/manage/posts`)
  await expect(tabs.getByRole('tab', { name: '帖子', exact: true })).toBeFocused()
  await expect(tabs.getByRole('tab', { name: '帖子', exact: true })).toHaveAttribute('aria-selected', 'true')
})
