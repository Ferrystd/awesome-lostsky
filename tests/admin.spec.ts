import { expect, test, type Page } from './fixtures'
import { formatPermissionDenied } from '../frontend/packages/api/src/error-format'

const session = {
  user: { id: 1, username: 'platform-owner', phone_masked: '138****8000', email_masked: 'p***@example.test' },
  roles: [{ id: 1, role_key: 'super_admin', name: '超级管理员', description: '全部权限', is_system: 1 }],
  permissions: [
    'admin.dashboard.read', 'admin.user.read', 'admin.user.sensitive.read', 'admin.user.moderate',
    'admin.user.session.revoke', 'admin.team.read', 'admin.team.moderate', 'admin.access.read',
    'admin.team.ability.write', 'admin.access.write', 'admin.audit.read', 'admin.system.read',
  ],
  is_super_admin: true,
}
const user = {
  id: 23, username: 'sky-user', nickname: '青空用户', phone_masked: '139****1234',
  email_masked: 's***@example.test', is_banned: 0, team_count: 1, device_count: 2,
  create_time: 1_753_660_800, update_time: 1_753_660_800,
}
const team = {
  id: 7, slug: 'demo', name: '青空协作组', user_id: 23, owner_username: 'sky-user',
  member_count: 12, is_banned: 0, is_cancelled: 0, create_time: 1_753_660_800, update_time: 1_753_660_800,
}
const audit = {
  id: 9, application: 'admin', action: 'user.sessions.revoke', resource_type: 'user',
  resource_id: 23, authenticated_user_id: 1, actor_username: 'platform-owner',
  request_id: 'admin-test', context: { source: 'api', reason: '用户本人请求退出全部设备' },
  create_time: 1_753_660_800,
}

async function mockAdminApi(
  page: Page,
  options: { forbidden?: boolean; session?: typeof session; dashboardFailures?: number; emptyEntitlements?: boolean } = {},
) {
  let dashboardFailures = options.dashboardFailures ?? 0
  await page.addInitScript(() => localStorage.setItem('lostsky_token', 'admin-test-token'))
  await page.route(/^http:\/\/127\.0\.0\.1:5180\/api\//, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace(/^\/api/, '')
    if (path === '/session' && options.forbidden) {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ code: 403, message: '你没有进入平台管理后台的权限', data: null }),
      })
      return
    }
    if (path === '/dashboard' && dashboardFailures > 0) {
      dashboardFailures -= 1
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ code: 503, message: '平台状态暂时不可用', data: null }),
      })
      return
    }
    let data: unknown = null
    if (path === '/session') data = options.session ?? session
    else if (path === '/dashboard') {
      data = {
        counts: { users: 128, new_users_7d: 9, banned_users: 2, teams: 16, new_teams_7d: 2, banned_teams: 1, administrators: 3, active_sessions: 84 },
        recent_users: [user], recent_teams: [team], recent_audit_events: [audit],
      }
    } else if (path === '/search') data = { users: [user], teams: [team] }
    else if (path === '/users') data = { total: 1, list: [user], page: 1, limit: 20 }
    else if (path === '/users/23') {
      data = { ...user, teams: [team], devices: [{ id: 3, device_name: 'Chrome', ua: 'Desktop Chrome', last_active_time: 1_753_660_800, create_time: 1_753_660_800 }], roles: [], audit_events: [audit] }
    } else if (path === '/teams') data = { total: 1, list: [team], page: 1, limit: 20 }
    else if (path === '/teams/7') data = {
      ...team,
      domains: [],
      abilities: [],
      audit_events: [audit],
    }
    else if (path === '/team-abilities/catalog') data = [
      { key: 'doc', label: '文档', levels: [1] },
      { key: 'file', label: '文件', levels: [1, 2, 3] },
      { key: 'transaction', label: '流水', levels: [1] },
      { key: 'shop', label: '商城', levels: [1] },
    ]
    else if (path === '/team-abilities' && request.method() === 'POST') {
      const input = request.postDataJSON()
      data = { team_slug: input.team_slug, ability_key: input.ability_key, level: input.level, expire_time: input.expire_time }
    }
    else if (path === '/entitlements/packages') data = { total: options.emptyEntitlements ? 0 : 1, list: options.emptyEntitlements ? [] : [{ id: 1, name: '团队能力月卡', is_active: 1, abilities: [{ ability_key: 'file', level: 1, duration_days: 30 }] }] }
    else if (path === '/entitlements/campaigns') data = { total: 1, list: [{ id: 1, name: '团队月卡活动', package_id: 1, package: { name: '团队能力月卡' }, mode: 1, is_active: 1 }] }
    else if (path === '/entitlements/campaigns/1') data = { id: 1, name: '团队月卡活动', package_id: 1, mode: 1, is_active: 1, claim_group: '', total_limit: null, redeem_starts_at: 0, redeem_ends_at: 0 }
    else if (path === '/entitlements/campaigns/1/codes') data = request.method() === 'POST'
      ? [{ id: 1, code: 'LS-TEST-TEAM-ABILITY' }]
      : { total: 0, list: [] }
    else if (path === '/administrators') data = [{ ...session.user, is_banned: 0, roles: session.roles }]
    else if (path === '/roles' && request.method() === 'POST') data = { id: 4 }
    else if (path === '/roles') data = session.roles.map((role) => ({ ...role, permissions: session.permissions, administrator_count: 1 }))
    else if (path === '/roles/1' || path === '/roles/4') data = { ...session.roles[0], id: Number(path.split('/').pop()), permissions: session.permissions, administrator_count: 1 }
    else if (path === '/permissions') data = { groups: [{ name: '平台概览', items: [{ key: 'admin.dashboard.read', label: '查看平台概览' }] }] }
    else if (path === '/audit-events') data = { total: 1, list: [audit], page: 1, limit: 20 }
    else if (path === '/system/health') data = { status: 'healthy', checked_at: 1_753_660_800, checks: [{ key: 'api', name: 'API 服务', status: 'healthy', message: '正常' }], backlogs: { chat_outbox_pending: 0 } }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })
  return {
    recoverDashboard: () => {
      dashboardFailures = 0
    },
  }
}

