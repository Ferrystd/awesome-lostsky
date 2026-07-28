import { expect, test } from '@playwright/test'

test('landing page keeps the legacy studio journey without horizontal overflow', async ({ page }) => {
  await page.goto('http://www.lostsky.work:5173/')
  await expect(page).toHaveTitle(/失落青空 - 顶尖陪玩运营工作室/)
  await expect(page.getByRole('heading', { name: /重塑陪玩生态/ })).toBeVisible()
  await expect(page.locator('#team')).toBeVisible()
  await expect(page.locator('#services')).toBeVisible()
  await expect(page.locator('#advantages')).toBeVisible()
  await expect(page.locator('#contact')).toBeVisible()
  await expect(page.getByRole('link', { name: '探索解决方案' })).toHaveAttribute('href', '#services')
  await expect(page.getByRole('link', { name: '联系我们' })).toHaveAttribute('href', '#contact')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)

  await page.setViewportSize({ width: 375, height: 812 })
  await page.reload()
  await expect(page.getByRole('link', { name: '联系我们' })).toBeVisible()
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(mobileOverflow).toBe(false)
})

test('display public pages cover profile, entities, documents, sanitization and responsive states', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('http://demo.display.lostsky.work:5178/api/**', async (route) => {
    const url = new URL(route.request().url())
    let data: unknown
    if (url.pathname.endsWith('/profile/get')) {
      data = {
        slug: 'demo',
        type: 'team',
        profile: {
          name: '青空协作组',
          avatar: null,
          description: '公开介绍、实体与团队知识。',
          intro_image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="720" height="900"%3E%3Crect width="720" height="900" fill="%230ea5a5"/%3E%3C/svg%3E',
          introduction_markdown: '欢迎 [@公开成员](lostsky://entity/public-member)\n\n<script>window.__displayXss = 1</script>',
        },
        fields: [{ key: 'founded', name: '成立年份', value_type: 'int', value: 2025 }],
      }
    } else if (url.pathname.endsWith('/entity/index')) {
      data = {
        total: 2,
        page: 1,
        limit: 20,
        list: [
          { slug: 'public-member', type: 'teamMember', name: '公开成员', avatar: null, description: '负责公开内容', roles: [{ name: '内容主理人', description: '维护公开资料' }] },
          { slug: 'public-bot', type: 'teamVirtual', name: '青空助手', avatar: null, description: '虚拟实体' },
        ],
      }
    } else if (url.pathname.endsWith('/entity/get')) {
      if (url.searchParams.get('slug') === 'hidden') {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 404, message: '实体不存在', data: null }) })
        return
      }
      data = {
        slug: 'public-member',
        type: 'teamMember',
        profile: {
          name: '公开成员',
          avatar: null,
          description: '成员公开简介',
          intro_image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="480" height="640"%3E%3Crect width="480" height="640" fill="%230ea5a5"/%3E%3C/svg%3E',
          introduction_markdown: '这里是经过净化的公开介绍。',
        },
        fields: [{ key: 'available', name: '当前在线', value_type: 'bool', value: 1 }],
        roles: [{ name: '内容主理人', description: '维护公开资料' }],
      }
    } else if (url.pathname.endsWith('/entity/resolve')) {
      data = [{
        slug: 'public-member',
        type: 'teamMember',
        display_name: '公开成员',
        avatar: null,
        team: { slug: 'demo', display_name: '青空协作组' },
        available: true,
        href: '/entity/public-member',
      }]
    } else if (url.pathname.endsWith('/document/index')) {
      if (url.searchParams.get('entity_slug') === 'hidden') {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 404, message: '实体不存在', data: null }) })
        return
      }
      data = {
        total: 1,
        page: 1,
        limit: 20,
        list: [{
          id: 7,
          title: url.searchParams.get('entity_slug') ? '成员指南' : '团队公开指南',
          sort: 0,
          update_time: 1_753_660_800,
          entity: { slug: url.searchParams.get('entity_slug') || 'demo', type: url.searchParams.get('entity_slug') ? 'teamMember' : 'team', name: url.searchParams.get('entity_slug') ? '公开成员' : '青空协作组' },
        }],
      }
    } else if (url.pathname.endsWith('/document/get')) {
      data = {
        id: 7,
        title: '团队公开指南',
        content: '# 使用说明\n\n公开正文。\n\n> 所有内容均可公开查看。\n\n## 阅读步骤\n\n- 确认范围\n- 阅读正文\n\n| 类型 | 状态 |\n| --- | --- |\n| 文档 | 公开 |',
        sort: 0,
        update_time: 1_753_660_800,
        entity: { slug: 'demo', type: 'team', name: '青空协作组' },
      }
    } else {
      data = null
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.display.lostsky.work:5178/')
  await expect(page.getByRole('heading', { name: '青空协作组', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: '公开实体' })).toBeVisible()
  await expect(page.getByRole('link', { name: /公开成员/ })).toBeVisible()
  await expect(page.getByText('内容主理人').first()).toBeVisible()
  await expect(page.getByText('成立年份')).toBeVisible()
  await expect(page.locator('.hero-portrait')).toBeVisible()
  await expect(page.locator('.profile-media img')).toHaveCount(0)
  await expect(page.locator('.public-markdown script')).toHaveCount(0)
  expect(await page.evaluate(() => (window as typeof window & { __displayXss?: number }).__displayXss)).toBeUndefined()
  await expect(page.getByRole('button', { name: /聊天/ })).toHaveCount(0)

  const publicMemberChip = page.locator('[data-entity-slug="public-member"]')
  await publicMemberChip.click()
  await expect(publicMemberChip).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('.entity-card')).toContainText('@public-member')
  await page.getByRole('button', { name: /收起.*对象信息/ }).click()
  await expect(publicMemberChip).toBeFocused()
  await expect(page.locator('.entity-card')).toHaveCount(0)
  await publicMemberChip.click()
  await publicMemberChip.click()
  await expect(publicMemberChip).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('.entity-card')).toHaveCount(0)

  await page.getByRole('link', { name: /公开成员/ }).first().click()
  await expect(page).toHaveURL(/\/entity\/public-member$/)
  await expect(page.getByRole('heading', { name: '公开成员', level: 1 })).toBeVisible()
  await expect(page.getByRole('list', { name: '公开角色' })).toContainText('维护公开资料')
  await expect(page.getByRole('img', { name: '公开成员 的人物展示图' })).toBeVisible()
  await expect(page.locator('.subject-backdrop')).toHaveCSS('object-fit', 'cover')
  const backdropBox = await page.locator('.subject-backdrop').boundingBox()
  const heroBox = await page.locator('.subject-hero').boundingBox()
  expect(backdropBox).not.toBeNull()
  expect(heroBox).not.toBeNull()
  expect(backdropBox?.width).toBeCloseTo(heroBox?.width ?? 0, 0)
  expect(backdropBox?.height).toBeCloseTo(heroBox?.height ?? 0, 0)
  await expect(page.getByText('当前在线')).toBeVisible()
  await expect(page.getByText('是', { exact: true })).toBeVisible()

  await page.goto('http://demo.display.lostsky.work:5178/document/7')
  await expect(page.getByRole('heading', { name: '团队公开指南', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: '使用说明' })).toBeVisible()
  await expect(page.getByRole('link', { name: '返回团队主页' })).toHaveAttribute('href', '/')
  await expect(page.getByRole('region', { name: '文档正文' }).getByRole('list')).toBeVisible()
  await expect(page.locator('.document-content blockquote')).toBeVisible()
  await expect(page.locator('.document-content table')).toBeVisible()
  const documentTitleSize = Number.parseFloat(await page.getByRole('heading', { name: '团队公开指南', level: 1 }).evaluate(element => getComputedStyle(element).fontSize))
  const markdownTitleSize = Number.parseFloat(await page.getByRole('heading', { name: '使用说明', level: 1 }).evaluate(element => getComputedStyle(element).fontSize))
  expect(markdownTitleSize).toBeLessThan(documentTitleSize)

  await page.goto('http://demo.display.lostsky.work:5178/entity/hidden')
  await expect(page.getByRole('heading', { name: '该实体没有公开资料' })).toBeVisible()

  await page.goto('http://demo.display.lostsky.work:5178/not-a-route')
  await expect(page.getByRole('heading', { name: '这里没有可公开查看的内容' })).toBeVisible()

  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('http://demo.display.lostsky.work:5178/')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: '跳到主要内容' })).toBeFocused()
})

