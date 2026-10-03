import { expect, test, type Page } from '@playwright/test'
const chat = 'http://chat.lostsky.work:5176'
const team = 'http://demo.team.lostsky.work:5175'
const uuid = '123e4567-e89b-42d3-a456-426614174000'
const identityToken = (id = 11) => `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamMember', id } })).toString('base64url')}.x`
const alice = { id: 111, slug: 'alice', name: '青空成员', type: 'entity', avatar: null, team: { id: 1, slug: 'demo', name: '青空团队' } }
const bob = { id: 222, slug: 'bob', name: '外部伙伴', type: 'entity', avatar: null, team: { id: 2, slug: 'outside', name: '外部团队' } }
const conversation = { uuid, kind: 'direct', title: null, is_closed: false, is_temporary: false, participants: [alice, bob].map(person => ({ ...person, joined_at: 1, left_at: null, status: 'active' })), last_message: '你好', last_message_at: 1 }
const message = { id: 1, conversation: uuid, sender: bob, content: '跨团队历史消息', reply_id: null, edited_at: null, revoked_at: null, create_time: 1 }
async function authenticate(page: Page, id = 11) { await page.context().addCookies([{ name: 'lostsky_token', value: identityToken(id), domain: '.lostsky.work', path: '/', sameSite: 'Lax' }]) }
async function realtime(page: Page) { await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: 'window.Centrifuge=class{connect(){} disconnect(){} newSubscription(){return {on(){return this},subscribe(){},unsubscribe(){}}}}' })) }
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false) }

