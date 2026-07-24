import { expect, test } from '@playwright/test'

test('chat workspace renders conversations and sends through the API boundary', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lostsky_token', 'e2e-token'))
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: 'window.Centrifuge=class{constructor(){} connect(){} disconnect(){} newSubscription(){return {on(){return this},subscribe(){},unsubscribe(){}}}}',
  }))
  await page.route('http://127.0.0.1:5176/api/**', async route => {
    const url = new URL(route.request().url())
    let data: unknown = null
    if (url.pathname.endsWith('/actor')) data = [
      { type: 'member', slug: 'alice', name: '青空成员', avatar: null, can_act: true },
      { type: 'virtual', slug: 'sales-assistant', name: '销售助手', avatar: null, can_act: true },
    ]
    else if (url.pathname.endsWith('/conversation')) data = [{
      uuid: '123e4567-e89b-42d3-a456-426614174000', kind: 'direct', title: null,
      is_temporary: false, is_closed: false, expires_at: null, last_message_at: 1752883200,
      last_message: '欢迎来到聊天', participants: [
        { type: 'member', slug: 'alice', name: '青空成员', avatar: null, joined_at: 1752880000, left_at: null, last_read_message_id: 1 },
        { type: 'virtual', slug: 'sales-assistant', name: '销售助手', avatar: null, joined_at: 1752880000, left_at: null, last_read_message_id: null },
      ],
    }]
    else if (url.pathname.endsWith('/message') && route.request().method() === 'GET') data = [{
      id: 1, conversation: '123e4567-e89b-42d3-a456-426614174000',
      sender: { type: 'virtual', slug: 'sales-assistant', name: '销售助手', avatar: null },
      content: '欢迎来到聊天', reply_id: null, edited_at: null, revoked_at: null, create_time: 1752883200,
    }]
    else if (url.pathname.endsWith('/message/send')) data = {
      id: 2, conversation: '123e4567-e89b-42d3-a456-426614174000',
      sender: { type: 'member', slug: 'alice', name: '青空成员', avatar: null },
      content: '你好', reply_id: null, edited_at: null, revoked_at: null, create_time: 1752883260,
    }
    else if (url.pathname.endsWith('/realtime/connect')) data = { token: 'connection-token', url: 'ws://example.test/connection/websocket' }
    else if (url.pathname.endsWith('/realtime/subscribe')) data = { token: 'subscription-token', channel: 'chat:conversation:123e4567-e89b-42d3-a456-426614174000' }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })
  await page.goto('http://127.0.0.1:5176/')
  await expect(page.getByRole('heading', { name: '销售助手' })).toBeVisible()
  await expect(page.getByRole('article').getByText('欢迎来到聊天', { exact: true })).toBeVisible()
  await page.getByPlaceholder('输入消息，Enter 发送').fill('你好')
  await page.getByRole('button', { name: '发送消息' }).click()
  await expect(page.getByText('你好', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
})

test('direct conversation submits a single selected participant as an array', async ({ page }) => {
  let createPayload: Record<string, unknown> | null = null
  await page.addInitScript(() => localStorage.setItem('lostsky_token', 'e2e-token'))
  await page.route('http://127.0.0.1:5176/api/**', async route => {
    const url = new URL(route.request().url())
    let data: unknown = null
    if (url.pathname.endsWith('/actor')) {
      data = [
        { type: 'member', slug: 'alice', name: '青空成员', avatar: null, can_act: true },
        { type: 'virtual', slug: 'sales-assistant', name: '销售助手', avatar: null, can_act: false },
      ]
    } else if (url.pathname.endsWith('/conversation/create')) {
      createPayload = route.request().postDataJSON()
      data = { uuid: '123e4567-e89b-42d3-a456-426614174000', existing: false }
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://127.0.0.1:5176/new')
  await page.locator('.n-select').nth(1).click()
  await page.getByText('销售助手 · @sales-assistant', { exact: true }).click()
  await expect(page.getByRole('button', { name: '创建会话' })).toBeEnabled()
  await page.getByRole('button', { name: '创建会话' }).click()

  await expect.poll(() => createPayload?.participants).toEqual(['sales-assistant'])
})

test('identity picker receives an entity token without replacing the user session contract', async ({ page }) => {
  let receivedSlug: string | null = null
  await page.addInitScript(() => localStorage.setItem('lostsky_token', 'user-token'))
  await page.route('http://127.0.0.1:5176/api/**', async route => {
    const url = new URL(route.request().url())
    let data: unknown = null
    if (url.pathname.endsWith('/identity/candidates')) {
      data = [{ type: 'teamVirtual', id: 9, slug: 'sales-assistant', name: '销售助手' }]
    } else if (url.pathname.endsWith('/identity/receive')) {
      receivedSlug = route.request().postDataJSON().slug
      data = { token: 'entity-token', identity: { type: 'teamVirtual', id: 9, slug: 'sales-assistant', name: '销售助手' } }
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  await page.goto('http://127.0.0.1:5176/identity')
  await expect(page.getByRole('heading', { name: '选择当前身份' })).toBeVisible()
  await page.getByRole('button', { name: '领取' }).click()
  await expect.poll(() => receivedSlug).toBe('sales-assistant')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('lostsky_token'))).toBe('entity-token')
})