test('shop storefront supports public display, customer binding, balance purchase and cancellation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const baseToken = `x.${Buffer.from(JSON.stringify({ sub: 21 })).toString('base64url')}.x`
  const customerToken = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamCustomer', id: 31 } })).toString('base64url')}.x`
  let cancelled = false
  let purchasePayload: unknown = null
  await page.context().addCookies([{ name: 'lostsky_token', value: baseToken, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route('http://demo.shop.lostsky.work:5179/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    let data: unknown
    if (url.pathname.endsWith('/storefront')) {
      data = {
        slug: 'demo',
        type: 'team',
        product_count: 1,
        profile: {
          name: '青空选物',
          description: '只展示真正值得被看见的商品。',
          intro_image: null,
          introduction_markdown: '## 关于本店\n\n在深空里挑选一点天光。<script>window.__shopXss=1</script>',
        },
        fields: [],
      }
    } else if (url.pathname.endsWith('/storefront/products/1')) {
      data = {
        id: 1,
        name: '青空陪伴计划',
        description: '一段被认真准备的体验。',
        cover_image: null,
        introduction_markdown: '## 商品说明\n\n购买后由团队联系。',
        price: '30.00',
        handlers: [{ entity_id: 8, slug: 'guide', name: '青空向导', avatar: null }],
      }
    } else if (url.pathname.endsWith('/storefront/products')) {
      data = {
        total: 1, page: 1, limit: 24,
        list: [{ id: 1, name: '青空陪伴计划', description: '一段被认真准备的体验。', cover_image: null, price: '30.00' }],
      }
    } else if (url.pathname.endsWith('/customer/bind')) {
      data = { token: customerToken, identity: { type: 'teamCustomer', id: 31 }, customer: { id: 31 }, created: true }
    } else if (url.pathname.endsWith('/customer/balance')) {
      data = { balance: cancelled ? '100.00' : '100.00', recharged: '100.00', spent: cancelled ? '0.00' : '0.00' }
    } else if (url.pathname.endsWith('/customer/orders/44/cancel')) {
      cancelled = true
      data = null
    } else if (url.pathname.endsWith('/customer/orders/44')) {
      data = {
        id: 44, product_id: 1, product_name: '青空陪伴计划', product_cover_image: null,
        quantity: 1, unit_price: '30.00', total_price: '30.00', prepaid: '30.00',
        status: cancelled ? 3 : 1, memo: null, create_time: 1_753_660_800,
      }
    } else if (url.pathname.endsWith('/customer/orders') && request.method() === 'POST') {
      purchasePayload = request.postDataJSON()
      data = { id: 44 }
    } else if (url.pathname.endsWith('/customer/orders')) {
      data = { total: 0, page: 1, limit: 20, list: [] }
    } else {
      data = null
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  await page.goto('http://demo.shop.lostsky.work:5179/')
  await expect(page.getByRole('heading', { name: '青空选物', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: '青空陪伴计划' })).toBeVisible()
  await expect(page.locator('.shop-markdown script')).toHaveCount(0)
  expect(await page.evaluate(() => (window as typeof window & { __shopXss?: number }).__shopXss)).toBeUndefined()

  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: '跳到主要内容' })).toBeFocused()

  await page.goto('http://demo.shop.lostsky.work:5179/product/1/checkout')
  await expect(page).toHaveURL(/\/customer\/bind/)
  await expect(page.getByRole('heading', { name: '在 青空选物 建立客户账户' })).toBeVisible()
  await page.getByRole('button', { name: '建立账户并继续' }).click()
  await expect(page).toHaveURL(/\/product\/1\/checkout$/)
  await expect(page.getByText('当前余额')).toBeVisible()
  await page.getByRole('button', { name: '使用余额购买' }).click()
  expect(purchasePayload).toEqual({ product_id: 1, quantity: 1 })
  await expect(page).toHaveURL(/\/orders\/44$/)
  await page.getByRole('button', { name: '取消订单并退款' }).click()
  await page.getByRole('button', { name: '取消并退款' }).click()
  await expect(page.getByText('已取消')).toBeVisible()

  await page.goto('http://demo.shop.lostsky.work:5179/orders')
  await expect(page.getByRole('heading', { name: '我的订单', level: 1 })).toBeVisible()
  await expect(page.getByText('可用余额')).toBeVisible()
  await expect(page.getByRole('heading', { name: '从第一件喜欢的商品开始' })).toBeVisible()
  await expect(page.getByRole('link', { name: '浏览商城' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(page.getByRole('heading', { name: '订单记录' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
})

test('shop storefront keeps an empty merchant visible and useful', async ({ page }) => {
  await page.route('http://demo.shop.lostsky.work:5179/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/storefront/products')
      ? { total: 0, page: 1, limit: 24, list: [] }
      : {
          slug: 'demo',
          type: 'team',
          product_count: 0,
          profile: {
            name: 'test团队',
            description: null,
            intro_image: null,
            introduction_markdown: null,
          },
        }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.shop.lostsky.work:5179/')
  await expect(page.getByRole('heading', { name: 'test团队', level: 1 })).toBeVisible()
  await expect(page.getByText('商品正在准备中')).toBeVisible()
  await expect(page.getByText('这里不会用虚构商品填满页面')).toBeVisible()

  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
})

test('shop storefront stays visible when the product endpoint returns an invalid payload', async ({ page }) => {
  await page.route('http://demo.shop.lostsky.work:5179/api/**', async (route) => {
    const data = {
      slug: 'demo',
      type: 'team',
      product_count: 0,
      profile: {
        name: 'test团队',
        description: null,
        intro_image: null,
        introduction_markdown: null,
      },
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.shop.lostsky.work:5179/')
  await expect(page.locator('.store-hero')).toBeVisible()
  await expect(page.locator('.collection-message')).toBeVisible()
  await expect(page.locator('.collection-message button')).toBeVisible()
})

test('team entity detail saves display visibility only for supported entities', async ({ page }) => {
  let displayed = false
  let displayPayload: unknown = null
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = []
    if (path.endsWith('/entity/get')) {
      data = {
        id: 1,
        slug: 'alice',
        entityable_type: 'teamMember',
        is_displayed: displayed ? 1 : 0,
        profile: { name: '测试成员', avatar: '', description: '公开资料' },
      }
    } else if (path.endsWith('/entity/display')) {
      displayPayload = route.request().postDataJSON()
      displayed = true
      data = null
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.team.lostsky.work:5175/entity?id=1')
  await expect(page.getByRole('heading', { name: '公开主页展示' })).toBeVisible()
  const displaySwitch = page.getByRole('switch', { name: '在公开主页展示' })
  await expect(displaySwitch).not.toBeChecked()
  await displaySwitch.click()
  await page.getByRole('button', { name: '保存公开设置' }).click()
  await expect(page.getByRole('status')).toContainText('公开展示设置已保存')
  expect(displayPayload).toEqual({ entity_id: 1, is_displayed: 1 })
})

test('account login remains usable at mobile and desktop widths', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('http://account.lostsky.work:5174/login')
  await expect(page.getByRole('heading', { name: '欢迎回来' }), `login did not render; ${errors.join(' | ')}`).toBeVisible()
  await expect(page.getByLabel('手机号码')).toBeVisible()
  await expect(page.getByRole('textbox', { name: '密码', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '登录' })).toBeVisible()
})

test('login returns to the original LostSky subdomain deep link', async ({ page }) => {
  const originalUrl = 'http://demo.team.lostsky.work:5175/doc?id=11'
  await page.route('http://account.lostsky.work:5174/api/login/phone', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data: { token: 'e2e-token' } }),
    })
  })
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: 'ok',
        data: { id: 11, title: '回跳验证文档', content: '登录后应返回当前文档。', entity_id: 1, manager_scope: 1, visibility: 1, sort: 0 },
      }),
    })
  })

  await page.goto(originalUrl)
  await expect(page).toHaveURL((url) => (
    url.origin === 'http://account.lostsky.work:5174'
    && url.pathname === '/login'
    && url.searchParams.get('redirect') === originalUrl
  ))

  await page.getByLabel('手机号码').fill('13800138000')
  await page.getByRole('textbox', { name: '密码', exact: true }).fill('test-password')
  await page.getByRole('button', { name: '登录' }).click()

  await expect(page).toHaveURL(originalUrl)
  await expect(page.getByRole('heading', { name: '回跳验证文档', level: 1 })).toBeVisible()
})

