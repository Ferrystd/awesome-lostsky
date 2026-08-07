import { expect, test, type Page } from '@playwright/test'

const identityToken = (type: string, id: number) =>
  `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type, id } })).toString('base64url')}.x`

async function setToken(page: Page, type: 'team' | 'teamMember' | 'teamVirtual' | 'teamCustomer' = 'team', id = 1) {
  await page.context().addCookies([{
    name: 'lostsky_token', value: identityToken(type, id), domain: '.lostsky.work', path: '/', sameSite: 'Lax',
  }])
}

async function expectHeaderApps(page: Page, headerSelector = '.ls-workspace-header', mobileBreakpoint = 768) {
  const header = page.locator(headerSelector)
  await expect(page.getByRole('button', { name: '切换应用' })).toHaveCount(0)
  if ((page.viewportSize()?.width ?? 0) < mobileBreakpoint) {
    await header.getByRole('button', { name: '操作' }).click()
    for (const label of ['团队', '商品', '记账', '聊天']) {
      await expect(page.getByText(new RegExp(`^${label}(?:（.*）)?$`)).last()).toBeVisible()
    }
    await page.keyboard.press('Escape')
    await expect(page.locator('.n-dropdown-menu:visible')).toHaveCount(0)
  } else {
    for (const label of ['团队', '商品', '记账', '聊天']) {
      await expect(header.getByText(label, { exact: true })).toBeVisible()
    }
    if (headerSelector === '.ls-workspace-header') {
      await expect(header).toHaveClass(/ls-workspace-header--app-nav/)
      const geometry = await header.evaluate(element => {
        const actions = element.querySelector<HTMLElement>('.ls-workspace-header__desktop')!
        const headerBox = element.getBoundingClientRect()
        const actionsBox = actions.getBoundingClientRect()
        const itemBoxes = [...actions.children].map(item => item.getBoundingClientRect())
        const textStyles = [...actions.children].map(item => {
          const style = getComputedStyle(item)
          return { color: style.color, fontSize: style.fontSize, fontWeight: style.fontWeight }
        })
        return {
          width: actionsBox.width,
          rightInset: headerBox.right - actionsBox.right,
          itemWidths: itemBoxes.map(box => box.width),
          gaps: itemBoxes.slice(1).map((box, index) => box.left - itemBoxes[index].right),
          textStyles,
          bodyColor: getComputedStyle(document.body).color,
        }
      })
      expect(geometry.width).toBe(376)
      expect(geometry.rightInset).toBe(24)
      expect(geometry.itemWidths).toEqual([88, 88, 88, 88])
      expect(geometry.gaps).toEqual([8, 8, 8])
      expect(new Set(geometry.textStyles.map(style => JSON.stringify(style))).size).toBe(1)
      expect(geometry.textStyles.every(style => style.color === geometry.bodyColor)).toBe(true)
    }
  }
}

async function expectOverviewLayout(page: Page, label: string) {
  const overview = page.locator('.ls-workspace-overview')
  await expect(overview).toBeVisible()
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
      `${label} overflows at ${width}px`,
    ).toBe(false)
    const targets = overview.locator('a')
    const sizes = await targets.evaluateAll(elements => elements.map(element => {
      const box = element.getBoundingClientRect()
      return { width: box.width, height: box.height }
    }))
    expect(sizes.every(size => size.width >= 44 && size.height >= 44)).toBe(true)
  }
  await page.setViewportSize({ width: 1024, height: 900 })
  const firstLink = overview.locator('a').first()
  await firstLink.focus()
  await expect(firstLink).toBeFocused()
}

function personalResult(type: 'team' | 'teamMember' | 'teamVirtual' = 'team') {
  const isTeam = type === 'team'
  return {
    identity: {
      entity_id: isTeam ? 1 : 101,
      type,
      slug: isTeam ? 'demo' : 'sky-member',
      name: isTeam ? '青空协作组' : '青空成员',
      team: { id: 1, slug: 'demo', name: '青空协作组' },
    },
    profile: {
      name: isTeam ? '青空协作组' : '青空成员',
      avatar: null,
      description: '当前 Entity 的团队内资料',
      intro_image: null,
      intro_video: null,
      introduction_markdown: null,
    },
    custom_fields: [],
    custom_field_values: [],
    role_assignments: [{ role_id: 1, role: { id: 1, name: '所有者', role_key: 'owner', description: '团队创建时自动生成的完整管理角色' } }],
    effective_permissions: [
      { key: 'chat.conversation.create', label: '创建会话', group: '聊天' },
      { key: 'chat.conversation.create', label: '创建会话', group: '聊天' },
      { key: 'chat.group.manage', label: '管理群聊', group: '聊天' },
      { key: 'chat.message.moderate', label: '审核与撤回消息', group: '聊天' },
      { key: 'identity.virtual.*.act', label: '代表全部虚拟实体执行操作', group: '实体委托' },
      { key: 'team.document.read', label: '查看文档', group: '内容' },
      { key: 'team.document.write', label: '维护文档', group: '内容' },
      { key: 'team.customer.read', label: '查看客户', group: '客户' },
      { key: 'team.role.read', label: '查看角色', group: '角色' },
    ],
  }
}

