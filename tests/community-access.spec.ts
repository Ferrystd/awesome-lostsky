import { test, expect, type Page } from './fixtures'

const communityOrigin = 'http://community.lostsky.work:5182'
const accountOrigin = 'http://account.lostsky.work:5174'
const teamOrigin = 'http://demo.team.lostsky.work:5175'
const shopOrigin = 'http://demo.shop.lostsky.work:5179'
type ActorType = 'teamMember' | 'teamCustomer'
const people = {
  teamMember: { id: 101, type: 'teamMember', slug: 'internal-person', name: '内部成员', team: { id: 1, slug: 'demo', name: '本团队' } },
  teamCustomer: { id: 202, type: 'teamCustomer', slug: 'external-customer', name: '外部顾客', team: { id: 1, slug: 'demo', name: '当前商家' } },
}
const token = (type: ActorType | null) => `fixture.${Buffer.from(JSON.stringify({ uid: 71, act: type ? { type, id: people[type].id } : null })).toString('base64url')}.signature`
const list = (items: unknown[]) => ({ list: items, total: items.length, page: 1, limit: 20 })

async function setup(page: Page, initial: ActorType | null, authenticated = true) {
  let actor = initial
  let joined = false
  let post = { id: 11, community_id: 1, board_id: 1, author: people.teamMember, title: '公开讨论', content: '欢迎所有人员参与', status: 'Visible', hidden_reason: '', pinned: false, is_liked: false, like_count: 0, comment_count: 0, create_time: 1791331200, update_time: 1791331200 }
  const comments: unknown[] = []
  const writes: { path: string; body: Record<string, unknown>; authorization: string }[] = []
  const reads: string[] = []
  if (authenticated) await page.context().addCookies([{ name: 'lostsky_token', value: token(actor), domain: '.lostsky.work', path: '/' }])
  await page.route(`${communityOrigin}/api/**`, async route => {
    const request = route.request(), path = new URL(request.url()).pathname.replace('/api', '')
    const body = request.method() === 'POST' ? request.postDataJSON() : {}
    if (request.method() === 'POST') writes.push({ path, body, authorization: request.headers().authorization })
    else reads.push(path)
    const entity = actor ? people[actor] : null
    const community = { id: 1, slug: 'public', name: '共同交流', description: '', owner_type: 'Platform', team_id: null, owner: null, is_official: true, status: 'Active', entity_id: entity?.id ?? null, is_joined: joined, is_muted: false, can_manage: false, team_available: true }
    let data: unknown
    if (path === '/session') data = { entity, upload_team_slug: entity?.team.slug ?? null }
    else if (path === '/communities') data = list([community])
    else if (path === '/mine') data = list(joined ? [community] : [])
    else if (path === '/communities/public') data = community
    else if (path === '/communities/public/boards') data = list([{ id: 1, name: '日常交流', enabled: true }])
    else if (path === '/communities/public/announcements') data = list([])
    else if (path === '/communities/public/join') { joined = true; data = {} }
    else if (path === '/communities/public/posts' && request.method() === 'POST') { post = { ...post, ...body }; data = post }
    else if (path === '/communities/public/posts') data = list([post])
    else if (path === '/communities/public/posts/11') data = { ...post, author: entity ?? people.teamMember, can_edit: Boolean(entity) }
    else if (path === '/communities/public/posts/11/like') { post.is_liked = body.liked; post.like_count = body.liked ? 1 : 0; data = post }
    else if (path === '/communities/public/posts/11/comments' && request.method() === 'POST') { comments.push({ id: 22, content: body.content, author: entity, status: 'Visible', create_time: 1791331200 }); data = {} }
    else if (path === '/communities/public/posts/11/comments') data = list(comments)
    else throw new Error(`Missing community fixture: ${path}`)
    await route.fulfill({ json: { code: 0, data } })
  })
  await page.route(`${accountOrigin}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '')
    let data: unknown
    if (path === '/login/password') data = { token: token(null) }
    else if (path === '/identity/candidates') data = actor ? [] : Object.values(people)
    else if (path === '/identity/drop') { actor = null; data = { token: token(null) } }
    else if (path === '/identity/receive') {
      const slug = route.request().postDataJSON().slug
      actor = Object.keys(people).find(key => people[key as ActorType].slug === slug) as ActorType
      data = { token: token(actor), identity: people[actor] }
    } else if (path === '/team/index') data = []
    else if (path === '/team/join-code') data = { code: '123456', expires_at: Math.floor(Date.now() / 1000) + 600 }
    else throw new Error(`Missing account fixture: ${path}`)
    await route.fulfill({ json: { code: 0, data } })
  })
  return { reads, writes }
}

async function source(page: Page, content: string) {
  if (await page.getByRole('button', { name: '写评论', exact: true }).count() && !await page.getByRole('tab', { name: '源码', exact: true }).count()) await page.getByRole('button', { name: '写评论', exact: true }).click()
  await page.getByRole('tab', { name: '源码', exact: true }).click()
  await page.getByRole('textbox', { name: 'Markdown 源码' }).fill(content)
}

for (const type of ['teamMember', 'teamCustomer'] as const) {
  test(`Community ${type} discovers from its workspace and joins, posts, comments and likes`, async ({ page, isMobile }) => {
    const { writes } = await setup(page, type)
    if (type === 'teamMember') {
      await page.route(`${teamOrigin}/api/**`, async route => {
        const path = new URL(route.request().url()).pathname.replace('/api', '')
        const data = path === '/access' ? { permissions: [], abilities: {}, identity: { type, is_external: false } }
          : path === '/notice/index' ? list([]) : undefined
        if (data === undefined) throw new Error(`Missing team fixture: ${path}`)
        await route.fulfill({ json: { code: 0, data } })
      })
      await page.goto(`${teamOrigin}/personal/notices`)
      if (isMobile) await page.getByRole('button', { name: '操作', exact: true }).click()
    } else {
      await page.route(`${shopOrigin}/api/**`, async route => {
        const path = new URL(route.request().url()).pathname.replace('/api', '')
        const data = path === '/customer/me' ? { id: 2, team_id: 1, is_blocked: 0, profile: { name: '外部顾客' }, identity: { slug: 'external-customer' } }
          : path === '/customer/orders' ? list([])
          : path === '/customer/balance' ? { balance: '0.00' } : undefined
        if (data === undefined) throw new Error(`Missing shop fixture: ${path}`)
        await route.fulfill({ json: { code: 0, data } })
      })
      await page.goto(`${shopOrigin}/orders`)
    }
    if (type === 'teamMember' && isMobile) await page.locator('.n-dropdown-menu:visible').getByText('社区', { exact: true }).click()
    else await page.getByRole('link', { name: '社区', exact: true }).click()
    await expect(page).toHaveURL(`${communityOrigin}/`)
    await expect(page.getByText(`当前人员：${people[type].name}`)).toBeVisible()
    await page.getByRole('link', { name: '共同交流', exact: true }).click()
    await page.getByRole('button', { name: '加入社区', exact: true }).click()
    await expect(page.getByRole('button', { name: '退出社区', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: '共同交流', exact: true })).toBeVisible()
    if (isMobile) await page.getByRole('button', { name: '发布帖子', exact: true }).tap()
    else await page.getByRole('button', { name: '发布帖子', exact: true }).click()
    await expect(page).toHaveURL(`${communityOrigin}/c/public/posts/new`)
    await expect(page.locator('#post-board')).toContainText('日常交流')
    await page.getByRole('textbox', { name: '标题', exact: true }).fill(`${people[type].name}的交流`)
    await source(page, '来自跨应用入口的帖子')
    await page.getByRole('button', { name: '发布帖子', exact: true }).click()
    await expect(page.getByRole('heading', { name: `${people[type].name}的交流` })).toBeVisible()
    await source(page, '跨身份类型评论')
    await page.getByRole('button', { name: '发表评论', exact: true }).click()
    await expect(page.getByText('跨身份类型评论', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '点赞 · 0', exact: true }).click()
    await expect(page.getByRole('button', { name: '取消点赞 · 1', exact: true })).toBeVisible()
    expect(writes.map(write => write.path)).toEqual(['/communities/public/join', '/communities/public/posts', '/communities/public/posts/11/comments', '/communities/public/posts/11/like'])
    expect(writes.every(write => write.body.expected_entity_id === people[type].id && write.authorization === `Bearer ${token(type)}`)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  })
}

test('Community guest logs in, receives customer identity and returns to the current SPA post', async ({ page }) => {
  await setup(page, null, false)
  await page.goto(communityOrigin)
  await page.getByRole('link', { name: '共同交流', exact: true }).click()
  await page.getByRole('link', { name: '公开讨论', exact: true }).click()
  await expect(page).toHaveURL(`${communityOrigin}/c/public/posts/11`)
  await expect(page.getByRole('heading', { name: '公开讨论', exact: true })).toBeVisible()
  await page.getByRole('link', { name: '登录', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${accountOrigin}/login\\?`))
  await page.getByRole('tab', { name: '密码登录' }).click()
  await page.locator('#login-account').fill('fixture-user')
  await page.locator('#login-password').fill('fixture-password')
  await page.getByRole('button', { name: '密码登录', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${accountOrigin}/identity\\?`))
  await page.locator('article').filter({ hasText: '@external-customer' }).getByRole('button').click()
  await expect(page.getByText('当前正在使用人员身份')).toBeVisible()
  await page.getByRole('link', { name: '前往页面' }).click()
  await expect(page).toHaveURL(`${communityOrigin}/c/public/posts/11`)
  await expect(page.getByText('当前人员：外部顾客')).toBeVisible()
})

test('Community no-identity list guides selection and Account switch returns without requiring a team', async ({ page }) => {
  const { reads } = await setup(page, null)
  await page.goto(communityOrigin)
  await page.getByRole('link', { name: '我加入的社区', exact: true }).click()
  await expect(page.getByText('选择人员身份后查看加入的社区', { exact: true })).toBeVisible()
  expect(reads).not.toContain('/mine')
  await page.getByRole('link', { name: '前往选择身份' }).click()
  await page.locator('article').filter({ hasText: '@internal-person' }).getByRole('button').click()
  await expect(page.getByText('当前正在使用人员身份')).toBeVisible()
  await page.getByRole('link', { name: '前往页面' }).click()
  await expect(page).toHaveURL(`${communityOrigin}/mine`)
  await expect(page.getByText('当前人员：内部成员')).toBeVisible()
  await page.getByRole('link', { name: '社区广场', exact: true }).click()
  await page.getByRole('link', { name: '共同交流', exact: true }).click()
  await page.getByRole('link', { name: '公开讨论', exact: true }).click()
  await expect(page).toHaveURL(`${communityOrigin}/c/public/posts/11`)
  await expect(page.getByRole('heading', { name: '公开讨论', exact: true })).toBeVisible()
  await page.getByRole('link', { name: '切换身份' }).click()
  await page.getByRole('button', { name: '放弃身份' }).click()
  await page.locator('article').filter({ hasText: '@external-customer' }).getByRole('button').click()
  await expect(page.getByText('当前正在使用人员身份')).toBeVisible()
  await page.getByRole('link', { name: '前往页面' }).click()
  await expect(page).toHaveURL(`${communityOrigin}/c/public/posts/11`)
  await expect(page.getByText('当前人员：外部顾客')).toBeVisible()
})
