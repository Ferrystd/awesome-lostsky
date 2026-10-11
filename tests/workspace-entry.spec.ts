import { expect, test, type Page } from './fixtures'
import { formatAbilityDenied, formatPermissionDenied } from '../frontend/packages/api/src/error-format'

const identityToken = (type: string, id: number) => `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type, id } })).toString('base64url')}.x`

async function setToken(page: Page, type: 'team' | 'teamMember' | 'teamVirtual' | 'teamCustomer' = 'team', id = 1) {
  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: identityToken(type, id),
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
}

async function expectHeaderApps(page: Page, headerSelector = '.ls-workspace-header', mobileBreakpoint = 768) {
  const header = page.locator(headerSelector)
  if ((page.viewportSize()?.width ?? 0) < mobileBreakpoint) {
    await header.getByRole('button', { name: '切换应用' }).click()
    for (const label of ['团队', '商品', '记账', '聊天', '社区', '微博']) {
      await expect(page.getByText(new RegExp(`^${label}(?:（.*）)?$`)).last()).toBeVisible()
    }
    await page.keyboard.press('Escape')
    await expect(page.locator('.ls-workspace-apps:visible')).toHaveCount(0)
  } else {
    for (const label of ['团队', '商品', '记账', '聊天', '社区', '微博']) {
      await expect(header.getByText(label, { exact: true })).toBeVisible()
    }
    if (headerSelector === '.ls-workspace-header') {
      await expect(header).toHaveClass(/ls-workspace-header--app-nav/)
      const geometry = await header.evaluate((element) => {
        const actions = element.querySelector<HTMLElement>('.ls-workspace-header__desktop')!
        const headerBox = element.getBoundingClientRect()
        const actionsBox = actions.getBoundingClientRect()
        const itemBoxes = [...actions.children].map((item) => item.getBoundingClientRect())
        const textStyles = [...actions.children].map((item) => {
          const style = getComputedStyle(item)
          return {
            color: style.color,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
          }
        })
        return {
          width: actionsBox.width,
          rightInset: headerBox.right - actionsBox.right,
          itemWidths: itemBoxes.map((box) => box.width),
          gaps: itemBoxes.slice(1).map((box, index) => box.left - itemBoxes[index].right),
          textStyles,
          bodyColor: getComputedStyle(document.body).color,
        }
      })
      expect(geometry.width).toBe(568)
      expect(geometry.rightInset).toBe(24)
      expect(geometry.itemWidths).toEqual([88, 88, 88, 88, 88, 88])
      expect(geometry.gaps).toEqual([8, 8, 8, 8, 8])
      expect(new Set(geometry.textStyles.map((style) => JSON.stringify(style))).size).toBe(1)
      expect(geometry.textStyles.every((style) => style.color === geometry.bodyColor)).toBe(true)
    }
  }
}

async function expectOverviewLayout(page: Page, label: string) {
  const overview = page.locator('.ls-workspace-overview')
  await expect(overview).toBeVisible()
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `${label} overflows at ${width}px`).toBe(false)
    const targets = overview.locator('a')
    const sizes = await targets.evaluateAll((elements) =>
      elements.map((element) => {
        const box = element.getBoundingClientRect()
        return { width: box.width, height: box.height }
      }),
    )
    expect(sizes.every((size) => size.width >= 44 && size.height >= 44)).toBe(true)
    if (width >= 800) {
      await expect(overview.locator('.ls-workspace-overview__hero')).toHaveCSS('height', '188px')
    }
  }
  await page.setViewportSize({ width: 1024, height: 900 })
  const firstLink = overview.locator('a').first()
  await firstLink.focus()
  await expect(firstLink).toBeFocused()
}

