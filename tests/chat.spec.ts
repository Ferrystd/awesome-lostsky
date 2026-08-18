import { expect, test, type Page } from '@playwright/test'

async function setToken(page: Page, value: string) {
  await page.context().addCookies([{ name: 'lostsky_token', value, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
}

async function token(page: Page) {
  return (await page.context().cookies()).find((cookie) => cookie.name === 'lostsky_token')?.value
}

test('chat workspace renders conversations and sends through the API boundary', async ({ page }) => {
  await setToken(page, 'e2e-token')
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: 'window.Centrifuge=class{constructor(){} connect(){} disconnect(){} newSubscription(){return {on(){return this},subscribe(){},unsubscribe(){}}}}',
  }))
  await page.route('http://demo.chat.lostsky.work:5176/api/**', async route => {
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
  await page.goto('http://demo.chat.lostsky.work:5176/')
  await expect(page.getByRole('heading', { name: '销售助手' })).toBeVisible()
  await expect(page.getByRole('article').getByText('欢迎来到聊天', { exact: true })).toBeVisible()
  await page.getByPlaceholder('输入消息，Enter 发送').fill('你好')
  await page.getByRole('button', { name: '发送消息' }).click()
  await expect(page.getByText('你好', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
})

test('Chat identity entry opens the workspace that owns current-entity self management', async ({ page }) => {
  for (const target of [
    'http://demo.team.lostsky.work:5175/personal',
    'http://demo.shop.lostsky.work:5179/customer/profile',
  ]) {
    await page.route(target, route => route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><title>Redirect target</title>',
    }))
  }
  await page.route('http://demo.chat.lostsky.work:5176/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/actor') || path.endsWith('/conversation') ? [] : null
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })
  const identityToken = (type: string, id: number) =>
    `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type, id } })).toString('base64url')}.x`
  const openRedirect = async (url: string) => {
    await page.goto(url).catch((error: unknown) => {
      if (!String(error).includes('ERR_ABORTED')) throw error
    })
  }

  await setToken(page, identityToken('teamCustomer', 31))
  await page.goto('http://demo.chat.lostsky.work:5176/')
  await expect(page.getByRole('link', { name: '顾客中心' }))
    .toHaveAttribute('href', 'http://demo.shop.lostsky.work:5179/customer/profile')

  await setToken(page, identityToken('teamMember', 11))
  await page.reload()
  await expect(page.getByRole('link', { name: '个人工作台' }))
    .toHaveAttribute('href', 'http://demo.team.lostsky.work:5175/personal')

  await setToken(page, identityToken('teamVirtual', 9))
  await page.reload()
  await expect(page.getByRole('link', { name: '个人工作台' }))
    .toHaveAttribute('href', 'http://demo.team.lostsky.work:5175/personal')

  await setToken(page, identityToken('team', 1))
  await page.reload()
  await expect(page.getByRole('link', { name: '个人工作台' }))
    .toHaveAttribute('href', 'http://demo.team.lostsky.work:5175/personal')

  await setToken(page, identityToken('teamMember', 11))
  await openRedirect('http://demo.chat.lostsky.work:5176/profile')
  await expect(page).toHaveURL('http://demo.team.lostsky.work:5175/personal')

  await setToken(page, identityToken('teamCustomer', 31))
  await openRedirect('http://demo.chat.lostsky.work:5176/profile')
  await expect(page).toHaveURL('http://demo.shop.lostsky.work:5179/customer/profile')
})

