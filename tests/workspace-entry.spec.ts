import { expect, test, type Page } from '@playwright/test'
import { formatPermissionDenied } from '../frontend/packages/api/src/error-format'

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
    if (width >= 800) {
      await expect(overview.locator('.ls-workspace-overview__hero')).toHaveCSS('height', '188px')
    }
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
      { key: 'chat.virtual.*.act', label: '代表全部虚拟实体参与聊天', group: '聊天' },
      { key: 'team.document.read', label: '查看文档', group: '内容' },
      { key: 'team.document.write', label: '维护文档', group: '内容' },
      { key: 'team.customer.read', label: '查看顾客', group: '顾客' },
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

  await page.setViewportSize({ width: 910, height: 900 })
  const personalDesktopRect = await page.getByRole('link', { name: '进入个人工作台' }).evaluate(element => element.getBoundingClientRect().toJSON())
  const documentDesktopRect = await page.getByRole('link', { name: '使用文档' }).evaluate(element => element.getBoundingClientRect().toJSON())
  expect(personalDesktopRect.width).toBeGreaterThan(documentDesktopRect.width)
  expect(Math.abs(personalDesktopRect.height - documentDesktopRect.height)).toBeLessThanOrEqual(1)

  await page.getByRole('link', { name: '进入个人工作台' }).click()
  await expect(page).toHaveURL(/\/personal$/)
  await expect.poll(() => pageErrors).toEqual([])
  await expect(page.getByRole('heading', { name: '概览', level: 1 })).toBeVisible()
  await expect(page.getByText(/个人工作台 · 团队实体/)).toBeVisible()
  await expect(page.locator('.sidebar').getByRole('link', { name: '概览' })).toHaveCount(1)
  const personalSidebar = page.locator('.sidebar')
  const personalOverview = page.locator('.ls-workspace-overview')
  await expect(personalSidebar.getByRole('link', { name: '切换身份' })).toHaveCount(1)
  await expect(personalOverview.getByRole('link', { name: '切换身份' })).toHaveCount(1)
  await expect(personalOverview.getByRole('link', { name: /进入团队工作台/ })).toHaveAttribute('href', '/')

  const teamDesktopRect = await personalOverview.getByRole('link', { name: /进入团队工作台/ }).evaluate(element => element.getBoundingClientRect().toJSON())
  const identityDesktopRect = await personalOverview.getByRole('link', { name: '切换身份' }).evaluate(element => element.getBoundingClientRect().toJSON())
  expect(teamDesktopRect.width).toBeGreaterThan(identityDesktopRect.width)
  expect(Math.abs(teamDesktopRect.height - identityDesktopRect.height)).toBeLessThanOrEqual(1)
  expect(Math.abs(documentDesktopRect.width - identityDesktopRect.width)).toBeLessThanOrEqual(1)

  await page.setViewportSize({ width: 375, height: 812 })
  const identityMobileWidth = await personalOverview.getByRole('link', { name: '切换身份' }).evaluate(element => element.getBoundingClientRect().width)
  await page.goto('http://demo.team.lostsky.work:5175/')
  const personalMobileWidth = await page.getByRole('link', { name: '进入个人工作台' }).evaluate(element => element.getBoundingClientRect().width)
  const documentMobileWidth = await page.getByRole('link', { name: '使用文档' }).evaluate(element => element.getBoundingClientRect().width)
  expect(Math.abs(personalMobileWidth - documentMobileWidth)).toBeLessThanOrEqual(1)
  expect(Math.abs(documentMobileWidth - identityMobileWidth)).toBeLessThanOrEqual(1)

  await page.goto('http://demo.team.lostsky.work:5175/personal')

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
      identity: { type: 'team', entity_id: 1, name: '青空协作组', slug: 'demo', avatar: '' },
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  await page.goto('http://demo.shop.lostsky.work:5179/manage')
  await expect(page.getByRole('heading', { name: '概览', level: 1 })).toBeVisible()
  await expect(page.locator('.manage-sidebar').getByRole('link', { name: '切换身份' })).toHaveCSS('justify-content', 'flex-start')
  await expect(page.locator('#shop-manage-main').getByText('青空协作组')).toBeVisible()
  const disabledProducts = page.locator('.ls-workspace-overview__entry.disabled').filter({ hasText: '商品' })
  await expect(disabledProducts).not.toContainText(formatPermissionDenied(['shop.product.read']))
  await expect(disabledProducts.getByText('不可用')).toBeVisible()
  await expect(disabledProducts).toHaveCSS('border-style', 'dashed')
  await expect(disabledProducts.locator('.lucide-arrow-right')).toBeVisible()
  await disabledProducts.click({ force: true })
  await expect(page.locator('.n-message').filter({ hasText: formatPermissionDenied(['shop.product.read']) })).toBeVisible()
  await expect(page).toHaveURL('http://demo.shop.lostsky.work:5179/manage')
  await expect(page.getByRole('link', { name: '进入个人工作台' })).toHaveAttribute('href', '/manage/personal')
  await expect(page.getByRole('button', { name: '个人工作台' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '团队工作台' })).toHaveCount(0)
  await expectHeaderApps(page)
  await expectOverviewLayout(page, 'Shop team overview')
  const disabledLabelOffset = await page.locator('.manage-sidebar').evaluate(sidebar => {
    const overview = sidebar.querySelector<HTMLElement>('nav a[href="/manage"] span')!
    const disabledProduct = sidebar.querySelector<HTMLElement>('.manage-nav-disabled .n-button__content > span')!
    return Math.abs(overview.getBoundingClientRect().x - disabledProduct.getBoundingClientRect().x)
  })
  expect(disabledLabelOffset).toBeLessThanOrEqual(1)
  expect(businessRequests).toBe(0)

  await page.getByRole('link', { name: '进入个人工作台' }).click()
  await expect(page).toHaveURL('http://demo.shop.lostsky.work:5179/manage/personal')
  await expect(page.locator('#shop-manage-main').getByRole('heading', { name: '青空协作组', level: 2 })).toBeVisible()
  await expect(page.locator('.manage-sidebar').getByRole('link', { name: '概览' })).toHaveCount(1)
  await expect(page.locator('.manage-nav-disabled').filter({ hasText: '我的商品' }))
    .toHaveAttribute('title', formatPermissionDenied(['shop.product.self.manage']))
  const disabledPersonalProducts = page.locator('.ls-workspace-overview__entry.disabled').filter({ hasText: '我的商品' })
  await expect(disabledPersonalProducts).not.toContainText(formatPermissionDenied(['shop.product.self.manage']))
  await disabledPersonalProducts.click({ force: true })
  await expect(page.locator('.n-message').filter({ hasText: formatPermissionDenied(['shop.product.self.manage']) })).toBeVisible()
  await expect(page).toHaveURL('http://demo.shop.lostsky.work:5179/manage/personal')
  await expect(page.getByRole('link', { name: /进入团队工作台/ })).toHaveAttribute('href', '/manage')
  await expectOverviewLayout(page, 'Shop personal overview')
  expect(businessRequests).toBe(0)
  await page.goto('http://demo.shop.lostsky.work:5179/manage/personal/products')
  await expect(page).toHaveURL('http://demo.shop.lostsky.work:5179/manage/forbidden')
  expect(businessRequests).toBe(0)
  await page.goto('http://demo.shop.lostsky.work:5179/manage/personal')
  await page.getByRole('link', { name: /进入团队工作台/ }).click()
  await expect(page).toHaveURL('http://demo.shop.lostsky.work:5179/manage')
})