const communityWorkspaces = [
    ['http://demo.team.lostsky.work:5175', '/', '/access'],
    ['http://demo.shop.lostsky.work:5179', '/manage', '/manage/access'],
    ['http://demo.transaction.lostsky.work:5177', '/', '/workspace/access'],
    ['http://demo.weibo.lostsky.work:5181', '/overview', '/workspace/access'],
] as const
for (const [origin, path, accessPath] of communityWorkspaces) {
  test(`shared Community navigation stays alongside Chat in ${origin}`, async ({ page }) => {
    await setToken(page, 'teamMember', 11)
    const access = { team: { id: 1, slug: 'demo', name: '测试团队' }, permissions: [], abilities: {}, identity: { type: 'teamMember', entity_id: 101, name: '成员', belongs_to_team: true, is_external: false } }
    await page.route(`${origin}/api/**`, async route => {
      const requestPath = new URL(route.request().url()).pathname
      expect([`/api${accessPath}`, '/api/dashboard']).toContain(requestPath)
      const data = requestPath === '/api/dashboard' ? Object.fromEntries(['entities', 'members', 'documents', 'notices'].map(key => [key, { available: false, count: null, error: null, reason: null }])) : access
      await route.fulfill({ json: { code: 0, data } })
    })
    await page.goto(`${origin}${path}`)
    await expect(page.locator('.ls-workspace-header')).toBeVisible()
    await page.mouse.move(0, 0)
    await expect(page.locator('.n-message')).toHaveCount(0)
    for (const width of [320, 768, 900, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await expectHeaderApps(page)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${origin} at ${width}px`).toBe(true)
    }
    await expect(page.locator('.ls-workspace-header').getByRole('link', { name: '社区', exact: true })).toHaveAttribute('href', 'http://community.lostsky.work:5182/')
    await page.setViewportSize({ width: 375, height: 900 })
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    if (origin === 'http://demo.weibo.lostsky.work:5181') {
      await page.mouse.move(0, 0)
      await expect(page.locator('.n-message')).toHaveCount(0)
    }
    await expectHeaderApps(page)
    await page.evaluate(() => { document.documentElement.style.fontSize = '' })
  })
}
test('shared Community navigation remains available for customer Chat without an owning team', async ({ page }) => {
  await setToken(page, 'teamCustomer', 31)
  await page.route('http://chat.lostsky.work:5176/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    expect(['/api/actor', '/api/conversation']).toContain(path)
    await route.fulfill({ json: { code: 0, data: path === '/api/actor' ? { id: 31, slug: 'customer', name: '顾客', type: 'customer', team: null } : [] } })
  })
  await page.goto('http://chat.lostsky.work:5176/')
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(page.locator('.app-links').getByRole('link', { name: '社区', exact: true })).toHaveAttribute('href', 'http://community.lostsky.work:5182/')
  await page.setViewportSize({ width: 375, height: 900 })
  await page.locator('.app-menu').getByRole('button', { name: '切换应用' }).click()
  await expect(page.locator('.ls-workspace-apps:visible').getByText('社区', { exact: true })).toBeVisible()
})

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
      description: '当前人员的团队内资料',
      intro_image: null,
      intro_video: null,
      introduction_markdown: null,
    },
    custom_fields: [],
    custom_field_values: [],
    role_assignments: [
      {
        role_id: 1,
        role: {
          id: 1,
          name: '所有者',
          role_key: 'owner',
          description: '团队创建时自动生成的完整管理角色',
        },
      },
    ],
    effective_permissions: [
      { key: 'chat.conversation.create', label: '创建会话', group: '聊天' },
      { key: 'chat.conversation.create', label: '创建会话', group: '聊天' },
      { key: 'chat.group.manage', label: '管理群聊', group: '聊天' },
      { key: 'chat.message.moderate', label: '审核与撤回消息', group: '聊天' },
      {
        key: 'chat.virtual.*.act',
        label: '代表全部虚拟人员参与聊天',
        group: '聊天',
      },
      { key: 'team.document.read', label: '查看全部文档', group: '文档管理' },
      {
        key: 'team.document.customer.*.manage',
        label: '管理全部顾客文档',
        group: '文档管理',
      },
      { key: 'team.customer.read', label: '查看顾客', group: '顾客' },
      { key: 'team.role.read', label: '查看角色', group: '角色' },
    ],
  }
}

async function mockTeamWorkspace(page: Page, type: 'team' | 'teamMember' | 'teamVirtual' = 'team') {
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/personal')
      ? personalResult(type)
      : path.endsWith('/access')
        ? {
            permissions: [],
            abilities: {
              doc: {
                enabled: true,
                level: 1,
                expire_time: 0,
                reason: null,
                label: '文档',
              },
              file: {
                enabled: true,
                level: 1,
                expire_time: 0,
                reason: null,
                label: '文件',
              },
              transaction: {
                enabled: true,
                level: 1,
                expire_time: 0,
                reason: null,
                label: '记账',
              },
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

test('Team resource dashboard reaches personal workspace from the overview CTA', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(message.text())
  })
  await setToken(page, 'team', 1)
  await mockTeamWorkspace(page, 'team')

  await page.goto('http://demo.team.lostsky.work:5175/')
  await expect(page.getByRole('link', { name: '进入个人工作台' })).toHaveAttribute('href', '/personal')
  await expect(page.getByRole('button', { name: '个人工作台' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '团队工作台' })).toHaveCount(0)
  await expect(page.locator('.sidebar').getByRole('link', { name: '概览' })).toHaveCount(1)
  const header = page.locator('.ls-workspace-header')
  await expectHeaderApps(page)

  await page.setViewportSize({ width: 910, height: 900 })
  const personalDesktopRect = await page.getByRole('link', { name: '进入个人工作台' }).evaluate((element) => element.getBoundingClientRect().toJSON())
  const documentDesktopRect = await page.getByRole('link', { name: '使用文档' }).evaluate((element) => element.getBoundingClientRect().toJSON())
  expect(personalDesktopRect.width).toBeGreaterThan(documentDesktopRect.width)
  expect(Math.abs(personalDesktopRect.height - documentDesktopRect.height)).toBeLessThanOrEqual(1)

  await page.getByRole('link', { name: '进入个人工作台' }).click()
  await expect(page).toHaveURL(/\/personal$/)
  await expect.poll(() => pageErrors).toEqual([])
  await expect(page.getByRole('heading', { name: '概览', level: 1 })).toBeVisible()
  await expect(page.getByText(/个人工作台 · 团队身份/)).toBeVisible()
  await expect(page.locator('.sidebar').getByRole('link', { name: '概览' })).toHaveCount(1)
  const personalSidebar = page.locator('.sidebar')
  const personalOverview = page.locator('.ls-workspace-overview')
  await expect(personalSidebar.getByRole('link', { name: '切换身份' })).toHaveCount(1)
  await expect(personalOverview.getByRole('link', { name: '使用文档' })).toHaveCount(1)
  await expect(personalOverview.getByRole('link', { name: /进入团队工作台/ })).toHaveAttribute('href', '/')
  await expect(personalSidebar.getByRole('link', { name: '切换身份' })).toHaveAttribute('href', /^http:\/\/account\.lostsky\.work:5174\/identity\?/)
  await expect(personalOverview.getByRole('link', { name: '使用文档' })).toHaveAttribute('target', '_blank')

  const teamDesktopRect = await personalOverview.getByRole('link', { name: /进入团队工作台/ }).evaluate((element) => element.getBoundingClientRect().toJSON())
  const personalDocumentDesktopRect = await personalOverview.getByRole('link', { name: '使用文档' }).evaluate((element) => element.getBoundingClientRect().toJSON())
  expect(teamDesktopRect.width).toBeGreaterThan(personalDocumentDesktopRect.width)
  expect(Math.abs(teamDesktopRect.height - personalDocumentDesktopRect.height)).toBeLessThanOrEqual(1)
  expect(Math.abs(documentDesktopRect.width - personalDocumentDesktopRect.width)).toBeLessThanOrEqual(1)

  await page.setViewportSize({ width: 375, height: 812 })
  const personalDocumentMobileWidth = await personalOverview.getByRole('link', { name: '使用文档' }).evaluate((element) => element.getBoundingClientRect().width)
  await page.goto('http://demo.team.lostsky.work:5175/')
  const personalMobileWidth = await page.getByRole('link', { name: '进入个人工作台' }).evaluate((element) => element.getBoundingClientRect().width)
  const documentMobileWidth = await page.getByRole('link', { name: '使用文档' }).evaluate((element) => element.getBoundingClientRect().width)
  expect(Math.abs(personalMobileWidth - documentMobileWidth)).toBeLessThanOrEqual(1)
  expect(Math.abs(documentMobileWidth - personalDocumentMobileWidth)).toBeLessThanOrEqual(1)

  await page.goto('http://demo.team.lostsky.work:5175/personal')

  await expectOverviewLayout(page, 'Team personal overview')

  await page.setViewportSize({ width: 1024, height: 900 })
  const headerMetrics = () =>
    page.evaluate(() => {
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
        actionBoxes: [...actions.children].map((action) => {
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
  await expect(page.locator('#workspace').getByRole('heading', { name: '角色与权限', level: 1 })).toBeVisible()

  const collapse = page.locator('.effective .n-collapse')
  const items = collapse.locator('.n-collapse-item')
  await expect(items).toHaveCount(4)
  await expect(page.getByText('9 项', { exact: true })).toBeVisible()
  await items.first().locator('.n-collapse-item__header').click()
  await expect(page.locator('.effective code').filter({ hasText: /^chat\.conversation\.create$/ })).toHaveCount(2)
  await expect(page.locator('.effective code').filter({ hasText: /^chat\.virtual\.\*\.act$/ })).toHaveCount(1)

  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 })
    const geometry = await collapse.evaluate((element) => {
      const collapseBox = element.getBoundingClientRect()
      const itemBoxes = [...element.querySelectorAll<HTMLElement>('.n-collapse-item')].map((item) => {
        const box = item.getBoundingClientRect()
        return {
          left: Math.round(box.left),
          top: Math.round(box.top),
          width: Math.round(box.width),
        }
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
    expect(new Set(geometry.itemBoxes.map((item) => item.left)).size).toBe(1)
    expect(geometry.itemBoxes.every((item) => Math.abs(item.width - geometry.collapseWidth) <= 1)).toBe(true)
    expect(geometry.itemBoxes.slice(1).every((item, index) => item.top > geometry.itemBoxes[index].top)).toBe(true)
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth)
    expect(geometry.documentScrollWidth).toBeLessThanOrEqual(geometry.documentClientWidth)
  }
})

test('legacy Account profile deep link resolves Team and member identities to Team personal workspace', async ({ page }) => {
  await mockTeamWorkspace(page, 'teamMember')
  await page.route('http://account.lostsky.work:5174/api/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: 'ok',
        data: {
          kind: 'team-personal',
          team: { id: 1, slug: 'demo', name: '青空协作组' },
        },
      }),
    })
  })

  for (const [type, id] of [
    ['team', 1],
    ['teamMember', 11],
  ] as const) {
    await setToken(page, type, id)
    await page.goto('http://account.lostsky.work:5174/identity/current/profile')
    await expect(page).toHaveURL('http://demo.team.lostsky.work:5175/personal/profile')
    await expect(page.locator('#workspace').getByRole('heading', { name: '资料', level: 1 })).toBeVisible()
  }
})

test('team workspaces keep all entries open and degrade protected pages by data shape', async ({ page }) => {
  await setToken(page, 'team', 1)
  let businessRequests = 0
  await page.route('http://demo.shop.lostsky.work:5179/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (!path.endsWith('/manage/access')) businessRequests++
    const data = {
      team: { id: 1, slug: 'demo', name: '青空协作组' },
      permissions: [],
      abilities: {
        transaction: {
          enabled: true,
          level: 1,
          expire_time: 0,
          reason: null,
          label: '记账',
        },
      },
      identity: {
        type: 'team',
        entity_id: 1,
        name: '青空协作组',
        slug: 'demo',
        avatar: '',
      },
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.shop.lostsky.work:5179/manage')
  await expect(page.getByRole('heading', { name: '概览', level: 1 })).toBeVisible()
  await expect(page.locator('.manage-sidebar').getByRole('link', { name: '切换身份' })).toHaveCSS('justify-content', 'flex-start')
  await expect(page.locator('#shop-manage-main').getByRole('heading', { name: '青空协作组', exact: true })).toBeVisible()
  const productsEntry = page.locator('.ls-dashboard-path a[href="/manage/products"]')
  await expect(productsEntry).toHaveAttribute('href', '/manage/products')
  await expect(productsEntry.locator('.lucide-arrow-up-right')).toBeVisible()
  await expect(page.getByRole('link', { name: '进入个人工作台' })).toHaveAttribute('href', '/manage/personal')
  await expect(page.getByRole('button', { name: '个人工作台' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '团队工作台' })).toHaveCount(0)
  await expectHeaderApps(page)
  await expectOverviewLayout(page, 'Shop team overview')
  const productLabelOffset = await page.locator('.manage-sidebar').evaluate((sidebar) => {
    const overview = sidebar.querySelector<HTMLElement>('nav a[href="/manage"] span')!
    const product = sidebar.querySelector<HTMLElement>('nav a[href="/manage/products"] span')!
    return Math.abs(overview.getBoundingClientRect().x - product.getBoundingClientRect().x)
  })
  expect(productLabelOffset).toBeLessThanOrEqual(1)
  expect(businessRequests).toBe(0)

  await productsEntry.click()
  await expect(page).toHaveURL('http://demo.shop.lostsky.work:5179/manage/products')
  await expect(page.locator('.ls-empty-state')).toContainText('shop.product.read')
  await expect(page.locator('.n-message').filter({ hasText: formatPermissionDenied(['shop.product.read']) })).toHaveCount(1)
  expect(businessRequests).toBe(0)
  await page.goto('http://demo.shop.lostsky.work:5179/manage')

  await page.getByRole('link', { name: '进入个人工作台' }).click()
  await expect(page).toHaveURL('http://demo.shop.lostsky.work:5179/manage/personal')
  await expect(page.locator('#shop-manage-main').getByRole('heading', { name: '青空协作组', level: 2 })).toBeVisible()
  await expect(page.locator('.manage-sidebar').getByRole('link', { name: '概览' })).toHaveCount(1)
  await expect(page.locator('.manage-sidebar a[href="/manage/personal/products"]')).toBeVisible()
  const personalProductsEntry = page.locator('.ls-workspace-overview__entry, .ls-dashboard-path a').filter({ hasText: '我的商品' })
  await expect(personalProductsEntry).toHaveAttribute('href', '/manage/personal/products')
  await expect(page.getByRole('link', { name: /进入团队工作台/ })).toHaveAttribute('href', '/manage')
  await expectOverviewLayout(page, 'Shop personal overview')
  expect(businessRequests).toBe(0)
  await page.goto('http://demo.shop.lostsky.work:5179/manage/personal/products')
  await expect(page).toHaveURL('http://demo.shop.lostsky.work:5179/manage/personal/products')
  await expect(page.locator('.ls-empty-state')).toContainText('shop.product.self.manage')
  await expect(page.locator('.n-message').filter({ hasText: formatPermissionDenied(['shop.product.self.manage']) })).toHaveCount(1)
  expect(businessRequests).toBe(0)
  await page.goto('http://demo.shop.lostsky.work:5179/manage/personal')
  await page.getByRole('link', { name: /进入团队工作台/ }).click()
  await expect(page).toHaveURL('http://demo.shop.lostsky.work:5179/manage')
})

test('Transaction root opens the team overview by default', async ({ page }) => {
  await setToken(page, 'teamMember', 11)
  let businessRequests = 0
  await page.route('http://demo.transaction.lostsky.work:5177/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (!path.endsWith('/workspace/access')) businessRequests++
    const data = {
      team: { id: 1, slug: 'demo', name: '青空协作组' },
      permissions: ['transaction.read'],
      abilities: {
        transaction: {
          enabled: true,
          level: 1,
          expire_time: 0,
          reason: null,
          label: '记账',
        },
      },
      identity: {
        type: 'teamMember',
        entity_id: 11,
        name: '青空接单人',
        slug: 'handler',
        avatar: '',
      },
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.transaction.lostsky.work:5177/')
  await expect(page).toHaveURL('http://demo.transaction.lostsky.work:5177/overview')
  await expect(page.getByRole('heading', { name: '概览', level: 1 })).toBeVisible()
  await expect(page.locator('.sidebar').getByRole('link', { name: '团队流水' })).toHaveAttribute('href', '/transactions')
  expect(businessRequests).toBe(0)
})

test('Transaction binds overview first in both team and personal workspaces', async ({ page }) => {
  await setToken(page, 'teamMember', 11)
  let businessRequests = 0
  let grantOptionRequests = 0
  await page.route('http://demo.transaction.lostsky.work:5177/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (!path.endsWith('/workspace/access')) businessRequests++
    if (path.endsWith('/personal/entitlement-grant/options')) grantOptionRequests++
    const access = {
      team: { id: 1, slug: 'demo', name: '青空协作组' },
      permissions: [],
      abilities: {
        transaction: {
          enabled: true,
          level: 1,
          expire_time: 0,
          reason: null,
          label: '记账',
        },
      },
      identity: {
        type: 'teamMember',
        entity_id: 11,
        name: '青空接单人',
        slug: 'handler',
        avatar: '',
      },
    }
    let data: unknown = access
    if (path.endsWith('/personal/entitlements')) data = { total: 0, list: [], page: 1, limit: 20 }
    else if (path.endsWith('/personal/transactions')) data = { total: 0, list: [], page: 1, limit: 20 }
    else if (path.endsWith('/personal/stats'))
      data = {
        handler_count: 0,
        sender_count: 0,
        cs_count: 0,
        monthly_performance_total: 0,
        monthly_flow_total: 0,
        performance_total: 0,
      }
    else if (path.endsWith('/personal/services'))
      data = {
        total: 0,
        list: [],
        offers: [],
        available: [],
        page: 1,
        limit: 20,
      }
    else if (path.endsWith('/personal/customers'))
      data = {
        total: 2,
        page: 1,
        limit: 20,
        list: [
          {
            id: 8,
            entity_id: 108,
            slug: 'customer-8',
            name: '晚风顾客',
            avatar: null,
            is_blocked: false,
            balance: {
              balance: '120.00',
              recharged: '200.00',
              spent: '80.00',
            },
            is_assignee: true,
            is_sender: false,
          },
          {
            id: 9,
            entity_id: 109,
            slug: 'customer-9',
            name: '星河顾客',
            avatar: null,
            is_blocked: false,
            balance: { balance: '0.00', recharged: '0.00', spent: '0.00' },
            is_assignee: true,
            is_sender: true,
          },
        ],
      }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.transaction.lostsky.work:5177/overview')
  await expect(page.getByRole('heading', { name: '概览', level: 1 })).toBeVisible()
  await expect(page.locator('.sidebar').getByRole('link', { name: '切换身份' })).toHaveCSS('justify-content', 'flex-start')
  await expect(page.locator('.sidebar').getByRole('link', { name: '概览' })).toHaveCount(1)
  await expect(page.getByRole('link', { name: '进入个人工作台' })).toHaveAttribute('href', '/personal')
  await expect(page.locator('.sidebar').getByText('登记流水', { exact: true })).toHaveCount(0)
  const redemptionPermissions = ['service.redemption.read', 'service.redemption.manage']
  await expect(page.locator('.sidebar').getByRole('link', { name: '权益核销' })).toHaveAttribute('href', '/services')
  const redemptionEntry = page.locator('.ls-workspace-overview__entry, .ls-dashboard-path a').filter({ hasText: '权益核销' })
  await expect(redemptionEntry).toHaveAttribute('href', '/services')
  await expectOverviewLayout(page, 'Transaction team overview')
  expect(businessRequests).toBe(0)

  await page.goto('http://demo.transaction.lostsky.work:5177/services')
  await expect(page).toHaveURL('http://demo.transaction.lostsky.work:5177/services')
  await expect(page.locator('.ls-empty-state')).toContainText('service.redemption.read')
  await expect(page.locator('.n-message').filter({ hasText: formatPermissionDenied(redemptionPermissions) })).toHaveCount(1)
  expect(businessRequests).toBe(0)

  await page.goto('http://demo.transaction.lostsky.work:5177/overview')
  await page.getByRole('link', { name: '进入个人工作台' }).click()
  await expect(page).toHaveURL('http://demo.transaction.lostsky.work:5177/personal')
  await expect(page.locator('#workspace').getByRole('heading', { name: '青空接单人', level: 2 })).toBeVisible()
  await expect(page.locator('#workspace')).toContainText('@handler')
  await expect(page.locator('.sidebar').getByRole('link', { name: '概览' })).toHaveCount(1)
  await expect(page.locator('.sidebar').getByText('登记流水', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /进入团队工作台/ })).toHaveAttribute('href', '/overview')
  const personalEntries = [
    ['我的流水', '/personal/transactions'],
    ['我的接单', '/personal/services'],
    ['我的顾客', '/personal/customers'],
    ['权益下发', '/personal/entitlements'],
  ] as const
  for (const [label, href] of personalEntries) {
    await expect(page.locator('.sidebar').getByRole('link', { name: label })).toHaveAttribute('href', href)
    await expect(page.locator('.ls-workspace-overview__entry, .ls-dashboard-path a').filter({ hasText: label })).toHaveAttribute('href', href)
  }
  await expectOverviewLayout(page, 'Transaction personal overview')
  await expect(page.getByLabel('个人业务统计').locator('dd')).toHaveText(['0', '0', '0', '¥0.00', '¥0.00', '¥0.00'])
  expect(businessRequests).toBe(1)

  for (const [path, title] of [
    ['/personal/transactions', '我的流水'],
    ['/personal/services', '我的接单'],
    ['/personal/customers', '我的顾客'],
  ] as const) {
    await page.goto(`http://demo.transaction.lostsky.work:5177${path}`)
    await expect(page).toHaveURL(`http://demo.transaction.lostsky.work:5177${path}`)
    await expect(page.locator('#workspace').getByRole('heading', { name: title, level: 1 })).toBeVisible()
    if (path === '/personal/transactions') {
      for (const label of ['总接单数', '总发单数', '总接待数', '月度业绩', '月度流水', '个人业绩']) {
        await expect(page.locator('.ls-metric-grid').getByText(label, { exact: true })).toBeVisible()
      }
      await expect(page.locator('.sidebar').getByText('我的业绩', { exact: true })).toHaveCount(0)
    }
  }

  await page.goto('http://demo.transaction.lostsky.work:5177/personal/customers')
  await expect(page.getByText('晚风顾客', { exact: true })).toBeVisible()
  await expect(page.getByText('星河顾客', { exact: true })).toBeVisible()
  await expect(page.getByText('当前归属', { exact: true })).toHaveCount(2)
  await expect(page.getByText('协作发单', { exact: true })).toHaveCount(1)
  await page.goto('http://demo.transaction.lostsky.work:5177/personal/bindings')
  await expect(page).toHaveURL('http://demo.transaction.lostsky.work:5177/personal/customers')

  await page.goto('http://demo.transaction.lostsky.work:5177/personal')
  await page
    .getByRole('link', { name: /权益下发/ })
    .last()
    .click()
  await expect(page).toHaveURL('http://demo.transaction.lostsky.work:5177/personal/entitlements')
  await expect(page.locator('#workspace').getByRole('heading', { name: '权益下发', level: 1 })).toBeVisible()
  const grantEntry = page.getByRole('link', { name: '下发权益' })
  await expect(grantEntry).not.toHaveAttribute('aria-disabled', 'true')
  await grantEntry.click()
  await expect(page).toHaveURL('http://demo.transaction.lostsky.work:5177/personal/entitlements/new')
  await expect(page.locator('#workspace')).toContainText('-')
  const grantButton = page.getByRole('button', { name: '下发权益' })
  await expect(grantButton).toHaveAttribute('aria-disabled', 'true')
  await expect(grantButton).not.toHaveAttribute('title')
  await grantButton.click({ force: true })
  await expect(
    page.locator('.n-message').filter({
      hasText: formatPermissionDenied(['service.entitlement.grant']),
    }),
  ).toBeVisible()
  // 包含个人概览新增的本人业绩读取。
  expect(businessRequests).toBe(9)
  expect(grantOptionRequests).toBe(0)
  await page.locator('.sidebar').getByRole('link', { name: '概览' }).click()
  await page.getByRole('link', { name: /进入团队工作台/ }).click()
  await expect(page).toHaveURL('http://demo.transaction.lostsky.work:5177/overview')
})

test('missing transaction Ability keeps the app entry available and explains only after a guarded action', async ({ page }) => {
  await setToken(page, 'team', 1)
  let businessRequests = 0
  let grantOptionRequests = 0
  await page.route('http://demo.transaction.lostsky.work:5177/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (!path.endsWith('/workspace/access')) businessRequests++
    if (path.endsWith('/personal/entitlement-grant/options')) grantOptionRequests++
    const data = path.endsWith('/personal/entitlements')
      ? { list: [], total: 0 }
      : path.endsWith('/personal/entitlement-grant/options')
        ? {
            products: [{ id: 3, name: '体验权益包', price: '99.00' }],
            customers: [{ id: 8, name: '晚风顾客' }],
            entities: [],
            sync_transaction: false,
          }
        : {
          team: { id: 1, slug: 'demo', name: '青空协作组' },
          permissions: ['transaction', 'service.entitlement.grant'],
          abilities: {
            transaction: {
              enabled: false,
              level: 0,
              expire_time: 0,
              reason: 'missing',
              label: '记账',
            },
          },
          identity: {
            type: 'team',
            entity_id: 1,
            name: '青空协作组',
            slug: 'demo',
            avatar: '',
          },
        }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.transaction.lostsky.work:5177/')
  await expect(page).toHaveURL('http://demo.transaction.lostsky.work:5177/overview')
  await expect(page.getByRole('heading', { name: '概览', level: 1 })).toBeVisible()
  await expectHeaderApps(page)
  await page.goto('http://demo.transaction.lostsky.work:5177/personal/entitlements')
  await page.getByRole('link', { name: '下发权益' }).click()
  await expect(page).toHaveURL('http://demo.transaction.lostsky.work:5177/personal/entitlements/new')
  const grantButton = page.getByRole('button', { name: '下发权益' })
  await expect(grantButton).toHaveAttribute('aria-disabled', 'true')
  await grantButton.click({ force: true })
  await expect(page.locator('.n-message').filter({ hasText: formatAbilityDenied('transaction', '记账') })).toBeVisible()
  expect(grantOptionRequests).toBe(1)
  expect(businessRequests).toBe(2)
})

test('Chat keeps the six-app switch for Customer and routes Product to the customer center', async ({ page }) => {
  await setToken(page, 'teamCustomer', 31)
  let workspaceAccessRequests = 0
  await page.route('http://chat.lostsky.work:5176/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/workspace/access')) workspaceAccessRequests++
    const data = path.endsWith('/actor')
      ? { id: 31, slug: 'sky-customer', name: '青空顾客', type: 'customer', avatar: null, team: { id: 1, slug: 'demo', name: '青空团队' } }
      : path.endsWith('/conversation') ? [] : null
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })
  await page.route('http://demo.shop.lostsky.work:5179/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/customer/me')
      ? {
          id: 31,
          nickname: '青空顾客',
          slug: 'sky-customer',
          avatar: null,
          description: '',
          assignee_entity_id: null,
          balance: '0.00',
        }
      : []
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://chat.lostsky.work:5176/')
  expect(workspaceAccessRequests).toBe(0)

  for (const width of [320, 375, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  }

  const topbar = page.locator('.topbar')
  await expect(topbar.locator('.app-links').getByRole('link', { name: '商品' })).toBeVisible()
  await expect(topbar.getByRole('button', { name: '团队不可用：顾客不进入后台工作台' })).toBeVisible()
  await expect(topbar.getByRole('button', { name: '记账不可用：顾客不进入后台工作台' })).toBeVisible()
  await expect(topbar.locator('.app-links').getByRole('link', { name: '商品' })).toHaveAttribute('href', 'http://demo.shop.lostsky.work:5179/customer/profile')
  await topbar.locator('.app-links').getByRole('link', { name: '商品' }).click()
  await expect(page).toHaveURL('http://demo.shop.lostsky.work:5179/customer/profile')
})

test('an internal Customer Entity may enter team workspaces without an identity redirect', async ({ page }) => {
  await setToken(page, 'teamCustomer', 31)
  const access = {
    team: { id: 1, slug: 'demo', name: '青空协作组' },
    permissions: [],
    abilities: {},
    identity: {
      type: 'teamCustomer',
      entity_id: 31,
      name: '青空顾客',
      slug: 'customer',
      avatar: null,
      belongs_to_team: true,
      is_external: false,
    },
    entry_warning: { required: false, kind: null, ttl_seconds: 86400 },
  }
  for (const [origin, suffix] of [
    ['http://demo.team.lostsky.work:5175', '/access'],
    ['http://demo.transaction.lostsky.work:5177', '/workspace/access'],
    ['http://demo.shop.lostsky.work:5179', '/manage/access'],
  ] as const)
    await page.route(`${origin}/api/**`, async (route) => {
      const path = new URL(route.request().url()).pathname
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          message: 'ok',
          data: path.endsWith(suffix) ? access : null,
        }),
      })
    })

  for (const url of ['http://demo.team.lostsky.work:5175/', 'http://demo.transaction.lostsky.work:5177/', 'http://demo.shop.lostsky.work:5179/manage']) {
    await page.goto(url)
    await expect(page).toHaveURL(url)
  }
})