async function mockTeamWorkspace(page: Page, type: 'team' | 'teamMember' | 'teamVirtual' = 'team') {
  await page.route('http://demo.team.lostsky.work:5175/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/personal')
      ? personalResult(type)
      : path.endsWith('/access')
        ? {
            permissions: [],
            abilities: {
              doc: { enabled: true, level: 1, expire_time: 0, reason: null, label: '文档' },
              file: { enabled: true, level: 1, expire_time: 0, reason: null, label: '文件' },
              transaction: { enabled: true, level: 1, expire_time: 0, reason: null, label: '记账' },
            },
            identity: { type },
          }
        : null
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })
}

test('Team keeps its original layout and reaches personal workspace from the overview CTA', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') pageErrors.push(message.text()) })
  await setToken(page, 'team', 1)
  await mockTeamWorkspace(page, 'team')

  await page.goto('http://demo.team.lostsky.work:5175/')
  await expect(page.getByRole('link', { name: '进入个人工作台' })).toHaveAttribute('href', '/personal')
  await expect(page.getByRole('button', { name: '切换应用' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '个人工作台' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '团队工作台' })).toHaveCount(0)
  await expect(page.locator('.sidebar').getByRole('link', { name: '概览' })).toHaveCount(1)

  const header = page.locator('.ls-workspace-header')
  await expectHeaderApps(page)

  await page.getByRole('link', { name: '进入个人工作台' }).click()
  await expect(page).toHaveURL(/\/personal$/)
  await expect.poll(() => pageErrors).toEqual([])
  await expect(page.getByRole('heading', { name: '概览', level: 1 })).toBeVisible()
  await expect(page.getByText(/个人工作台 · Team Entity/)).toBeVisible()
  await expect(page.locator('.sidebar').getByRole('link', { name: '概览' })).toHaveCount(1)
  await expect(page.getByRole('link', { name: '切换身份' })).toHaveCount(1)
  await expect(page.getByRole('link', { name: /进入团队工作台/ })).toHaveAttribute('href', '/')

  await expectOverviewLayout(page, 'Team personal overview')

  await page.setViewportSize({ width: 1024, height: 900 })
  const headerMetrics = () => page.evaluate(() => {
    const header = document.querySelector<HTMLElement>('.ls-workspace-header')!
    const identity = document.querySelector<HTMLElement>('.ls-workspace-header__identity')!
    const actions = document.querySelector<HTMLElement>('.ls-workspace-header__desktop')!
    const headerBox = header.getBoundingClientRect()
    const identityBox = identity.getBoundingClientRect()
    const actionsBox = actions.getBoundingClientRect()
    return {
      headerLeft: headerBox.left,
      headerRight: headerBox.right,
      identityLeft: identityBox.left,
      actionsRight: actionsBox.right,
      actionBoxes: [...actions.children].map(action => {
        const box = action.getBoundingClientRect()
        return { left: box.left, right: box.right, width: box.width }
      }),
      overflowY: getComputedStyle(document.documentElement).overflowY,
    }
  })
  const overviewHeader = await headerMetrics()
  await page.locator('.sidebar').getByRole('link', { name: '资料' }).click()
  await expect(page.locator('#workspace').getByRole('heading', { name: '资料', level: 1 })).toBeVisible()
  expect(await headerMetrics()).toEqual(overviewHeader)
  expect(overviewHeader.overflowY).toBe('scroll')
  await page.locator('.sidebar').getByRole('link', { name: '概览' }).click()
  await page.getByRole('link', { name: /进入团队工作台/ }).click()
  await expect(page).toHaveURL('http://demo.team.lostsky.work:5175/')
})