test('Transaction root opens the team overview by default', async ({ page }) => {
  await setToken(page, 'teamMember', 11)
  let businessRequests = 0
  await page.route('http://demo.transaction.lostsky.work:5177/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (!path.endsWith('/workspace/access')) businessRequests++
    const data = {
      team: { id: 1, slug: 'demo', name: '青空协作组' },
      permissions: ['transaction.read'],
      abilities: { transaction: { enabled: true, level: 1, expire_time: 0, reason: null, label: '记账' } },
      identity: { type: 'teamMember', entity_id: 11, name: '青空接单人', slug: 'handler', avatar: '' },
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
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
  await page.route('http://demo.transaction.lostsky.work:5177/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (!path.endsWith('/workspace/access')) businessRequests++
    if (path.endsWith('/personal/entitlement-grant/options')) grantOptionRequests++
    const access = {
      team: { id: 1, slug: 'demo', name: '青空协作组' },
      permissions: [],
      abilities: { transaction: { enabled: true, level: 1, expire_time: 0, reason: null, label: '记账' } },
      identity: { type: 'teamMember', entity_id: 11, name: '青空接单人', slug: 'handler', avatar: '' },
    }
    let data: unknown = access
    if (path.endsWith('/personal/entitlements')) data = { total: 0, list: [], page: 1, limit: 20 }
    else if (path.endsWith('/personal/transactions')) data = { total: 0, list: [], page: 1, limit: 20 }
    else if (path.endsWith('/personal/stats')) data = { handler_count: 0, sender_count: 0, cs_count: 0, monthly_performance_total: 0, monthly_flow_total: 0, performance_total: 0 }
    else if (path.endsWith('/personal/services')) data = { total: 0, list: [], offers: [], available: [], page: 1, limit: 20 }
    else if (path.endsWith('/personal/customers')) data = {
      total: 2,
      page: 1,
      limit: 20,
      list: [
        { id: 8, entity_id: 108, slug: 'customer-8', name: '晚风顾客', avatar: null, is_blocked: false, balance: { balance: '120.00', recharged: '200.00', spent: '80.00' }, is_assignee: true, is_sender: false },
        { id: 9, entity_id: 109, slug: 'customer-9', name: '星河顾客', avatar: null, is_blocked: false, balance: { balance: '0.00', recharged: '0.00', spent: '0.00' }, is_assignee: true, is_sender: true },
      ],
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  await page.goto('http://demo.transaction.lostsky.work:5177/overview')
  await expect(page.getByRole('heading', { name: '概览', level: 1 })).toBeVisible()
  await expect(page.locator('.sidebar').getByRole('link', { name: '切换身份' })).toHaveCSS('justify-content', 'flex-start')
  await expect(page.locator('.sidebar').getByRole('link', { name: '概览' })).toHaveCount(1)
  await expect(page.getByRole('link', { name: '进入个人工作台' })).toHaveAttribute('href', '/personal')
  await expect(page.locator('.sidebar').getByText('登记流水', { exact: true })).toHaveCount(0)
  const redemptionPermissions = ['service.redemption.read', 'service.redemption.manage']
  await expect(page.locator('.sidebar').getByRole('button').filter({ hasText: '权益核销' }))
    .toHaveAttribute('title', formatPermissionDenied(redemptionPermissions))
  const disabledRedemption = page.locator('.ls-workspace-overview__entry.disabled').filter({ hasText: '权益核销' })
  await expect(disabledRedemption).not.toContainText(formatPermissionDenied(redemptionPermissions))
  await disabledRedemption.click({ force: true })
  await expect(page.locator('.n-message').filter({ hasText: formatPermissionDenied(redemptionPermissions) })).toBeVisible()
  await expect(page).toHaveURL('http://demo.transaction.lostsky.work:5177/overview')
  await expectOverviewLayout(page, 'Transaction team overview')
  expect(businessRequests).toBe(0)

  await page.goto('http://demo.transaction.lostsky.work:5177/services')
  await expect(page).toHaveURL('http://demo.transaction.lostsky.work:5177/overview')
  expect(businessRequests).toBe(0)

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
    await expect(page.locator('.ls-workspace-overview__entry').filter({ hasText: label })).toHaveAttribute('href', href)
  }
  await expectOverviewLayout(page, 'Transaction personal overview')
  expect(businessRequests).toBe(0)

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
  await page.getByRole('link', { name: /权益下发/ }).last().click()
  await expect(page).toHaveURL('http://demo.transaction.lostsky.work:5177/personal/entitlements')
  await expect(page.locator('#workspace').getByRole('heading', { name: '权益下发', level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: '下发权益' }))
    .toHaveAttribute('title', formatPermissionDenied(['service.entitlement.grant']))
  expect(businessRequests).toBe(7)
  await page.goto('http://demo.transaction.lostsky.work:5177/personal/entitlements/new')
  await expect(page).toHaveURL('http://demo.transaction.lostsky.work:5177/personal/entitlements')
  expect(grantOptionRequests).toBe(0)
  await page.locator('.sidebar').getByRole('link', { name: '概览' }).click()
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
      identity: { type: 'team', entity_id: 1, name: '青空协作组', slug: 'demo', avatar: '' },
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
      ? { id: 31, nickname: '青空顾客', slug: 'sky-customer', avatar: null, description: '', assignee_entity_id: null, balance: '0.00' }
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
  await expect(topbar.getByRole('button', { name: '团队不可用：顾客不进入后台工作台' })).toBeVisible()
  await expect(topbar.getByRole('button', { name: '记账不可用：顾客不进入后台工作台' })).toBeVisible()
  await topbar.locator('.app-links').getByRole('link', { name: '商品' }).click()
  await expect(page).toHaveURL('http://demo.shop.lostsky.work:5179/customer/profile')
})

test('Customer direct backend links resolve to the Shop customer center', async ({ page }) => {
  await setToken(page, 'teamCustomer', 31)
  await page.route('http://demo.shop.lostsky.work:5179/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/customer/me')
      ? { id: 31, nickname: '青空顾客', slug: 'sky-customer', avatar: null, description: '', assignee_entity_id: null, balance: '0.00' }
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