test('an external Entity sees one shared warning before any of the four team workspaces renders business pages', async ({ page }) => {
  await setToken(page, 'teamMember', 71)
  const access = {
    team: { id: 2, slug: 'demo', name: '目标团队' },
    permissions: [],
    abilities: {},
    identity: {
      type: 'teamMember',
      entity_id: 71,
      name: '外部成员',
      slug: 'outside',
      avatar: null,
      belongs_to_team: false,
      is_external: true,
    },
    entry_warning: {
      required: true,
      kind: 'external_entity',
      ttl_seconds: 86400,
    },
  }
  for (const [origin, suffix] of [
    ['http://demo.team.lostsky.work:5175', '/access'],
    ['http://demo.shop.lostsky.work:5179', '/manage/access'],
    ['http://demo.transaction.lostsky.work:5177', '/workspace/access'],
    ['http://demo.weibo.lostsky.work:5181', '/workspace/access'],
  ] as const) {
    await page.route(`${origin}/api/**`, async (route) => {
      const path = new URL(route.request().url()).pathname
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          message: 'ok',
          data: path.endsWith(suffix) ? access : null,
        }),
      })
    })
  }

  await page.route('http://account.lostsky.work:5174/api/identity/workspace-warning?**', async (route) => {
    expect(route.request().method()).toBe('GET')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data: { ...access, can_continue: true } }),
    })
  })

  for (const url of ['http://demo.team.lostsky.work:5175/', 'http://demo.shop.lostsky.work:5179/manage', 'http://demo.transaction.lostsky.work:5177/overview', 'http://demo.weibo.lostsky.work:5181/overview']) {
    await page.goto(url)
    await expect(page).toHaveURL(/^http:\/\/account\.lostsky\.work:5174\/identity\/workspace-warning\?/)
    await expect(page.getByRole('heading', { name: '你正在使用外部身份' })).toBeVisible()
    const warningUrl = new URL(page.url())
    expect(warningUrl.searchParams.get('team_slug')).toBe('demo')
    expect(warningUrl.searchParams.get('redirect')).toBe(url)
  }
})