test('authenticated account visits honor a LostSky development redirect', async ({ page }) => {
  const originalUrl = 'http://demo.team.lostsky.work:5175/doc?id=11'
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: 'ok',
        data: { id: 11, title: '已登录回跳文档', content: '登录页应直接返回原页面。', entity_id: 1, manager_scope: 1, visibility: 1, sort: 0 },
      }),
    })
  })

  await page.goto(`http://account.lostsky.work:5174/login?redirect=${encodeURIComponent(originalUrl)}`)

  await expect(page).toHaveURL(originalUrl)
  await expect(page.getByRole('heading', { name: '已登录回跳文档', level: 1 })).toBeVisible()
})

test('team workspace routes remain responsive with the API boundary mocked', async ({ page }) => {
  test.setTimeout(240_000)
  const pageErrors: string[] = []
  let emptyNotices = false
  let noticeConfirmRequests = 0
  let noticeSendPayload: Record<string, unknown> | null = null
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') pageErrors.push(message.text()) })
  page.on('requestfailed', (request) => pageErrors.push(`${request.url()}: ${request.failure()?.errorText}`))
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const url = new URL(route.request().url())
    let data: unknown = []
    if (url.pathname.endsWith('/notice/get') && url.searchParams.get('id') === '404') {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 404, message: '站内信不存在', data: null }) })
      return
    }
    if (url.pathname.endsWith('/file/usage')) data = { total_size: 0, count: 0 }
    else if (url.pathname.endsWith('/joinReview/index')) data = { list: [{ id: 1, user_id: 6, status: '审核中', name: '青空成员' }], total: 1 }
    else if (url.pathname.endsWith('/joinReview/get')) data = { id: 1, user_id: 6, status: '审核中', memo: '希望参与工作室协作', values: [], tasks: [{ id: 8, title: '确认协作约定', description: '阅读并确认团队协作方式', is_passed: 0 }] }
    else if (url.pathname.endsWith('/doc/get')) data = { id: 11, title: '第一份文档', content: '欢迎 [@测试成员](lostsky://entity/alice)\n\n关联 [@测试团队](lostsky://entity/demo)、[@协作助手](lostsky://entity/helper) 和 [@测试客户](lostsky://entity/customer-1)。\n\n<script>window.__lostskyXss = 1</script>', entity_id: 1, manager_scope: 1, visibility: 1, sort: 0 }
    else if (url.pathname.endsWith('/doc')) data = { list: [{ id: 11, title: '第一份文档', content: '', visibility: 1 }, { id: 12, title: '第二份文档', content: '这是一段长度不同的摘要，用来验证文档卡片底栏仍然共用同一条基线。', visibility: 1 }], total: 2 }
    else if (url.pathname.endsWith('/member/get')) data = {
      id: 1,
      user_id: 1,
      nickname: '测试成员',
      slug: 'alice',
      search_override: null,
      posts: [],
      capabilities: {
        member_edit: true,
        field_manage: true,
        role_read: true,
        role_write: true,
        member_block: true,
        member_search: true,
        member_slug: true,
        member_remove: true,
        identity_assume: true,
      },
    }
    else if (url.pathname.endsWith('/member/index')) data = [{ id: 1, user_id: 1, nickname: '测试成员', slug: 'alice', is_blocked: 0 }]
    else if (url.pathname.endsWith('/postType/index')) data = []
    else if (url.pathname.endsWith('/chatVirtual/get')) data = {
      slug: 'sales-assistant',
      name: '销售助手',
      avatar: null,
      description: '负责接收销售咨询',
      is_active: 1,
      integrations: [{
        id: 1,
        name: 'CRM 工作流',
        endpoint_url: 'https://example.com/lostsky/events',
        events: ['message.created'],
        is_active: 1,
      }],
    }
    else if (url.pathname.endsWith('/entity/options')) data = [
      { id: 1, entity_id: 1, type: 'team', slug: 'demo', name: '测试团队', avatar: null },
      { id: 2, entity_id: 2, type: 'teamCustomer', slug: 'customer-1', name: '测试客户', avatar: null },
    ]
    else if (url.pathname.endsWith('/entity/search')) data = [{ slug: 'alice', type: 'teamMember', display_name: '测试成员', available: true, team: { slug: 'demo', display_name: '测试团队' } }]
    else if (url.pathname.endsWith('/entity/resolve')) data = [
      { slug: 'alice', type: 'teamMember', display_name: '测试成员', available: true, team: { slug: 'demo', display_name: '测试团队' }, href: '/member-detail?id=1' },
      { slug: 'demo', type: 'team', display_name: '测试团队', available: true, team: null, href: '/' },
      { slug: 'helper', type: 'teamVirtual', display_name: '协作助手', available: true, team: { slug: 'demo', display_name: '测试团队' }, href: null },
      { slug: 'customer-1', type: 'teamCustomer', display_name: '测试客户', available: true, team: { slug: 'demo', display_name: '测试团队' }, href: null },
    ]
    else if (url.pathname.endsWith('/notice/get')) data = { id: 21, title: '维护窗口提醒', content: '系统将在今晚进行维护。\n请提前保存正在处理的内容。', is_pinned: 1, is_read: 0, create_time: 1752883200 }
    else if (url.pathname.endsWith('/notice/index')) data = emptyNotices ? { list: [], total: 0, can_send: true } : { list: [
      { id: 21, title: '维护窗口提醒', content: '系统将在今晚进行维护。', is_pinned: 1, is_read: 0, create_time: 1752883200 },
      { id: 20, title: '欢迎加入团队', content: '', is_pinned: 0, is_read: 1, create_time: 1752796800 },
    ], total: 2, can_send: true }
    else if (url.pathname.endsWith('/notice/send')) {
      noticeSendPayload = route.request().postDataJSON() as Record<string, unknown>
      data = { id: 22, team_id: null, sender_team_id: 1, entity_id: Number(noticeSendPayload.entity_id), is_pinned: noticeSendPayload.is_pinned ? 1 : 0 }
    }
    else if (url.pathname.endsWith('/notice/confirm')) { noticeConfirmRequests++; data = null }
    else if (url.pathname.endsWith('/file/index')) data = { list: [], total: 0 }
    else if (url.pathname.endsWith('/setting/schema')) data = {
      apps: [
        {
          app_name: 'entity', label: '对象搜索', description: '控制团队和成员是否可以通过对象标识被搜索。', order: 10,
          settings: [
            { key: 'team_searchable', label: '团队自身可搜索', description: '允许已登录用户通过 @slug 找到当前团队。', type: 'boolean', control: 'switch', order: 10, default: false, value: false },
            { key: 'member_searchable', label: '成员默认可搜索', description: '成员未设置个人覆盖值时采用此默认值。', type: 'boolean', control: 'switch', order: 20, default: false, value: false },
            { key: 'member_search_priority', label: '搜索优先级', description: '决定团队默认值与成员显式设置冲突时采用哪一个。', type: 'enum', control: 'radio', order: 30, default: 'team', value: 'team', options: [
              { value: 'team', label: '团队优先', description: '团队关闭搜索时，所有成员均不可被搜索。' },
              { value: 'member', label: '成员优先', description: '成员的显式设置可以覆盖团队默认值。' },
            ] },
          ],
        },
        {
          app_name: 'chat', label: '聊天', description: '控制客户会话、群历史、已读回执与消息保留策略。', order: 20,
          settings: [
            { key: 'customer_direct_start', label: '客户可发起单聊', description: '允许客户主动联系团队公开的成员或虚拟实体。', type: 'boolean', control: 'switch', order: 10, default: true, value: true },
            { key: 'customer_group_mode', label: '客户群聊权限', description: '决定客户是否可以加入或创建群聊。', type: 'enum', control: 'radio', order: 20, default: 'invite_only', value: 'invite_only', options: [
              { value: 'disabled', label: '禁止客户加入', description: '客户不能创建群聊，也不能被邀请进入群聊。' },
              { value: 'invite_only', label: '仅限团队邀请', description: '客户不能创建群聊，只能由团队成员邀请进入。' },
              { value: 'create', label: '允许客户创建', description: '客户可以创建群聊，但不能主动邀请其他客户。' },
            ] },
            { key: 'group_history', label: '新成员可见群历史', description: '决定新参与者看到全部历史，还是仅看到加入后的消息。', type: 'enum', control: 'radio', order: 30, default: 'from_join', value: 'from_join', options: [
              { value: 'from_join', label: '仅加入后消息', description: '新参与者只能查看加入群聊之后的消息。' },
              { value: 'all', label: '全部历史消息', description: '新参与者可以查看加入前的全部群聊消息。' },
            ] },
            { key: 'read_receipts', label: '显示已读回执', description: '向会话参与者展示已读状态。', type: 'boolean', control: 'switch', order: 40, default: true, value: true },
            { key: 'edit_window_minutes', label: '消息编辑窗口', description: '发送后允许本人编辑的分钟数。', type: 'integer', control: 'number', order: 50, default: 15, value: 15, min: 0, max: 1440 },
          ],
        },
        {
          app_name: 'shop', label: '商城', description: '控制商城订单与其他应用之间的自动联动。', order: 30,
          settings: [
            { key: 'sync_transaction', label: '自动同步记账流水', description: '下单时自动生成关联流水；仅在团队已开通且未过期的 Transaction Ability 时生效。', type: 'boolean', control: 'switch', order: 10, default: true, value: true },
          ],
        },
      ],
    }
    else if (url.pathname.endsWith('/setting')) data = { team_searchable: false, member_searchable: false, member_search_priority: 'team' }
    else if (url.pathname.endsWith('/me/get')) data = {
      id: 1,
      user_id: 1,
      nickname: '测试成员',
      slug: 'alice',
      custom_fields: [],
      custom_field_values: [],
      role_assignments: [],
      effective_permissions: [],
    }
    else if (url.pathname.endsWith('/join/form')) data = []
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })
  for (const path of ['/', '/members', '/member-add', '/member-edit?id=1', '/roles', '/roles/new', '/fields', '/field-new?type=member', '/chat-virtuals', '/chat-virtual-new', '/chat-virtual?slug=sales-assistant', '/chat-integration-new?slug=sales-assistant', '/chat-integration?slug=sales-assistant&id=1', '/notice', '/notice-detail?id=21', '/notice-send', '/files', '/docs', '/doc-create', '/doc-edit?id=11', '/doc?id=11', '/settings', '/join-review', '/join-review/review?id=1', '/me']) {
    await page.goto(`http://demo.team.lostsky.work:5175${path}`)
    expect(page.url(), `unexpected navigation at ${path}; errors: ${pageErrors.join(' | ')}`).toContain('demo.team.lostsky.work:5175')
    if (!await page.locator('#workspace').count()) throw new Error(`workspace missing at ${path}; url=${page.url()}; authenticated=${Boolean(await page.evaluate(() => localStorage.getItem('lostsky_token')))}; errors=${pageErrors.join(' | ')}; body=${(await page.locator('body').innerText()).slice(0, 400)}`)
    await expect(page.locator('#workspace')).toBeVisible()
    await expect(
      page.locator('#workspace > .admin-page'),
      `admin page hidden at ${path}; errors: ${pageErrors.join(' | ')}`,
    ).toBeVisible({ timeout: 60_000 })
    if (path === '/join-review') {
      await expect(page.getByRole('link', { name: /青空成员/ })).toBeVisible()
      await expect(page.getByText('查看申请状态，选择一条申请进入独立审核页面。')).toBeVisible()
    }
    if (path.startsWith('/join-review/review')) {
      await expect(page.getByText('审核任务')).toBeVisible()
      await expect(page.getByLabel('任务标题')).toHaveValue('确认协作约定')
      await expect(page.getByRole('checkbox', { name: '已完成' })).toBeVisible()
      await expect(page.getByRole('link', { name: '返回申请列表' })).toBeVisible()
    }
    if (path === '/roles/new') {
      await expect(page.getByRole('heading', { name: '新建角色', level: 2 })).toBeVisible()
      await expect(page.getByLabel('角色标识')).toBeVisible()
      await expect(page.getByLabel('角色名称')).toBeVisible()
    }
    if (path.startsWith('/chat-integration?')) {
      await expect(page.getByRole('heading', { name: '编辑 Webhook 集成', level: 2 })).toBeVisible()
      await expect(page.getByLabel('集成名称')).toHaveValue('CRM 工作流')
      await expect(page.getByRole('switch', { name: '启用集成' })).toBeChecked()
    }
    if (path === '/notice') {
      await expect(page.getByRole('link', { name: /维护窗口提醒/ })).toHaveAttribute('href', '/notice-detail?id=21')
      await expect(page.getByRole('link', { name: '发送通知' })).toHaveAttribute('href', '/notice-send')
      await expect(page.getByText('置顶', { exact: true })).toBeVisible()
      await expect(page.locator('.notice-detail-view')).toHaveCount(0)
    }
    if (path === '/notice-detail?id=21') {
      await expect(page.getByRole('heading', { name: '维护窗口提醒', level: 1 })).toBeVisible()
      await expect(page.getByText('请提前保存正在处理的内容。')).toBeVisible()
      await expect(page.getByRole('link', { name: '返回站内信列表' })).toHaveAttribute('href', '/notice')
      await expect(page.getByText('已确认', { exact: true })).toBeVisible()
      expect(noticeConfirmRequests).toBe(1)
    }
    if (path === '/notice-send') {
      await expect(page.getByRole('heading', { name: '发送通知', level: 2 })).toBeVisible()
      await expect(page.getByText('本次通知只进入所选 Entity 的收件箱，不会自动抄送 Team；Team 原有的 LostSky 收件箱保持不变。')).toBeVisible()
      await page.getByLabel('标题 *').fill('客户专属通知')
      await page.getByRole('button', { name: '发送通知' }).click()
      await expect(page.getByRole('status')).toContainText('通知已发送给 测试客户，没有自动抄送 Team')
      expect(noticeSendPayload).toMatchObject({ entity_id: 2, title: '客户专属通知', is_pinned: false })
    }
    if (path === '/doc-create') {
      await expect(page.getByRole('heading', { name: '新建文档', level: 2 })).toBeVisible()
      await expect(page.locator('.mode-tabs > button').filter({ hasText: '可视化' })).toBeVisible()
      await expect(page.locator('.mode-tabs > button').filter({ hasText: '源码' })).toBeVisible()
      await expect(page.locator('.mode-tabs > button').filter({ hasText: '预览' })).toBeVisible()
      await expect(page.locator('dialog')).toHaveCount(0)
      const mentionButton = page.getByRole('button', { name: '引用团队或成员' })
      await expect(mentionButton).toBeVisible()
      await expect(mentionButton).toHaveClass(/top-bar-item/)
      expect(await mentionButton.evaluate((button) => button.nextElementSibling?.classList.contains('top-bar-item'))).toBe(true)
      const toolbarIcon = page.locator('.milkdown-top-bar .top-bar-item svg').first()
      await expect(toolbarIcon).toBeVisible()
      await expect(page.locator('.milkdown-top-bar .top-bar-heading-button')).toContainText('段落')
      const toolbarIconColor = await toolbarIcon.evaluate((element) => getComputedStyle(element).color)
      const inkColor = await page.evaluate(() => {
        const sample = document.createElement('span')
        sample.style.color = 'var(--ink)'
        document.body.append(sample)
        const color = getComputedStyle(sample).color
        sample.remove()
        return color
      })
      expect(toolbarIconColor).toBe(inkColor)
      const visibilitySelect = page.locator('label.field').filter({ hasText: '可见范围' }).locator('.n-select')
      await visibilitySelect.click()
      await expect(page.locator('.n-base-select-option').filter({ hasText: '团队管理员可见' }).first()).toBeVisible()
      await expect(page.locator('.n-base-select-option').filter({ hasText: '团队管理员可见，不含成员本人' })).toHaveCount(0)
      await page.keyboard.press('Escape')
      const editor = page.locator('.ls-markdown-editor .ProseMirror').first()
      await mentionButton.dispatchEvent('pointerdown', { button: 0, buttons: 1, pointerId: 1, pointerType: 'mouse', isPrimary: true })
      await expect(page.locator('.picker-status')).toContainText('继续输入至少 2 个字符')
      await editor.pressSequentially('al')
      await expect(page.locator('.entity-picker [role="option"]')).toContainText('@alice')
      await page.keyboard.press('Enter')
      await page.locator('.mode-tabs > button').filter({ hasText: '源码' }).click()
      await expect(page.locator('.ls-markdown-editor textarea')).toHaveValue(/\[@测试成员\]\(lostsky:\/\/entity\/alice\)/)
    }
    if (path === '/member-edit?id=1') {
      await expect(page.getByRole('heading', { name: '对象字段' })).toBeVisible()
      await expect(page.getByRole('heading', { name: '角色与权限' })).toBeVisible()
      await expect(page.getByRole('heading', { name: '管理操作' })).toBeVisible()
      await expect(page.getByText('@alice')).toBeVisible()
      await expect(page.getByText('ADMIN ONLY', { exact: true })).toHaveCount(0)
      await expect(page.getByRole('button', { name: '保存成员' })).toBeVisible()
      await expect(page.locator('.admin-page-heading .member-primary-actions')).toContainText('保存成员')
    }
    if (path === '/settings') {
      await expect(page.getByRole('heading', { name: '对象搜索', level: 2 })).toBeVisible()
      await expect(page.getByRole('heading', { name: '聊天', level: 2 })).toBeVisible()
      await expect(page.getByRole('heading', { name: '商城', level: 2 })).toBeVisible()
      await expect(page.getByRole('switch', { name: '团队自身可搜索' })).toBeVisible()
      await expect(page.getByRole('switch', { name: '成员默认可搜索' })).toBeVisible()
      await expect(page.getByRole('switch', { name: '自动同步记账流水' })).toBeChecked()
      await expect(page.getByRole('radio', { name: /团队优先/ })).toBeChecked()
      await expect(page.getByText('成员优先', { exact: true })).toBeVisible()
      await page.getByText('成员优先', { exact: true }).click()
      await expect(page.getByRole('radio', { name: /成员优先/ })).toBeChecked()
      await expect(page.getByRole('radio', { name: /仅限团队邀请/ })).toBeChecked()
      await expect(page.getByRole('radio', { name: /仅加入后消息/ })).toBeChecked()
      await expect(page.getByText('客户不能创建群聊，只能由团队成员邀请进入。')).toBeVisible()
      await expect(page.getByText('新参与者可以查看加入前的全部群聊消息。')).toBeVisible()
      await expect(page.getByText('InviteOnly', { exact: true })).toHaveCount(0)
      await expect(page.getByText('FromJoin', { exact: true })).toHaveCount(0)
      await expect(page.locator('.settings-view .n-select')).toHaveCount(0)
      await expect(page.getByRole('textbox', { name: '消息编辑窗口' })).toHaveValue('15')
    }
    if (path === '/me') {
      await expect(page.getByRole('heading', { name: '我的对象标识' })).toBeVisible()
      await expect(page.getByText('本人可见', { exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: '对象字段' })).toBeVisible()
      await expect(page.getByRole('heading', { name: '管理操作' })).toHaveCount(0)
    }
    if (path === '/doc?id=11') {
      const memberChip = page.locator('[data-entity-slug="alice"]')
      await expect(memberChip).toBeVisible()
      await expect(page.locator('a[href^="lostsky://"]')).toHaveCount(0)
      expect(await page.evaluate(() => (window as typeof window & { __lostskyXss?: number }).__lostskyXss)).toBeUndefined()

      await memberChip.focus()
      await page.keyboard.press('Enter')
      await expect(memberChip).toHaveAttribute('aria-expanded', 'true')
      await expect(page.locator('.entity-card')).toContainText('@alice')
      await expect(page.locator('.entity-card__identity small')).toHaveText('成员')
      await page.keyboard.press('Enter')
      await expect(memberChip).toHaveAttribute('aria-expanded', 'false')
      await expect(page.locator('.entity-card')).toHaveCount(0)

      for (const entity of [
        { slug: 'demo', type: '团队' },
        { slug: 'helper', type: '虚拟实体' },
        { slug: 'customer-1', type: '客户' },
      ]) {
        const chip = page.locator(`[data-entity-slug="${entity.slug}"]`)
        await chip.click()
        await expect(chip).toHaveAttribute('aria-expanded', 'true')
        await expect(page.locator('.entity-card')).toContainText(`@${entity.slug}`)
        await expect(page.locator('.entity-card__identity small')).toHaveText(entity.type)
        await chip.click()
        await expect(chip).toHaveAttribute('aria-expanded', 'false')
        await expect(page.locator('.entity-card')).toHaveCount(0)
      }
    }
    if (path === '/docs' && await page.locator('.document-list article').count() === 2) {
      await expect(page.getByText('这份文档还没有正文。')).toBeVisible()
      await expect(page.locator('dialog')).toHaveCount(0)
      if ((page.viewportSize()?.width ?? 0) >= 720) {
        const footerTops = await page.locator('.document-list article footer').evaluateAll((footers) => footers.map((footer) => footer.getBoundingClientRect().top))
        if (footerTops.length === 2) expect(Math.abs(footerTops[0] - footerTops[1])).toBeLessThan(1)
      }
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow, `horizontal overflow at ${path}`).toBe(false)
  }

  await page.goto('http://demo.team.lostsky.work:5175/notice-detail')
  await expect(page.getByRole('alert')).toContainText('缺少有效的站内信编号')
  await page.goto('http://demo.team.lostsky.work:5175/notice-detail?id=404')
  await expect(page.getByRole('alert')).toContainText('站内信不存在')
  emptyNotices = true
  await page.goto('http://demo.team.lostsky.work:5175/notice')
  await expect(page.getByRole('heading', { name: '目前没有站内信' })).toBeVisible()
})