test('teamless Chat keeps one read-only identity and sends with expected Entity', async ({ page }) => {
  await authenticate(page); await realtime(page)
  const writes: Array<{ path: string; body: Record<string, unknown> }> = []
  await page.route(`${chat}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '')
    const body = route.request().method() === 'POST' ? route.request().postDataJSON() : null
    if (body) writes.push({ path, body })
    const data = path === '/actor' ? alice : path === '/conversation' ? [conversation] : path === '/message' ? [message] : path === '/message/send' ? { ...message, id: 2, sender: alice, content: body.content } : path === '/realtime/connect' ? { token: 'test', url: 'ws://example.test' } : path === '/realtime/subscribe' ? { token: 'test', channel: uuid } : null
    await route.fulfill({ json: { code: 0, data } })
  })
  await page.goto(`${chat}/?conversation=${uuid}`)
  await expect(page.getByRole('heading', { name: bob.name })).toBeVisible()
  await expect(page.getByRole('article').getByText(message.content)).toBeVisible()
  await expect(page.locator('.composer').getByRole('combobox')).toHaveCount(0)
  await expect(page.locator('.composer').getByRole('link', { name: '切换身份' })).toHaveAttribute('href', /account.lostsky.work:5174\/identity\?redirect=/)
  await page.getByPlaceholder('输入消息，Enter 发送').fill('发送测试')
  await page.getByRole('button', { name: '发送消息' }).click()
  await expect(page.getByText('发送测试', { exact: true })).toBeVisible()
  expect(writes.find(item => item.path === '/message/send')?.body).toEqual({ conversation: uuid, expected_entity_id: 111, content: '发送测试', reply_id: null })
  expect(writes.every(item => item.body.expected_entity_id === 111 && !('actor_slug' in item.body))).toBe(true)
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '屏蔽', exact: true }).click()
  await expect.poll(() => writes.find(item => item.path === '/block/create')?.body).toEqual({ entity_slug: 'bob', expected_entity_id: 111 })
  await expect(page.getByRole('article').getByText(message.content)).toBeVisible()
  await noOverflow(page)
})

test('legacy Chat address retains conversation and canonicalizes to teamless host', async ({ page }) => {
  await authenticate(page); await realtime(page)
  await page.route(`${chat}/api/**`, route => route.fulfill({ json: { code: 0, data: new URL(route.request().url()).pathname.endsWith('/actor') ? alice : [] } }))
  await page.goto(`http://demo.chat.lostsky.work:5176/new?participant=bob#latest`)
  await expect(page).toHaveURL(`${chat}/new?participant=bob#latest`)
})

test('Chat locates an exact cross-team Entity and creates one direct pair', async ({ page }) => {
  await authenticate(page); await realtime(page)
  let payload: Record<string, unknown> | undefined
  await page.route(`${chat}/api/**`, async route => {
    const url = new URL(route.request().url()); const path = url.pathname.replace('/api', '')
    let data: unknown = []
    if (path === '/actor') data = alice
    if (path === '/actor/search') { expect(url.searchParams.get('slug')).toBe('bob'); data = [bob] }
    if (path === '/conversation/create') { payload = route.request().postDataJSON(); data = { uuid } }
    await route.fulfill({ json: { code: 0, data } })
  })
  await page.goto(`${chat}/new?participant=bob`)
  await page.getByRole('listitem').filter({ hasText: '@bob' }).getByText('外部伙伴 · @bob').click()
  await page.getByRole('button', { name: '开始聊天' }).click()
  await expect.poll(() => payload).toEqual({ kind: 'direct', expected_entity_id: 111, participants: ['bob'] })
  await noOverflow(page)
})

test('Chat accepts invitations and removes blocks with current Entity', async ({ page }) => {
  await authenticate(page)
  let invitation = true; let blocked = true
  const writes: Array<Record<string, unknown>> = []
  await page.route(`${chat}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '')
    if (route.request().method() === 'POST') {
      writes.push(route.request().postDataJSON())
      if (path.endsWith('/accept')) invitation = false
      if (path.endsWith('/delete')) blocked = false
    }
    const data = path === '/actor' ? alice : path === '/conversation/invitation' ? (invitation ? [{ uuid, title: '项目群' }] : []) : path === '/block' ? (blocked ? [bob] : []) : null
    await route.fulfill({ json: { code: 0, data } })
  })
  await page.goto(`${chat}/requests`)
  await page.getByRole('button', { name: '接受', exact: true }).click()
  await expect(page.getByText('暂无群邀请')).toBeVisible()
  await page.getByRole('button', { name: '取消屏蔽' }).click()
  await expect(page.getByText('暂无屏蔽人员')).toBeVisible()
  expect(writes).toEqual([{ uuid, expected_entity_id: 111 }, { entity_slug: 'bob', expected_entity_id: 111 }])
  await noOverflow(page)
})

test('Chat identity change clears old messages and drafts before loading new identity', async ({ page }) => {
  await authenticate(page); await realtime(page)
  await page.route(`${chat}/api/**`, async route => {
    const second = route.request().headers().authorization?.includes(identityToken(22))
    const path = new URL(route.request().url()).pathname.replace('/api', '')
    const data = path === '/actor' ? (second ? bob : alice) : path === '/conversation' ? (second ? [] : [conversation]) : path === '/message' ? [message] : path === '/realtime/connect' ? { token: 'test', url: 'ws://example.test' } : path === '/realtime/subscribe' ? { token: 'test', channel: uuid } : null
    await route.fulfill({ json: { code: 0, data } })
  })
  await page.goto(`${chat}/?conversation=${uuid}`)
  await page.getByPlaceholder('输入消息，Enter 发送').fill('旧身份草稿')
  await authenticate(page, 22)
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(page.getByText('从第一段对话开始')).toBeVisible()
  await expect(page.getByText(message.content)).toHaveCount(0)
  await expect(page.locator('textarea')).toHaveCount(0)
})

test('Team manager creates and manages group without joining it', async ({ page }) => {
  await authenticate(page)
  const group = { ...conversation, kind: 'group', title: '支持群', participants: [{ ...bob, status: 'pending', left_at: null }, { ...bob, id: 333, slug: 'carol', name: '群成员', status: 'active', left_at: null }] }
  const writes: Array<{ path: string; body: Record<string, unknown> }> = []
  await page.route(`${team}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '')
    let data: unknown = []
    if (path === '/access') data = { team: alice.team, identity: { type: 'teamMember', entity_id: 111, belongs_to_team: true }, permissions: ['chat.group.manage'], abilities: {} }
    if (path === '/profile/get') data = { name: '青空团队' }
    if (path === '/chatGroup/get') data = group
    if (path === '/chatGroup/actors') data = [bob]
    if (path === '/chatGroup/messages') data = [message]
    if (path === '/chatGroup/index') data = [group]
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON(); writes.push({ path, body })
      if (path === '/chatGroup/create') data = group
      if (path === '/chatGroup/update') group.title = body.title
      if (path === '/chatGroup/invitation/cancel' || path === '/chatGroup/participant/remove') group.participants = group.participants.filter(person => person.slug !== body.entity_slug)
      if (path === '/chatGroup/close') group.is_closed = true
    }
    await route.fulfill({ json: { code: 0, data } })
  })
  await page.goto(`${team}/chat-groups/new`)
  await page.getByRole('textbox', { name: '群聊名称' }).fill('支持群')
  await page.getByRole('textbox', { name: '人员', exact: true }).fill('外部伙伴')
  await page.getByRole('button', { name: '查找人员' }).click()
  await page.getByRole('listitem').filter({ hasText: '@bob' }).getByText('外部伙伴 · @bob').click()
  await page.getByRole('button', { name: '创建并发送邀请' }).click()
  await expect(page).toHaveURL(`${team}/chat-groups/${uuid}`)
  expect(writes[0].body).toMatchObject({ expected_entity_id: 111, participants: ['bob'], title: '支持群' })
  await expect(page.getByText(message.content)).toBeVisible()
  await page.getByRole('button', { name: '撤销邀请' }).click()
  await expect(page.getByRole('button', { name: '撤销邀请' })).toHaveCount(0)
  page.on('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '移出群聊' }).click()
  await expect(page.getByText('暂无群成员')).toBeVisible()
  expect(writes.find(item => item.path === '/chatGroup/participant/remove')?.body).toEqual({ uuid, entity_slug: 'carol', expected_entity_id: 111 })
  await page.getByRole('button', { name: '撤回', exact: true }).click()
  await expect.poll(() => writes.some(item => item.path === '/chatGroup/message/revoke' && item.body.message_id === 1)).toBe(true)
  await page.getByRole('button', { name: '关闭群聊' }).click()
  await expect(page.getByRole('button', { name: '关闭群聊' })).toHaveAttribute('aria-disabled', 'true')
  await noOverflow(page)
})