test('an acknowledged external Entity does not see the shared warning again in any team workspace', async ({ page }) => {
  await setToken(page, 'teamMember', 71)
  const access = {
    team: { id: 2, slug: 'demo', name: '目标团队' },
    permissions: [],
    abilities: {},
    identity: {
      type: 'teamMember',
      entity_id: 71,
      name: '外部成员',
      slug: 'outside',
      avatar: null,
      belongs_to_team: false,
      is_external: true,
    },
    entry_warning: {
      required: false,
      kind: 'external_entity',
      ttl_seconds: 86400,
    },
  }
  for (const [origin, suffix] of [
    ['http://demo.team.lostsky.work:5175', '/access'],
    ['http://demo.shop.lostsky.work:5179', '/manage/access'],
    ['http://demo.transaction.lostsky.work:5177', '/workspace/access'],
    ['http://demo.weibo.lostsky.work:5181', '/workspace/access'],
  ] as const) {
    await page.route(`${origin}/api/**`, async (route) => {
      const path = new URL(route.request().url()).pathname
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          message: 'ok',
          data: path.endsWith(suffix) ? access : null,
        }),
      })
    })
  }

  for (const url of ['http://demo.team.lostsky.work:5175/', 'http://demo.shop.lostsky.work:5179/manage', 'http://demo.transaction.lostsky.work:5177/overview', 'http://demo.weibo.lostsky.work:5181/overview']) {
    await page.goto(url)
    await expect(page).toHaveURL(url)
  }
})