test('member saves only their editable visible entity fields', async ({ page }) => {
  let savedValues: Record<string, unknown> | null = null
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = []
    if (path.endsWith('/me/get')) {
      data = {
        id: 1,
        user_id: 1,
        nickname: '测试成员',
        slug: 'alice',
        custom_fields: [
          { id: 101, name: '公开称号', value_type: 'string', input_type: 'text', is_visible: 1, is_editable: 1 },
          { id: 102, name: '只读编号', value_type: 'string', input_type: 'text', is_visible: 1, is_editable: 0 },
        ],
        custom_field_values: [{ field_id: 102, value_string: 'LS-102' }],
        role_assignments: [{
          role_id: 8,
          role: {
            id: 8,
            name: '内容成员',
            role_key: 'content-member',
            permissions: [{ permission_key: 'file.read' }],
          },
        }],
        effective_permissions: [{ key: 'file.read', label: '查看文件', group: '文件与设置' }],
      }
    } else if (path.endsWith('/me/fields')) {
      savedValues = route.request().postDataJSON().values
      data = null
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  await page.goto('http://demo.team.lostsky.work:5175/me')
  const saveButton = page.getByRole('button', { name: '保存字段' })
  const editableField = page.getByRole('textbox', { name: '公开称号' })
  await expect(saveButton).toBeDisabled()
  await editableField.fill('夜航员')
  await expect(saveButton).toBeEnabled()
  await expect(page.locator('.readonly-value').filter({ hasText: 'LS-102' })).toBeVisible()
  await expect(page.getByPlaceholder('填写只读编号')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '角色与权限' })).toBeVisible()
  await expect(page.getByText('内容成员')).toBeVisible()
  await page.getByText('文件与设置').click()
  await expect(page.getByText('查看文件')).toBeVisible()
  await saveButton.click()
  await expect.poll(() => savedValues).toEqual({ 101: '夜航员' })

  await page.setViewportSize({ width: 768, height: 1024 })
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
})