test('direct conversation submits a single selected participant as an array', async ({ page }) => {
  let createPayload: Record<string, unknown> | null = null
  await setToken(page, 'e2e-token')
  await page.route('http://demo.chat.lostsky.work:5176/api/**', async route => {
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

  await page.goto('http://demo.chat.lostsky.work:5176/new')
  await page.getByRole('textbox', { name: '聊天对象' }).fill('missing')
  await expect(page.getByText('没有匹配的可搜索实体')).toBeVisible()
  await expect(page.getByText('匹配的实体', { exact: true })).toHaveCount(0)
  await page.getByRole('textbox', { name: '聊天对象' }).fill('sales')
  await page.getByRole('option').filter({ hasText: '@sales-assistant' }).click()
  await expect(page.getByRole('button', { name: '创建会话' })).toBeEnabled()
  await page.getByRole('button', { name: '创建会话' }).click()

  await expect.poll(() => createPayload?.participants).toEqual(['sales-assistant'])
})

test('Account identity picker switches continuously and returns to its safe redirect', async ({ page }) => {
  const receivedSlugs: string[] = []
  await setToken(page, 'user-token')
  await page.route('http://account.lostsky.work:5174/api/**', async route => {
    const url = new URL(route.request().url())
    let data: unknown = null
    if (url.pathname.endsWith('/identity/candidates')) {
      data = [
        { type: 'teamVirtual', id: 9, slug: 'sales-assistant', name: '销售助手' },
        { type: 'teamMember', id: 10, slug: 'service-member', name: '客服成员' },
      ]
    } else if (url.pathname.endsWith('/identity/receive')) {
      const slug = route.request().postDataJSON().slug
      receivedSlugs.push(slug)
      data = {
        token: `${slug}-token`,
        identity: slug === 'sales-assistant'
          ? { type: 'teamVirtual', id: 9, slug, name: '销售助手' }
          : { type: 'teamMember', id: 10, slug, name: '客服成员' },
      }
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  const redirect = 'http://demo.team.lostsky.work:5175/personal'
  await page.route(redirect, route => route.fulfill({ status: 200, contentType: 'text/html', body: '<main>原页面</main>' }))
  await page.goto(`http://account.lostsky.work:5174/identity?redirect=${encodeURIComponent(redirect)}`)
  await expect(page.getByRole('heading', { name: '选择当前身份' })).toBeVisible()
  const returnLink = page.getByRole('link', { name: '前往页面' })
  await expect(returnLink).toHaveAttribute('href', redirect)

  await page.locator('article').filter({ hasText: '@sales-assistant' }).getByRole('button', { name: '领取' }).click()
  await expect.poll(() => receivedSlugs).toEqual(['sales-assistant'])
  await expect(page).toHaveURL(new RegExp('/identity\\?redirect='))
  await expect.poll(() => token(page)).toBe('sales-assistant-token')

  await page.locator('article').filter({ hasText: '@service-member' }).getByRole('button', { name: '切换' }).click()
  await expect.poll(() => receivedSlugs).toEqual(['sales-assistant', 'service-member'])
  await expect(page).toHaveURL(new RegExp('/identity\\?redirect='))
  await expect.poll(() => token(page)).toBe('service-member-token')

  await returnLink.click()
  await expect(page).toHaveURL(redirect)
})

test('Account identity picker shows cross-team candidates and preserves the current token on failure', async ({ page }) => {
  const payload = Buffer.from(JSON.stringify({ act: { type: 'teamVirtual', id: 3 } })).toString('base64url')
  const currentToken = `header.${payload}.signature`
  await setToken(page, currentToken)
  await page.route('http://account.lostsky.work:5174/api/**', async route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/identity/candidates')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          message: 'ok',
          data: [{
            type: 'teamMember',
            id: 21,
            slug: 'bob',
            name: 'Bob',
            team: { id: 8, slug: 'team-b', name: '团队 B' },
          }],
        }),
      })
      return
    }
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ code: 403, message: '委托权限已撤销', data: null }),
    })
  })

  await page.goto('http://account.lostsky.work:5174/identity')
  await expect(page.getByText('当前正在使用实体身份')).toBeVisible()
  await expect(page.getByRole('heading', { name: '可切换身份' })).toBeVisible()
  await expect(page.getByText('团队 B · team-b')).toBeVisible()
  await page.getByRole('button', { name: '切换' }).click()
  await expect(page.getByRole('alert')).toContainText('委托权限已撤销')
  await expect.poll(() => token(page)).toBe(currentToken)
})

test('Account identity picker exposes loading and empty states', async ({ page }) => {
  await setToken(page, 'user-token')
  await page.route('http://account.lostsky.work:5174/api/identity/candidates', async route => {
    await new Promise(resolve => setTimeout(resolve, 250))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data: [] }),
    })
  })

  await page.goto('http://account.lostsky.work:5174/identity')
  await expect(page.getByLabel('正在加载身份')).toBeVisible()
  await expect(page.locator('.ls-empty-state')).toContainText('暂无可领取身份')
})

test('cross-team member callback waits for confirmation and cancel preserves the entity', async ({ page }) => {
  let receiveCount = 0
  await setToken(page, 'old-entity-token')
  await page.route('http://account.lostsky.work:5174/api/identity/member', async route => {
    receiveCount++
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data: { token: 'new-member-token', identity: {} } }),
    })
  })

  await page.goto('http://account.lostsky.work:5174/identity/member-callback?team_slug=demo&reason=team_mismatch&return_to=%2Fteams')
  await expect(page.getByRole('heading', { name: '切换到 demo 的成员身份？' })).toBeVisible()
  expect(receiveCount).toBe(0)
  await page.getByRole('button', { name: '取消并保留当前身份' }).click()
  await expect(page).toHaveURL('http://account.lostsky.work:5174/teams')
  expect(receiveCount).toBe(0)
  await expect.poll(() => token(page)).toBe('old-entity-token')
})

test('confirmed team mismatch switches member and missing identity recovers automatically', async ({ page }) => {
  let payload: { team_slug?: string } | null = null
  await setToken(page, 'old-entity-token')
  await page.route('http://account.lostsky.work:5174/api/identity/member', async route => {
    payload = route.request().postDataJSON()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: 'ok',
        data: { token: 'new-member-token', identity: { type: 'teamMember', id: 7, slug: 'member', name: 'Member' } },
      }),
    })
  })

  await page.goto('http://account.lostsky.work:5174/identity/member-callback?team_slug=demo&reason=team_mismatch&return_to=%2Fteams')
  await expect(page.getByRole('button', { name: '确认切换' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect.poll(() => payload?.team_slug).toBe('demo')
  await expect(page).toHaveURL('http://account.lostsky.work:5174/teams')
  await expect.poll(() => token(page)).toBe('new-member-token')

  payload = null
  await page.goto('http://account.lostsky.work:5174/identity/member-callback?team_slug=demo&reason=missing&return_to=%2Fteams')
  await expect.poll(() => payload?.team_slug).toBe('demo')
  await expect(page).toHaveURL('http://account.lostsky.work:5174/teams')
})

test('member callback keeps the previous token when member receipt fails', async ({ page }) => {
  await setToken(page, 'old-entity-token')
  await page.route('http://account.lostsky.work:5174/api/identity/member', async route => {
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ code: 1, message: '你不是该团队的有效成员', data: null }),
    })
  })

  await page.goto('http://account.lostsky.work:5174/identity/member-callback?team_slug=demo&reason=missing&return_to=%2Fteams')
  await expect(page.getByRole('heading', { name: '暂时无法领取成员身份' })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('你不是该团队的有效成员')
  await expect.poll(() => token(page)).toBe('old-entity-token')
  await page.getByRole('button', { name: '返回' }).click()
  await expect(page).toHaveURL('http://account.lostsky.work:5174/teams')
})