test('personal workspaces reject an external Entity without offering the team-workspace continue path', async ({ page }) => {
  await setToken(page, 'teamMember', 71)
  const access = {
    team: { id: 2, slug: 'demo', name: '目标团队' },
    permissions: ['weibo.personal.use'],
    abilities: {},
    identity: {
      type: 'teamMember',
      entity_id: 71,
      name: '外部成员',
      slug: 'outside',
      avatar: null,
      belongs_to_team: false,
      is_external: true,
    },
    entry_warning: {
      required: true,
      kind: 'external_entity',
      ttl_seconds: 86400,
    },
  }
  for (const [origin, suffix] of [
    ['http://demo.team.lostsky.work:5175', '/access'],
    ['http://demo.shop.lostsky.work:5179', '/manage/access'],
    ['http://demo.transaction.lostsky.work:5177', '/workspace/access'],
    ['http://demo.weibo.lostsky.work:5181', '/workspace/access'],
  ] as const) {
    await page.route(`${origin}/api/**`, async (route) => {
      const path = new URL(route.request().url()).pathname
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          message: 'ok',
          data: path.endsWith(suffix) ? access : null,
        }),
      })
    })
  }
  await page.route('http://account.lostsky.work:5174/api/identity/member', (route) =>
    route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1,
        message: '不是目标团队成员',
        data: null,
      }),
    }),
  )

  for (const url of ['http://demo.team.lostsky.work:5175/personal', 'http://demo.shop.lostsky.work:5179/manage/personal', 'http://demo.transaction.lostsky.work:5177/personal', 'http://demo.weibo.lostsky.work:5181/personal']) {
    await page.goto(url)
    await expect(page).toHaveURL(/^http:\/\/account\.lostsky\.work:5174\/identity\/member-callback\?/)
    expect(new URL(page.url()).searchParams.get('reason')).toBe('team_mismatch')
    await expect(page.getByRole('button', { name: '继续前往' })).toHaveCount(0)
  }
})