test('Team personal access keeps expanded permission groups in one vertical column', async ({ page }) => {
  await setToken(page, 'team', 1)
  await mockTeamWorkspace(page, 'team')
  await page.goto('http://demo.team.lostsky.work:5175/personal/access')
  await expect(page.locator('#workspace').getByRole('heading', { name: '角色与有效权限', level: 1 })).toBeVisible()

  const collapse = page.locator('.effective .n-collapse')
  const items = collapse.locator('.n-collapse-item')
  await expect(items).toHaveCount(5)
  await expect(page.getByText('9 项', { exact: true })).toBeVisible()
  await items.first().locator('.n-collapse-item__header').click()
  await expect(page.locator('.effective code').filter({ hasText: /^chat\.conversation\.create$/ })).toHaveCount(2)

  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 })
    const geometry = await collapse.evaluate(element => {
      const collapseBox = element.getBoundingClientRect()
      const itemBoxes = [...element.querySelectorAll<HTMLElement>('.n-collapse-item')].map(item => {
        const box = item.getBoundingClientRect()
        return { left: Math.round(box.left), top: Math.round(box.top), width: Math.round(box.width) }
      })
      return {
        collapseWidth: Math.round(collapseBox.width),
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        itemBoxes,
        documentClientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
      }
    })
    expect(new Set(geometry.itemBoxes.map(item => item.left)).size).toBe(1)
    expect(geometry.itemBoxes.every(item => Math.abs(item.width - geometry.collapseWidth) <= 1)).toBe(true)
    expect(geometry.itemBoxes.slice(1).every((item, index) => item.top > geometry.itemBoxes[index].top)).toBe(true)
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth)
    expect(geometry.documentScrollWidth).toBeLessThanOrEqual(geometry.documentClientWidth)
  }
})

test('legacy Account profile deep link resolves Team and member identities to Team personal workspace', async ({ page }) => {
  await mockTeamWorkspace(page, 'teamMember')
  await page.route('http://account.lostsky.work:5174/api/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data: { kind: 'team-personal', team: { id: 1, slug: 'demo', name: '青空协作组' } } }),
    })
  })

  for (const [type, id] of [['team', 1], ['teamMember', 11]] as const) {
    await setToken(page, type, id)
    await page.goto('http://account.lostsky.work:5174/identity/current/profile')
    await expect(page).toHaveURL('http://demo.team.lostsky.work:5175/personal/profile')
    await expect(page.locator('#workspace').getByRole('heading', { name: '资料', level: 1 })).toBeVisible()
  }
})

