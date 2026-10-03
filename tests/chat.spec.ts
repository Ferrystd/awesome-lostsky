import { expect, test, type Page } from '@playwright/test'

async function setToken(page: Page, value: string) {
  await page.context().addCookies([{ name: 'lostsky_token', value, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
}

async function token(page: Page) {
  return (await page.context().cookies()).find((cookie) => cookie.name === 'lostsky_token')?.value
}

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
  await expect(page.getByText('当前正在使用人员身份')).toBeVisible()
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
  let receiveCount = 0
  await setToken(page, 'old-entity-token')
  await page.route('http://account.lostsky.work:5174/api/identity/member', async route => {
    receiveCount++
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ code: 1, message: '你不是该团队的有效成员', data: null }),
    })
  })
  await page.route('http://account.lostsky.work:5174/api/team/index', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code: 0, message: 'ok', data: [] }),
  }))

  await page.goto('http://account.lostsky.work:5174/identity/member-callback?team_slug=demo&reason=missing&return_to=%2Fteams')
  await expect(page.getByRole('heading', { name: '无法领取成员身份' })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('你不是该团队的有效成员')
  await expect.poll(() => token(page)).toBe('old-entity-token')
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('本次浏览会话已经尝试过自动领取')
  expect(receiveCount).toBe(1)
  await page.getByRole('button', { name: '切换团队' }).click()
  await expect(page).toHaveURL('http://account.lostsky.work:5174/teams')
})

test('external workspace warning confirms once and preserves only a safe return URL', async ({ page }) => {
  await setToken(page, 'external-entity-token')
  let acknowledgeCount = 0
  await page.route('http://account.lostsky.work:5174/api/identity/workspace-warning**', async route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/acknowledge')) {
      acknowledgeCount++
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: { acknowledged: true, ttl_seconds: 86400 } }) })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data: {
        team: { id: 2, slug: 'target', name: '目标团队' },
        identity: { type: 'teamMember', id: 7, entity_id: 70, slug: 'outside', name: '外部成员' },
        can_continue: true,
        entry_warning: { required: true, kind: 'external_entity', ttl_seconds: 86400 },
      } }),
    })
  })
  await page.route('http://account.lostsky.work:5174/api/team/index', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code: 0, message: 'ok', data: [] }),
  }))

  const safe = 'http://demo.team.lostsky.work:5175/members'
  await page.goto(`http://account.lostsky.work:5174/identity/workspace-warning?team_slug=target&redirect=${encodeURIComponent(safe)}`)
  await expect(page.getByRole('heading', { name: '你正在使用外部身份' })).toBeVisible()
  await expect(page.getByText('外部成员')).toBeVisible()
  await expect(page.getByText('目标团队', { exact: true })).toBeVisible()
  await page.route('http://demo.team.lostsky.work:5175/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/access') ? {
      team: { id: 2, slug: 'demo', name: '目标团队' }, permissions: [], abilities: {},
      identity: { type: 'teamMember', entity_id: 70, name: '外部成员', slug: 'outside', belongs_to_team: false, is_external: true },
      entry_warning: { required: false, kind: 'external_entity', ttl_seconds: 86400 },
    } : []
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })
  await page.getByRole('button', { name: '继续前往' }).click()
  await expect.poll(() => acknowledgeCount).toBe(1)
  await expect(page).toHaveURL(safe)
})