test('Admin supports dashboard search, resource navigation and governed confirmation', async ({ page }, testInfo) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.setViewportSize({ width: 1440, height: 960 })
  await mockAdminApi(page)
  await page.goto('http://127.0.0.1:5180/')

  expect(pageErrors).toEqual([])
  await expect(page).toHaveTitle(/平台总览 · LostSky/)
  await expect(page.getByRole('button', { name: /搜索平台资源/ }).last()).toBeFocused()
  await expect(page.getByText('128')).toBeVisible()
  await expect(page.getByRole('heading', { name: '近期团队' })).toBeVisible()

  if (testInfo.project.name === 'mobile-chromium') {
    await page.locator('.top-search').click()
  } else {
    await page.keyboard.press('Control+K')
  }
  const search = page.getByPlaceholder('输入用户名、手机号、邮箱、团队名称或 ID')
  await expect(search).toBeVisible()
  await search.fill('青空')
  await expect(page.getByRole('button', { name: /青空用户/ })).toBeVisible()
  await page.getByRole('button', { name: /青空用户/ }).click()
  await expect(page).toHaveURL(/\/users\/23$/)

  await page.getByRole('button', { name: '封禁用户' }).click()
  const confirm = page.getByRole('button', { name: '封禁用户' }).last()
  await expect(confirm).toBeDisabled()
  await page.getByLabel('操作原因').fill('确认该账号存在违反平台规则的行为')
  const request = page.waitForRequest((candidate) => candidate.url().endsWith('/api/users/23/ban'))
  await confirm.click()
  expect((await request).postDataJSON()).toEqual({ reason: '确认该账号存在违反平台规则的行为' })

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)
})