test('member task hides unauthorized controls and me explains the slug prerequisite', async ({ page }) => {
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/member/get')
      ? {
          id: 3,
          user_id: 3,
          nickname: '只读成员',
          description: '只能查看这份成员资料',
          slug: 'readonly-member',
          posts: [],
          capabilities: {
            member_edit: false,
            field_manage: false,
            role_read: false,
            role_write: false,
            member_block: false,
            member_search: false,
            member_slug: false,
            member_remove: false,
            identity_assume: false,
          },
        }
      : path.endsWith('/me/get')
        ? {
            id: 4,
            user_id: 4,
            nickname: '待领取成员',
            slug: '',
            custom_fields: [],
            custom_field_values: [],
            role_assignments: [],
            effective_permissions: [],
          }
        : []
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  await page.goto('http://demo.team.lostsky.work:5175/member-edit?id=3')
  await expect(page.getByText('只读成员', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '保存成员' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '对象字段' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '角色与权限' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '管理操作' })).toHaveCount(0)
  await expect(page.getByRole('textbox', { name: '团队昵称' })).toHaveCount(0)

  await page.goto('http://demo.team.lostsky.work:5175/me')
  await expect(page.getByText('请先领取 slug', { exact: true })).toBeVisible()
  await expect(page.getByText('确认对象标识后，才能保存对象字段并查看当前角色权限。')).toBeVisible()
})