test('team workspaces keep a readable overview and disabled Permission entries', async ({ page }) => {
  await setToken(page, 'team', 1)
  let businessRequests = 0
  await page.route('http://demo.shop.lostsky.work:5179/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (!path.endsWith('/manage/access')) businessRequests++
    const data = {
      team: { id: 1, slug: 'demo', name: '青空协作组' },
      permissions: [],
      abilities: { transaction: { enabled: true, level: 1, expire_time: 0, reason: null, label: '记账' } },
      identity: { type: 'team' },
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  await page.goto('http://demo.shop.lostsky.work:5179/manage')
  await expect(page.getByRole('heading', { name: '概览', level: 1 })).toBeVisible()
  await expect(page.locator('#shop-manage-main').getByText('青空协作组')).toBeVisible()
  await expect(page.locator('.ls-workspace-overview__entry.disabled').filter({ hasText: '商品' })).toContainText('缺少 shop.product.read Permission')
  await expect(page.getByRole('link', { name: '进入个人工作台' })).toHaveAttribute('href', '/manage/personal')
  await expect(page.getByRole('button', { name: '个人工作台' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '团队工作台' })).toHaveCount(0)
  await expectHeaderApps(page)
  await expectOverviewLayout(page, 'Shop team overview')
  expect(businessRequests).toBe(0)

  await page.getByRole('link', { name: '进入个人工作台' }).click()
  await expect(page).toHaveURL('http://demo.shop.lostsky.work:5179/manage/personal')
  await expect(page.locator('#shop-manage-main').getByRole('heading', { name: '只查看与你相关的业务订单', level: 2 })).toBeVisible()
  await expect(page.locator('.manage-sidebar').getByRole('link', { name: '概览' })).toHaveCount(1)
  await expect(page.getByRole('link', { name: /进入团队工作台/ })).toHaveAttribute('href', '/manage')
  await expectOverviewLayout(page, 'Shop personal overview')
  expect(businessRequests).toBe(0)
  await page.getByRole('link', { name: /进入团队工作台/ }).click()
  await expect(page).toHaveURL('http://demo.shop.lostsky.work:5179/manage')
})

test('Transaction binds overview first in both team and personal workspaces', async ({ page }) => {
  await setToken(page, 'teamMember', 11)
  let businessRequests = 0
  await page.route('http://demo.transaction.lostsky.work:5177/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (!path.endsWith('/workspace/access')) businessRequests++
    const data = {
      team: { id: 1, slug: 'demo', name: '青空协作组' },
      permissions: [],
      abilities: { transaction: { enabled: true, level: 1, expire_time: 0, reason: null, label: '记账' } },
      identity: { type: 'teamMember' },
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  await page.goto('http://demo.transaction.lostsky.work:5177/overview')
  await expect(page.getByRole('heading', { name: '概览', level: 1 })).toBeVisible()
  await expect(page.locator('.sidebar').getByRole('link', { name: '概览' })).toHaveCount(1)
  await expect(page.getByRole('link', { name: '进入个人工作台' })).toHaveAttribute('href', '/personal')
  await expectOverviewLayout(page, 'Transaction team overview')
  expect(businessRequests).toBe(0)

  await page.getByRole('link', { name: '进入个人工作台' }).click()
  await expect(page).toHaveURL('http://demo.transaction.lostsky.work:5177/personal')
  await expect(page.locator('#workspace').getByRole('heading', { name: '聚焦当前 Entity 的经营参与', level: 2 })).toBeVisible()
  await expect(page.locator('.sidebar').getByRole('link', { name: '概览' })).toHaveCount(1)
  await expect(page.getByRole('link', { name: /进入团队工作台/ })).toHaveAttribute('href', '/overview')
  await expectOverviewLayout(page, 'Transaction personal overview')
  expect(businessRequests).toBe(0)
  await page.getByRole('link', { name: /进入团队工作台/ }).click()
  await expect(page).toHaveURL('http://demo.transaction.lostsky.work:5177/overview')
})

test('missing transaction Ability keeps the app disabled and sends zero business requests', async ({ page }) => {
  await setToken(page, 'team', 1)
  let businessRequests = 0
  await page.route('http://demo.transaction.lostsky.work:5177/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (!path.endsWith('/workspace/access')) businessRequests++
    const data = {
      team: { id: 1, slug: 'demo', name: '青空协作组' },
      permissions: ['transaction'],
      abilities: { transaction: { enabled: false, level: 0, expire_time: 0, reason: 'missing', label: '记账' } },
      identity: { type: 'team' },
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  await page.goto('http://demo.transaction.lostsky.work:5177/')
  await expect(page).toHaveURL('http://demo.transaction.lostsky.work:5177/unavailable')
  await expect(page.locator('#workspace').getByText('记账暂不可用', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '个人工作台' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '团队工作台' })).toHaveCount(0)
  await expectHeaderApps(page)
  expect(businessRequests).toBe(0)
})

test('Chat keeps the four-app switch for Customer and routes Product to the customer center', async ({ page }) => {
  await setToken(page, 'teamCustomer', 31)
  let workspaceAccessRequests = 0
  await page.route('http://demo.chat.lostsky.work:5176/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/workspace/access')) workspaceAccessRequests++
    const data = path.endsWith('/conversation') || path.endsWith('/actor') ? [] : null
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })
  await page.route('http://demo.shop.lostsky.work:5179/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/customer/me')
      ? { id: 31, nickname: '青空客户', slug: 'sky-customer', avatar: null, description: '', assignee_entity_id: null, balance: '0.00' }
      : []
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  await page.goto('http://demo.chat.lostsky.work:5176/')
  await expect(page.getByRole('button', { name: '切换应用' })).toHaveCount(0)
  expect(workspaceAccessRequests).toBe(0)

  for (const width of [320, 375, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  }

  const topbar = page.locator('.topbar')
  await expect(topbar.locator('.app-links').getByRole('link', { name: '商品' })).toBeVisible()
  await expect(topbar.getByRole('button', { name: '团队不可用：客户不进入后台工作台' })).toBeVisible()
  await expect(topbar.getByRole('button', { name: '记账不可用：客户不进入后台工作台' })).toBeVisible()
  await topbar.locator('.app-links').getByRole('link', { name: '商品' }).click()
  await expect(page).toHaveURL('http://demo.shop.lostsky.work:5179/customer/profile')
})

test('Customer direct backend links resolve to the Shop customer center', async ({ page }) => {
  await setToken(page, 'teamCustomer', 31)
  await page.route('http://demo.shop.lostsky.work:5179/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/customer/me')
      ? { id: 31, nickname: '青空客户', slug: 'sky-customer', avatar: null, description: '', assignee_entity_id: null, balance: '0.00' }
      : []
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  for (const url of [
    'http://demo.team.lostsky.work:5175/',
    'http://demo.transaction.lostsky.work:5177/',
    'http://demo.shop.lostsky.work:5179/manage',
  ]) {
    await page.goto(url)
    await expect(page).toHaveURL('http://demo.shop.lostsky.work:5179/customer/profile')
  }
})