test('Admin discovers code issuance from the sidebar and entitlement packages at every layout width', async ({ page }) => {
  await mockAdminApi(page)
  for (const width of [320, 375, 767, 768, 959, 960, 1024, 1440]) {
    await page.setViewportSize({ width, height: 960 })
    await page.goto('http://127.0.0.1:5180/entitlements/packages')
    await expect(page.locator('#admin-main').getByRole('heading', { name: 'Ability 权益包', exact: true })).toBeVisible()
    const menu = page.getByRole('button', { name: '打开导航' })
    if (await menu.isVisible()) await menu.click()
    await page.getByRole('navigation').getByRole('link', { name: '兑换活动', exact: true }).click()
    await expect(page).toHaveURL(/\/entitlements\/campaigns$/)
    const main = page.locator('#admin-main')
    await expect(main.getByRole('link', { name: '创建活动' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
    await main.getByRole('button', { name: '平台权益', exact: true }).click()
    await expect(page).toHaveURL(/\/entitlements\/packages$/)
    await expect(main.getByRole('link', { name: '创建权益包' })).toBeVisible()
    const activities = main.getByRole('button', { name: '兑换活动', exact: true })
    await activities.focus()
    await expect(activities).toBeFocused()
    expect((await activities.boundingBox())?.height).toBeGreaterThanOrEqual(44)
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
    await activities.press('Enter')
    await expect(page).toHaveURL(/\/entitlements\/campaigns$/)
  }
  await page.getByRole('link', { name: /团队月卡活动/ }).click()
  await expect(page).toHaveURL(/\/entitlements\/campaigns\/1$/)
  await expect(page.getByRole('navigation').getByRole('link', { name: '兑换活动', exact: true })).toHaveClass(/router-link-active/)
  const issue = page.waitForRequest((request) => request.url().endsWith('/api/entitlements/campaigns/1/codes') && request.method() === 'POST')
  await page.getByRole('button', { name: '发行', exact: true }).click()
  expect((await issue).postDataJSON()).toEqual({ quantity: 1, target_team_id: null })
  await expect(page.getByRole('button', { name: /LS-TEST-TEAM-ABILITY/ })).toBeVisible()
})

test('Admin campaign direct entry renders existing codes and populated limits without runtime errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await mockAdminApi(page)
  await page.route('**/api/entitlements/campaigns/1', route => route.fulfill({ json: {
    code: 0, message: 'ok', data: {
      id: 1, name: '团队月卡活动', package_id: 1, mode: 2, is_active: 1,
      claim_group: 'monthly-trial', total_limit: '100',
      redeem_starts_at: 1_753_660_800, redeem_ends_at: 1_756_339_200,
    },
  } }))
  await page.route('**/api/entitlements/campaigns/1/codes?**', route => route.fulfill({ json: {
    code: 0, message: 'ok', data: { total: 1, list: [
      { id: 1, code_hint: 'LS-TEST-****', use_count: 2, is_active: 1 },
    ] },
  } }))
  await page.goto('http://127.0.0.1:5180/entitlements/campaigns/1')
  await expect(page.locator('#admin-campaign-name input')).toHaveValue('团队月卡活动')
  await expect(page.getByText('LS-TEST-****', { exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('Admin entitlement navigation remains available for empty and restricted lists', async ({ page }) => {
  const limited = { ...session, permissions: [], is_super_admin: false }
  await mockAdminApi(page, { emptyEntitlements: true })
  await page.goto('http://127.0.0.1:5180/entitlements/packages')
  await expect(page.locator('.ls-empty-state')).toBeVisible()
  await page.locator('#admin-main').getByRole('button', { name: '兑换活动', exact: true }).click()
  await expect(page).toHaveURL(/\/entitlements\/campaigns$/)
  await mockAdminApi(page, { session: limited })
  await page.goto('http://127.0.0.1:5180/entitlements/packages')
  await expect(page.locator('.ls-empty-state')).toContainText('admin.entitlement.read')
  await page.locator('#admin-main').getByRole('button', { name: '兑换活动', exact: true }).click()
  await expect(page).toHaveURL(/\/entitlements\/campaigns$/)
  await expect(page.locator('.ls-empty-state')).toContainText('admin.entitlement.read')
})

test('Admin renders mobile records and navigation without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await mockAdminApi(page)
  for (const path of ['/users', '/teams', '/administrators', '/roles', '/audit']) {
    await page.goto(`http://127.0.0.1:5180${path}`)
    await expect(page.locator('.ls-list-toolbar')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `horizontal overflow at ${path}`).toBe(false)
  }

  await page.goto('http://127.0.0.1:5180/users')

  await expect(page.getByText('用户 ID')).toBeVisible()
  await expect(page.locator('table')).toBeHidden()
  await page.getByRole('button', { name: '打开导航' }).click()
  await expect(page.locator('aside[aria-label="平台管理导航"]')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)

  await page.setViewportSize({ width: 768, height: 1024 })
  await page.reload()
  await expect(page.locator('#admin-main').getByRole('heading', { name: '用户', level: 1 })).toBeVisible()
  const tabletOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(tabletOverflow).toBe(false)
})

test('Admin shows an explicit forbidden page for authenticated non-admin users', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await mockAdminApi(page, { forbidden: true })
  await page.goto('http://127.0.0.1:5180/')

  await expect(page).toHaveURL(/\/forbidden$/)
  await expect(page.getByRole('heading', { name: '你没有进入平台管理后台的权限' })).toBeVisible()
  await expect(page.getByRole('button', { name: '返回账号登录' })).toBeVisible()
})

test('Admin preserves the return URL when an unauthenticated user is sent to Account', async ({ page }) => {
  await page.goto('http://127.0.0.1:5180/users/23')

  await expect(page).toHaveURL(/127\.0\.0\.1:5174\/login/)
  const redirect = new URL(page.url()).searchParams.get('redirect')
  expect(redirect).toBe('http://127.0.0.1:5180/users/23')
})

test('Admin keeps navigation and routes open, then degrades data for the current permission set', async ({ page }) => {
  const limited = {
    ...session,
    roles: [{ id: 2, role_key: 'user_reader', name: '用户只读', description: '只读用户', is_system: 0 }],
    permissions: ['admin.dashboard.read', 'admin.user.read'],
    is_super_admin: false,
  }
  await mockAdminApi(page, { session: limited })
  await page.goto('http://127.0.0.1:5180/')

  await expect(page.getByRole('link', { name: '用户' })).toBeVisible()
  await expect(page.getByRole('link', { name: '团队' }).first()).toBeVisible()
  await page.goto('http://127.0.0.1:5180/teams')
  await expect(page).toHaveURL(/\/teams$/)
  await expect(page.locator('#admin-main').getByRole('heading', { name: '团队', level: 1 })).toBeVisible()
  await expect(page.locator('.ls-empty-state')).toContainText('admin.team.read')
  await expect(page.locator('.n-message').filter({ hasText: formatPermissionDenied(['admin.team.read']) })).toHaveCount(1)
})

test('Admin grants a Team Ability by exact slug without Team read access', async ({ page }) => {
  const writeOnly = {
    ...session,
    roles: [{ id: 4, role_key: 'ability_operator', name: '能力运营', description: '仅按 slug 开通能力', is_system: 0 }],
    permissions: ['admin.team.ability.write'],
    is_super_admin: false,
  }
  const teamReadRequests: string[] = []
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname
    if (path === '/api/teams' || /^\/api\/teams\/\d+$/.test(path)) teamReadRequests.push(path)
  })
  await mockAdminApi(page, { session: writeOnly })
  await page.goto('http://127.0.0.1:5180/entitlements/team-abilities')

  await expect(page).toHaveURL(/\/entitlements\/team-abilities$/)
  await expect(page.getByRole('link', { name: '团队能力' })).toBeVisible()
  await expect(page.locator('#admin-main').getByRole('heading', { name: '开通团队能力', level: 1 })).toBeVisible()
  await page.getByLabel('团队 slug').fill('demo')
  await page.getByLabel('Ability').click()
  await page.getByText('文件（file）').click()
  await page.getByLabel('等级').click()
  await page.getByText('等级 2').click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  const request = page.waitForRequest((candidate) => candidate.url().endsWith('/api/team-abilities') && candidate.method() === 'POST')
  await page.getByRole('button', { name: '开通能力' }).click()
  const payload = (await request).postDataJSON()
  expect(payload).toMatchObject({ team_slug: 'demo', ability_key: 'file', level: 2 })
  expect(payload.expire_time).toBeGreaterThan(Math.floor(Date.now() / 1000))
  await expect(page).toHaveURL(/\/entitlements\/team-abilities$/)
  await expect(page.getByLabel('团队 slug')).toHaveValue('')
  expect(teamReadRequests).toEqual([])
})

test('Admin prefills the exact slug when granting from a readable Team detail', async ({ page }) => {
  await mockAdminApi(page)
  await page.goto('http://127.0.0.1:5180/teams/7')

  await page.getByRole('link', { name: '开通能力' }).click()
  await expect(page).toHaveURL(/\/entitlements\/team-abilities\?team=demo/)
  await expect(page.getByLabel('团队 slug')).toHaveValue('demo')
})

test('Admin keeps the Team Ability task page open and restricts only its submit action', async ({ page }) => {
  const limited = {
    ...session,
    roles: [{ id: 3, role_key: 'team_reader', name: '团队只读', description: '只读团队', is_system: 0 }],
    permissions: ['admin.team.read'],
    is_super_admin: false,
  }
  await mockAdminApi(page, { session: limited })
  await page.goto('http://127.0.0.1:5180/teams/7')

  const grant = page.getByRole('link', { name: '开通能力' })
  await expect(grant).not.toHaveAttribute('aria-disabled', 'true')
  await grant.click()
  await expect(page).toHaveURL(/\/entitlements\/team-abilities\?team=demo&return=\/teams\/7$/)
  await expect(page.locator('#admin-main').getByRole('heading', { name: '开通团队能力', level: 1 })).toBeVisible()
  await expect(page.locator('#admin-main')).not.toContainText('admin.team.ability.write')
  await expect(page.locator('.n-message').filter({ hasText: formatPermissionDenied(['admin.team.ability.write']) })).toHaveCount(1)
  const submit = page.getByRole('button', { name: '开通能力' })
  await expect(submit).toHaveAttribute('aria-disabled', 'true')
  await expect(submit).not.toHaveAttribute('title')
  await submit.click({ force: true })
  await expect(page.locator('.n-message').filter({ hasText: formatPermissionDenied(['admin.team.ability.write']) })).toHaveCount(1)
})

test('Admin role creation route is refreshable and submits the permission selection', async ({ page }) => {
  await mockAdminApi(page)
  await page.goto('http://127.0.0.1:5180/roles/new')

  await expect(page.getByLabel('角色标识')).toBeVisible()
  await page.getByLabel('角色标识').fill('support_operator')
  await page.getByLabel('角色名称').fill('支持运营')
  await page.getByText('查看平台概览').click()
  const create = page.waitForRequest((request) => request.url().endsWith('/api/roles') && request.method() === 'POST')
  await page.getByRole('button', { name: '保存平台角色' }).click()
  expect((await create).postDataJSON()).toMatchObject({
    role_key: 'support_operator',
    name: '支持运营',
    permission_keys: ['admin.dashboard.read'],
  })
  await expect(page).toHaveURL(/\/roles\/4$/)
})

test('Admin query errors recover on focus without a manual retry action', async ({ page }) => {
  const api = await mockAdminApi(page, { dashboardFailures: Number.MAX_SAFE_INTEGER })
  await page.goto('http://127.0.0.1:5180/')

  await expect(page.getByText('服务暂时不可用，请稍后再试')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: '重试' })).toHaveCount(0)
  api.recoverDashboard()
  const background = await page.context().newPage()
  await background.bringToFront()
  await page.bringToFront()
  await background.close()
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')))
  await expect(page.getByText('128')).toBeVisible()
})