test('team role tasks use independent routes for entity assignment and permission editing', async ({ page }) => {
  let entityAssignment: { slug?: string; role_ids?: number[] } | null = null
  let savedPermissions: string[] = []
  let savedRole: unknown = null
  let entitySearches = 0
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async route => {
    const url = new URL(route.request().url())
    const path = url.pathname
    let status = 200
    let data: unknown = []
    if (path.endsWith('/role/index')) {
      data = [{ id: 1, name: '自动化操作员', role_key: 'operator', description: '', sort: 10, is_displayed: 0 }]
    } else if (path.endsWith('/role/get')) {
      data = { id: 1, name: '自动化操作员', role_key: 'operator', description: '', sort: 10, is_displayed: 0 }
    } else if (path.endsWith('/member/index')) {
      data = []
    } else if (path.endsWith('/rolePermission/catalog')) {
      data = { groups: [{ name: '身份委托', items: [
        { key: 'identity.team.assume', label: '领取团队身份' },
        { key: 'identity.member.*.assume', label: '领取全部成员身份' },
      ] }] }
    } else if (path.endsWith('/rolePermission/index')) {
      data = []
    } else if (path.endsWith('/entity/search')) {
      entitySearches++
      data = [{ slug: 'bot-a', type: 'teamVirtual', display_name: 'Bot A', available: true, href: null }]
    } else if (path.endsWith('/entityRole/resolve')) {
      const slug = url.searchParams.get('slug')
      if (slug === 'bot') {
        status = 404
        data = null
      } else data = slug === 'bot-a'
        ? { type: 'teamVirtual', id: 9, slug, name: 'Bot A', team: { id: 7, slug: 'team-a', name: '团队 A' }, is_external: true }
        : { type: 'teamMember', id: 21, slug: 'bob', name: 'Bob', team: { id: 8, slug: 'demo', name: '当前团队' }, is_external: false }
    } else if (path.endsWith('/entityRole/index')) {
      data = []
    } else if (path.endsWith('/entityRole/save')) {
      entityAssignment = route.request().postDataJSON()
      data = null
    } else if (path.endsWith('/rolePermission/save')) {
      savedPermissions = route.request().postDataJSON().permission_keys
      data = null
    } else if (path.endsWith('/role/edit')) {
      savedRole = route.request().postDataJSON()
      data = null
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.team.lostsky.work:5175/roles')
  await expect(page.getByRole('link', { name: /管理角色/ })).toHaveAttribute('href', '/roles/1')
  await expect(page.getByText('仅内部')).toBeVisible()
  await expect(page.getByRole('tab')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)

  await page.goto('http://demo.team.lostsky.work:5175/roles/entities?slug=bot')
  await page.getByRole('option', { name: /Bot A/ }).click()
  expect(entitySearches).toBe(1)
  await expect(page.getByText('跨团队实体')).toBeVisible()
  await page.getByRole('checkbox', { name: /自动化操作员/ }).check()
  await page.getByRole('button', { name: '保存分配' }).click()
  await expect.poll(() => entityAssignment).toEqual({ slug: 'bot-a', role_ids: [1] })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)

  await page.goto('http://demo.team.lostsky.work:5175/roles/1')
  await expect(page.getByRole('link', { name: '返回角色列表' })).toBeVisible()
  await page.getByRole('switch', { name: '在公开实体资料中展示此角色' }).click()
  await page.getByRole('button', { name: '保存资料' }).click()
  await expect.poll(() => savedRole).toMatchObject({ id: 1, is_displayed: 1 })
  await expect(page.getByText('身份委托 · 已选择 0/2')).toBeVisible()
  await page.getByLabel('添加精确委托目标').fill('bot-a')
  await page.getByRole('button', { name: '解析并添加' }).click()
  await expect(page.getByRole('alert')).toContainText('精确委托目标必须属于当前团队')
  await page.getByLabel('添加精确委托目标').fill('bob')
  await page.getByRole('button', { name: '解析并添加' }).click()
  await expect(page.getByText('identity.member.bob.assume')).toBeVisible()
  await page.getByRole('button', { name: '保存权限' }).click()
  await expect.poll(() => savedPermissions).toContain('identity.member.bob.assume')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
})

test('transaction workspace covers ledger tasks without horizontal overflow', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') pageErrors.push(message.text()) })
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route('http://demo.transaction.lostsky.work:5177/api/**', async (route) => {
    const url = new URL(route.request().url())
    const entity = { id: 11, entity_id: 11, entityable_type: 'teamMember', entityable_id: 1, type: 'member', slug: 'handler', name: 'Handler', profile: { nickname: 'Handler' }, nickname: '青空接单人', avatar: null, is_blocked: 0 }
    const customer = { id: 8, nickname: '晚风客户', avatar: null, description: '长期客户', is_blocked: 0, balance: { balance: 880, recharged: 1200, spent: 320 } }
    const transaction = {
      id: 21, handler_entity_id: 11, sender_entity_id: null, cs_entity_id: null, customer_id: 8, type: 2,
      total_price: 320, cost: 80, cash: 200, prepaid: 120, handler_cut: 140, sender_cut: 0,
      cs_cut: 0, team_cut: 100, trans_at: 1784563200, memo: '七月陪玩服务',
      handler: entity, customer,
    }
    let data: unknown = null
    if (url.pathname.endsWith('/transaction/options')) data = { entities: [entity], customers: [customer] }
    else if (url.pathname.endsWith('/transaction/stats')) {
      const type = url.searchParams.get('type')
      if (type === 'timeline') data = [{ date: '2026-07-20', count: 1, amount: 320 }]
      else if (type === 'byEntity') data = [{ entity_id: 11, type: 'member', slug: 'handler', name: '青空接单人', count: 1, amount: 140 }]
      else if (type === 'byCustomer') data = [{ customer_id: 8, customer_name: '晚风客户', count: 1, amount: 320 }]
      else data = { total_count: 1, total_price: 320, total_cost: 80, total_cut: 240, cash_total: 200, prepaid_total: 120, avg_price: 320 }
    } else if (url.pathname.endsWith('/transaction/sender/all')) data = [{ id: 3, entity_id: 11, customer_id: 8, create_time: 1784563200, subject: entity, customer }]
    else if (url.pathname.endsWith('/transaction/balance/logs')) data = { list: [{ id: 5, customer_id: 8, type: 1, amount: 1200, balance_after: 1200, memo: '首次充值', create_time: 1784563200 }], total: 1, page: 1, limit: 20 }
    else if (url.pathname.endsWith('/transaction/21')) data = transaction
    else if (url.pathname.endsWith('/transaction')) data = { list: [transaction], total: 1, page: 1, limit: 20 }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  const routes = ['/', '/new', '/detail?id=21', '/edit?id=21', '/stats', '/bindings', '/binding-new', '/balances', '/balance?customer_id=8', '/recharge?customer_id=8']
  for (const path of routes) {
    await page.goto(`http://demo.transaction.lostsky.work:5177${path}`)
    await expect(page.locator('#workspace'), `workspace missing at ${path}; ${pageErrors.join(' | ')}`).toBeVisible()
    await expect(page.locator('.page-heading h2')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow, `horizontal overflow at ${path}`).toBe(false)
  }

  await page.goto('http://demo.transaction.lostsky.work:5177/')
  await expect(page.getByText('晚风客户', { exact: true })).toBeVisible()
  await expect(page.getByText('¥320.00', { exact: true })).toBeVisible()
  await page.goto('http://demo.transaction.lostsky.work:5177/new')
  await expect(page.getByText('金额平衡')).toBeVisible()
  await expect(page.getByRole('button', { name: '保存流水' })).toBeDisabled()
  await page.goto('http://demo.transaction.lostsky.work:5177/stats')
  await expect(page.getByText('成交金额', { exact: true })).toBeVisible()
  await expect(page.getByText('青空接单人')).toBeVisible()
  expect(pageErrors).toEqual([])
})
