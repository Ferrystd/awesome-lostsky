import { test, expect } from '@playwright/test'
test('conversation drafts stay isolated and the sidebar follows viewport geometry', async ({ page, isMobile }) => {
  const chat = 'http://chat.lostsky.work:5176'
  const token = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamMember', id: 11 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/' }])
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: 'window.Centrifuge=class{connect(){} disconnect(){} newSubscription(){return {on(){return this},subscribe(){},unsubscribe(){}}}}' }))
  const actor = { id: 111, slug: 'self', name: '自己', type: 'entity', avatar: null, team: { id: 1, slug: 'demo', name: '团队' } }
  const conversation = (uuid: string, name: string) => ({ uuid, kind: 'direct', title: name, is_closed: false, is_temporary: false, last_message: '', last_message_at: 1, participants: [actor, { ...actor, id: 222, slug: uuid, name }].map(person => ({ ...person, status: 'active', left_at: null, joined_at: 1 })) })
  const rows = [conversation('conversation-a', '会话甲'), conversation('conversation-b', '会话乙')]
  let sent: Record<string, unknown> | undefined
  await page.route(`${chat}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '')
    let data: unknown = null
    if (path === '/actor') data = actor
    if (path === '/conversation') data = rows
    if (path === '/message') data = []
    if (path === '/realtime/connect') data = { token: 'audit', url: 'ws://example.test' }
    if (path === '/realtime/subscribe') data = { token: 'audit', channel: 'test' }
    if (path === '/message/send') { sent = route.request().postDataJSON(); data = { ...sent, id: 9, sender: actor, create_time: 1, revoked_at: null, edited_at: null } }
    await route.fulfill({ json: { code: 0, data } })
  })
  await page.goto(`${chat}/?conversation=conversation-a`)
  await expect(page.getByRole('heading', { name: '会话甲', exact: true })).toBeVisible()
  const composer = page.getByPlaceholder('输入消息，Enter 发送')
  await composer.fill('仅发给甲的私密草稿')
  const sidebar = page.locator('.conversation-pane')
  const messages = page.locator('.message-pane')
  if (isMobile) {
    await expect(sidebar).toBeHidden()
    const messageBox = await messages.boundingBox()
    expect(messageBox!.x).toBeGreaterThanOrEqual(0)
    expect(messageBox!.x + messageBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1)
    await page.getByRole('button', { name: '返回会话列表' }).click()
    await expect(sidebar).toBeVisible()
    await expect(messages).toBeHidden()
    const sidebarBox = await sidebar.boundingBox()
    expect(sidebarBox!.x).toBeGreaterThanOrEqual(0)
    expect(sidebarBox!.x + sidebarBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1)
  } else {
    await expect(sidebar).toBeVisible()
    const left = await sidebar.boundingBox()
    const right = await messages.boundingBox()
    expect(left!.x + left!.width).toBeLessThanOrEqual(right!.x + 1)
  }
  await sidebar.getByRole('button').filter({ hasText: '会话乙' }).click()
  await expect(page.getByRole('heading', { name: '会话乙', exact: true })).toBeVisible()
  await expect(composer).toHaveValue('')
  await composer.fill('仅发给乙')
  if (isMobile) await page.getByRole('button', { name: '返回会话列表' }).click()
  await sidebar.getByRole('button').filter({ hasText: '会话甲' }).click()
  await expect(composer).toHaveValue('仅发给甲的私密草稿')
  await page.getByRole('button', { name: '发送消息', exact: true }).click()
  await expect.poll(() => sent?.conversation).toBe('conversation-a')
  expect(sent?.content).toBe('仅发给甲的私密草稿')
  await expect(composer).toHaveValue('')
  if (isMobile) await page.getByRole('button', { name: '返回会话列表' }).click()
  await sidebar.getByRole('button').filter({ hasText: '会话乙' }).click()
  await expect(composer).toHaveValue('仅发给乙')
  const nextToken = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamMember', id: 22 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: nextToken, domain: '.lostsky.work', path: '/' }])
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(composer).toHaveValue('')
})
