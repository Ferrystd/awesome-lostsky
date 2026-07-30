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
        products: [{
          id: 12,
          name: '夜航陪伴',
          description: '公开成员提供的专属服务',
          cover_image: null,
          price: '39.00',
          href: '//demo.shop.lostsky.work/product/12',
        }],
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
  await expect(page.getByRole('heading', { name: '商品', level: 2 })).toBeVisible()
  await expect(page.getByRole('link', { name: /夜航陪伴/ })).toHaveAttribute('href', '//demo.shop.lostsky.work/product/12')
  await expect(page.getByText('¥39.00')).toBeVisible()

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
  let profilePayload: unknown = null
  const profile = {
    id: 31,
    team_id: 1,
    is_blocked: 0 as const,
    profile: { name: '晚风客户', avatar: null, description: '熟悉青空服务' },
    identity: { slug: 'evening-sky' },
    balance: { balance: '100.00', recharged: '100.00', spent: '0.00' },
  }
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
    } else if (url.pathname.endsWith('/customer/me') && request.method() === 'POST') {
      profilePayload = request.postDataJSON()
      Object.assign(profile.profile, {
        name: (profilePayload as { nickname: string }).nickname,
        avatar: (profilePayload as { avatar?: string | null }).avatar,
        description: (profilePayload as { description?: string | null }).description,
      })
      data = null
    } else if (url.pathname.endsWith('/customer/me')) {
      data = profile
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

  await page.goto('http://demo.shop.lostsky.work:5179/customer/profile')
  await expect(page.getByRole('heading', { name: '我的资料', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '我的资料' })).toBeVisible()
  await expect(page.getByLabel('团队内昵称')).toHaveValue('晚风客户')
  await expect(page.getByLabel('只读 slug')).toHaveValue('evening-sky')
  await expect(page.getByLabel('只读 slug')).toHaveAttribute('readonly')
  await page.getByLabel('团队内昵称').fill('晚风来客')
  await page.getByLabel('团队内简介').fill('仅供当前商家识别')
  await page.getByRole('button', { name: '保存资料' }).click()
  await expect(page.getByRole('status')).toContainText('资料已保存')
  expect(profilePayload).toEqual({
    nickname: '晚风来客',
    avatar: null,
    description: '仅供当前商家识别',
  })
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
})

test('shop customer profile deep link verifies identity and distinguishes mismatch from blocking', async ({ page }) => {
  const customerToken = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamCustomer', id: 31 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: customerToken, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  let mode: 'ready' | 'mismatch' | 'blocked' = 'ready'
  let meCalls = 0
  await page.route('http://demo.shop.lostsky.work:5179/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/storefront')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 0, message: 'ok', data: { slug: 'demo', profile: { name: '青空选物' } } }),
      })
      return
    }
    if (path.endsWith('/customer/me')) {
      meCalls++
      if (mode !== 'ready') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 403,
            message: mode === 'blocked' ? '你已被该团队封禁' : '你不是该团队的顾客',
            data: null,
          }),
        })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          message: 'ok',
          data: {
            id: 31,
            team_id: 1,
            is_blocked: 0,
            profile: { name: '深链接客户', avatar: null, description: null },
            identity: { slug: 'deep-link' },
            balance: null,
          },
        }),
      })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: null }) })
  })

  await page.goto('http://demo.shop.lostsky.work:5179/customer/profile')
  await expect(page).toHaveURL(/\/customer\/profile$/)
  await expect(page.getByLabel('团队内昵称')).toHaveValue('深链接客户')
  expect(meCalls).toBe(1)

  mode = 'mismatch'
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('当前身份不属于这家商店')
  await expect(page.getByRole('link', { name: /建立客户身份/ })).toHaveAttribute('href', '/customer/bind?redirect=/customer/profile')

  mode = 'blocked'
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('当前客户身份已被商家封禁')
  await expect(page.getByRole('link', { name: '返回商城', exact: true })).toBeVisible()
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
  let entityType = 'teamMember'
  let displayPayload: unknown = null
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = []
    if (path.endsWith('/entity/get')) {
      data = {
        id: 1,
        slug: 'alice',
        entityable_type: entityType,
        is_displayed: displayed ? 1 : 0,
        is_internal_visible: 1,
        capabilities: { read_all: true, manage_profile: true },
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
  await expect(page.getByRole('link', { name: '发起对话' }))
    .toHaveAttribute('href', 'http://demo.chat.lostsky.work:5176/new?participant=alice')
  await expect(page.getByRole('heading', { name: '公开主页展示' })).toBeVisible()
  const displaySwitch = page.getByRole('switch', { name: '在公开主页展示' })
  await expect(displaySwitch).not.toBeChecked()
  await displaySwitch.click()
  await page.getByRole('button', { name: '保存公开设置' }).click()
  await expect(page.getByRole('status')).toContainText('公开展示设置已保存')
  expect(displayPayload).toEqual({ entity_id: 1, is_displayed: 1 })

  entityType = 'teamCustomer'
  await page.goto('http://demo.team.lostsky.work:5175/entity?id=2')
  await expect(page.getByText('Customer 属于敏感目录，始终需要 team.entity.read 才能查看。')).toBeVisible()
  await expect(page.getByRole('switch', { name: '在团队工作空间内可见' })).toHaveCount(0)
})

test('team explains read-only permissions and missing upload ability without blocking base reads', async ({ page }) => {
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = []
    if (path.endsWith('/access')) {
      data = {
        permissions: ['file.read'],
        abilities: {
          file: { enabled: false, level: 0, expire_time: 0, reason: 'missing', label: '文件上传' },
          doc: { enabled: true, level: 1, expire_time: 0, reason: null, label: '文档' },
        },
      }
    } else if (path.endsWith('/dashboard')) {
      data = {
        entities: { available: true, count: null, error: null, reason: null },
        members: { available: true, count: null, error: null, reason: null },
        documents: { available: true, count: null, error: null, reason: null },
        notices: { available: true, count: 0, error: null, reason: null },
      }
    } else if (path.endsWith('/entity/get')) {
      data = {
        id: 2,
        slug: 'alice',
        entityable_type: 'teamMember',
        is_displayed: 0,
        is_internal_visible: 1,
        capabilities: { read_all: false, manage_profile: false },
        profile: { name: '测试成员', avatar: '', description: '可读资料' },
      }
    } else if (path.endsWith('/file/usage')) {
      data = { total_size: 0, count: 0 }
    } else if (path.endsWith('/file/index')) {
      data = { list: [], total: 0 }
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.team.lostsky.work:5175/')
  await expect(page.locator('.stats a[href="/entities"]')).toBeVisible()
  await expect(page.locator('.stats a[href="/members"]')).toBeVisible()
  await expect(page.locator('.stats a[href="/docs"] strong svg')).toBeVisible()

  await page.goto('http://demo.team.lostsky.work:5175/entity?id=2')
  await expect(page.getByText(/当前为只读模式。缺少权限\(Permission\): team\.entity\.profile\.manage/)).toBeVisible()
  await expect(page.getByRole('button', { name: '保存资料' })).toBeDisabled()

  await page.goto('http://demo.team.lostsky.work:5175/files')
  await expect(page.getByRole('button', { name: '上传文件' })).toBeDisabled()
  await expect(page.getByText('当前团队缺失能力(Ability): 文件上传(File)', { exact: true })).toBeVisible()
})

test('account login remains usable at mobile and desktop widths', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('http://account.lostsky.work:5174/login')
  await expect(page.getByRole('heading', { name: '欢迎回来' }), `login did not render; ${errors.join(' | ')}`).toBeVisible()
  await expect(page.getByLabel('手机号码')).toBeVisible()
  await expect(page.getByLabel('短信验证码')).toBeVisible()
  await expect(page.getByRole('button', { name: '获取验证码' })).toBeVisible()
  await page.getByRole('tab', { name: '密码登录' }).click()
  await expect(page.getByLabel('手机号 / 用户名 / 邮箱')).toBeVisible()
  await expect(page.getByRole('textbox', { name: '密码', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '密码登录' })).toBeVisible()
})

test('login returns to the original LostSky subdomain deep link', async ({ page }) => {
  const originalUrl = 'http://demo.team.lostsky.work:5175/doc?id=11'
  await page.route('http://account.lostsky.work:5174/api/login/password', async (route) => {
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

  await page.getByRole('tab', { name: '密码登录' }).click()
  await page.getByLabel('手机号 / 用户名 / 邮箱').fill('13800138000')
  await page.getByRole('textbox', { name: '密码', exact: true }).fill('test-password')
  await page.getByRole('button', { name: '密码登录' }).click()

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

test('team document reader unwraps the API list response and keeps a readable responsive surface', async ({ page }) => {
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/access')
      ? {
          permissions: ['team.document.read'],
          abilities: { doc: { enabled: true, level: 1, expire_time: 0, reason: null, label: '文档' } },
        }
      : path.endsWith('/doc/get')
        ? {
            total: 1,
            list: [{
              id: 150,
              title: '黄金款服务手册',
              content: '## 服务流程\n\n这是已经保存的正文内容。',
              entity_id: 1,
              visibility: '团队管理可见',
              update_time: '2026-07-30 07:14:09',
              subject: { id: 1, name: '演示团队', slug: 'demo' },
            }],
          }
        : []
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.team.lostsky.work:5175/doc?id=150')

  await expect(page.getByRole('heading', { name: '黄金款服务手册', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: '服务流程', level: 2 })).toBeVisible()
  await expect(page.getByText('这是已经保存的正文内容。')).toBeVisible()
  await expect(page.getByText('演示团队', { exact: true })).toBeVisible()
  await expect(page.locator('.visibility')).toHaveText('团队管理可见')
  await expect(page.getByRole('link', { name: '编辑文档' })).toHaveAttribute('href', '/doc-edit?id=150')
  await expect(page.locator('.document-sheet')).toBeVisible()
  await expect(page.getByText('未命名文档')).toHaveCount(0)

  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
})

test('team workspace routes remain responsive with the API boundary mocked', async ({ page }) => {
  test.setTimeout(240_000)
  const pageErrors: string[] = []
  let emptyNotices = false
  let noticeConfirmRequests = 0
  let noticeSendPayload: Record<string, unknown> | null = null
  let accessPermissions = [
    'team.entity.read',
    'team.entity.profile.manage',
    'team.document.read',
    'team.member.read',
    'team.member.invite',
    'team.member.update',
    'team.member.remove',
    'team.entity_field.manage',
    'chat.virtual.*.manage',
    'team.role.read',
    'team.join_review.read',
    'team.notice.read',
    'team.notice.send',
    'team.setting.read',
    'file.read',
    'file.upload',
    'file.delete',
  ]
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') pageErrors.push(message.text()) })
  page.on('requestfailed', (request) => pageErrors.push(`${request.url()}: ${request.failure()?.errorText}`))
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const url = new URL(route.request().url())
    let data: unknown = []
    if (url.pathname.endsWith('/notice/get') && url.searchParams.get('id') === '404') {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 404, message: '通知不存在', data: null }) })
      return
    }
    if (url.pathname.endsWith('/access')) data = {
      permissions: accessPermissions,
      abilities: {
        file: { enabled: true, level: 1, expire_time: 0, reason: null, label: '文件上传' },
        doc: { enabled: true, level: 1, expire_time: 0, reason: null, label: '文档' },
      },
    }
    else if (url.pathname.endsWith('/dashboard')) data = {
      entities: { available: true, count: 3, error: null, reason: null },
      members: { available: true, count: 1, error: null, reason: null },
      documents: { available: true, count: 2, error: null, reason: null },
      notices: { available: true, count: 1, error: null, reason: null },
    }
    else if (url.pathname.endsWith('/entity/index')) data = { list: [
      { id: 1, slug: 'demo', entityable_type: 'team' },
      { id: 2, slug: 'alice', entityable_type: 'teamMember' },
      { id: 3, slug: 'helper', entityable_type: 'teamVirtual' },
    ], total: 3 }
    else if (url.pathname.endsWith('/file/usage')) data = { total_size: 17_825_792, count: 6 }
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
      { id: 3, entity_id: 3, type: 'teamMember', slug: 'member-1', name: '测试成员', avatar: null },
      { id: 4, entity_id: 4, type: 'teamVirtual', slug: 'helper', name: '协作助手', avatar: null },
    ]
    else if (url.pathname.endsWith('/entity/search')) data = [{ slug: 'alice', type: 'teamMember', display_name: '测试成员', available: true, team: { slug: 'demo', display_name: '测试团队' } }]
    else if (url.pathname.endsWith('/entity/resolve')) data = [
      { slug: 'alice', type: 'teamMember', display_name: '测试成员', available: true, team: { slug: 'demo', display_name: '测试团队' }, href: '/member-detail?id=1' },
      { slug: 'demo', type: 'team', display_name: '测试团队', available: true, team: null, href: '/' },
      { slug: 'helper', type: 'teamVirtual', display_name: '协作助手', available: true, team: { slug: 'demo', display_name: '测试团队' }, href: null },
      { slug: 'customer-1', type: 'teamCustomer', display_name: '测试客户', available: true, team: { slug: 'demo', display_name: '测试团队' }, href: null },
    ]
    else if (url.pathname.endsWith('/notice/get')) data = { id: 21, title: '维护窗口提醒', content: '## 维护安排\n\n请提前保存正在处理的内容。\n\n- 保存草稿\n- 回复确认\n\n<script>window.__noticeXss = 1</script>', is_pinned: 1, is_read: 0, create_time: 1752883200 }
    else if (url.pathname.endsWith('/notice/index')) data = emptyNotices
      ? { list: [], total: 0, can_send: true }
      : url.searchParams.get('is_read') === '0'
        ? { list: [{ id: 21, title: '维护窗口提醒', content: '系统将在今晚进行维护。', is_pinned: 1, is_read: 0, create_time: 1752883200 }], total: 1, can_send: true }
        : { list: [
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
  for (const path of ['/', '/entities', '/members', '/member-detail?id=1', '/member-add', '/member-edit?id=1', '/roles', '/roles/new', '/fields', '/field-new?type=entity', '/chat-virtuals', '/chat-virtual-new', '/chat-virtual?slug=sales-assistant', '/chat-integration-new?slug=sales-assistant', '/chat-integration?slug=sales-assistant&id=1', '/notices/entity', '/notices/entity/detail?id=21', '/notices/team', '/notices/team/detail?id=21', '/notices/send', '/files', '/docs', '/doc-create', '/doc-edit?id=11', '/doc?id=11', '/settings', '/join-review', '/join-review/review?id=1', '/me']) {
    await page.goto(`http://demo.team.lostsky.work:5175${path}`)
    expect(page.url(), `unexpected navigation at ${path}; errors: ${pageErrors.join(' | ')}`).toContain('demo.team.lostsky.work:5175')
    if (!await page.locator('#workspace').count()) throw new Error(`workspace missing at ${path}; url=${page.url()}; authenticated=${Boolean(await page.evaluate(() => localStorage.getItem('lostsky_token')))}; errors=${pageErrors.join(' | ')}; body=${(await page.locator('body').innerText()).slice(0, 400)}`)
    await expect(page.locator('#workspace')).toBeVisible()
    await expect(
      page.locator('#workspace > .admin-page'),
      `admin page hidden at ${path}; errors: ${pageErrors.join(' | ')}`,
    ).toBeVisible({ timeout: 60_000 })
    if (path === '/') {
      await expect(page.getByRole('link', { name: '打开消息' })).toHaveAttribute('href', 'http://demo.chat.lostsky.work:5176/')
      await expect(page.getByRole('link', { name: '进入消息' })).toHaveAttribute('href', 'http://demo.chat.lostsky.work:5176/')
      await expect(page.getByRole('link', { name: '使用文档' })).toHaveAttribute('href', '/docs')
      await expect(page.getByRole('link', { name: /实体 3/ })).toBeVisible()
      await expect(page.getByRole('link', { name: /成员 1/ })).toBeVisible()
      await expect(page.getByRole('link', { name: /文档 2/ })).toHaveAttribute('href', '/docs')
      await expect(page.getByRole('link', { name: /通知 1/ })).toHaveAttribute('href', '/notices/entity')
      const originalViewport = page.viewportSize()
      await page.setViewportSize({ width: 1000, height: 560 })
      const sidebarMenu = page.locator('.sidebar nav')
      const moreMenu = page.getByRole('button', { name: '向下查看更多菜单' })
      await expect(moreMenu).toBeVisible()
      const initialScrollTop = await sidebarMenu.evaluate(element => element.scrollTop)
      await moreMenu.click()
      await expect.poll(() => sidebarMenu.evaluate(element => element.scrollTop)).toBeGreaterThan(initialScrollTop)
      await sidebarMenu.evaluate(element => element.scrollTo({ top: element.scrollHeight }))
      await expect(moreMenu).toBeHidden()
      if (originalViewport) await page.setViewportSize(originalViewport)
    }
    if (path === '/entities') {
      await expect(page.getByRole('link', { name: '与 alice 对话' }))
        .toHaveAttribute('href', 'http://demo.chat.lostsky.work:5176/new?participant=alice')
    }
    if (path === '/members') {
      await expect(page.locator('.sidebar a[href="/members"]')).toContainText('成员')
      await expect(page.getByRole('search').getByRole('searchbox', { name: '搜索成员' })).toBeVisible()
      await expect(page.getByLabel('成员分类')).toBeVisible()
      await expect(page.locator('.member-list')).toBeVisible()
      await expect(page.getByRole('link', { name: '与 测试成员 对话' }))
        .toHaveAttribute('href', 'http://demo.chat.lostsky.work:5176/new?participant=alice')
    }
    if (path === '/member-detail?id=1') {
      await expect(page.getByRole('link', { name: '发起对话' }))
        .toHaveAttribute('href', 'http://demo.chat.lostsky.work:5176/new?participant=alice')
    }
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
    if (path === '/notices/entity' || path === '/notices/team') {
      const scope = path.endsWith('/team') ? 'team' : 'entity'
      await expect(page.getByRole('link', { name: /维护窗口提醒/ })).toHaveAttribute('href', `/notices/${scope}/detail?id=21`)
      await expect(page.getByText('置顶', { exact: true })).toBeVisible()
      await expect(page.locator('.notice-detail-view')).toHaveCount(0)
      await expect(page.locator('.sidebar a[href="/notices/entity"]')).toContainText('通知')
      await expect(page.locator('.sidebar a[href="/notices/team"]')).toContainText('站内通知')
      await expect(page.locator('.sidebar a[href="/notices/send"]')).toContainText('发送通知')
      await expect(page.getByRole('link', { name: '查看通知' })).toHaveAttribute('href', '/notices/entity')
    }
    if (path === '/notices/entity/detail?id=21' || path === '/notices/team/detail?id=21') {
      const isTeamScope = path.includes('/team/')
      await expect(page.getByRole('heading', { name: '维护窗口提醒', level: 1 })).toBeVisible()
      await expect(page.getByRole('heading', { name: '维护安排', level: 2 })).toBeVisible()
      await expect(page.getByText('请提前保存正在处理的内容。')).toBeVisible()
      await expect(page.locator('.notice-content li')).toHaveText(['保存草稿', '回复确认'])
      expect(await page.evaluate(() => (window as typeof window & { __noticeXss?: number }).__noticeXss)).toBeUndefined()
      await expect(page.getByRole('link', { name: isTeamScope ? '返回站内通知列表' : '返回通知列表' }))
        .toHaveAttribute('href', isTeamScope ? '/notices/team' : '/notices/entity')
      await expect(page.getByText('已读', { exact: true })).toBeVisible()
    }
    if (path === '/notices/send') {
      await expect(page.getByRole('heading', { name: '发送通知', level: 2 })).toBeVisible()
      await expect(page.getByText('通知只进入所选实体的收件箱，不支持回复、抄送或会话；发送方统一显示为当前 Team。')).toBeVisible()
      await expect(page.locator('.mode-tabs > button').filter({ hasText: '可视化' })).toBeVisible()
      await expect(page.locator('.mode-tabs > button').filter({ hasText: '源码' })).toBeVisible()
      await expect(page.locator('.mode-tabs > button').filter({ hasText: '预览' })).toBeVisible()
      const noticeVisualEditor = page.locator('.ls-markdown-editor .ProseMirror')
      await noticeVisualEditor.click()
      await expect(noticeVisualEditor).toBeFocused()
      await page.locator('.recipient-select').click()
      const recipientMenu = page.locator('.recipient-select-menu')
      await expect(recipientMenu.locator('.recipient-option')).toHaveCount(4)
      await expect(recipientMenu.locator('.recipient-option').filter({ hasText: '测试团队' })).toContainText('团队@demo')
      await expect(recipientMenu.locator('.recipient-option').filter({ hasText: '测试客户' })).toContainText('客户@customer-1')
      await expect(recipientMenu.locator('.recipient-option').filter({ hasText: '测试成员' })).toContainText('成员@member-1')
      await expect(recipientMenu.locator('.recipient-option').filter({ hasText: '协作助手' })).toContainText('虚拟实体@helper')
      await recipientMenu.locator('.n-base-select-option').filter({ hasText: '测试客户' }).click()
      await page.getByLabel('标题 *').fill('客户专属通知')
      await page.locator('.mode-tabs > button').filter({ hasText: '源码' }).click()
      await page.getByRole('textbox', { name: 'Markdown 源码' }).fill('## 行动\n\n- 保存工作\n- 回复确认')
      await page.getByRole('button', { name: '发送通知' }).click()
      await expect(page.getByRole('status')).toContainText('通知已发送给 测试客户')
      expect(noticeSendPayload).toMatchObject({ entity_id: 2, title: '客户专属通知', content: '## 行动\n\n- 保存工作\n- 回复确认', is_pinned: false })
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
    if (path === '/docs') {
      const documentSearch = page.getByRole('search').getByRole('searchbox', { name: '搜索文档' })
      await expect(documentSearch).toBeVisible()
      expect((await documentSearch.boundingBox())?.height).toBeGreaterThanOrEqual(44)
      await expect(page.getByLabel('文档分类')).toBeVisible()
      await expect(page.locator('.document-list')).toBeVisible()
    }
    if (path === '/files') {
      await expect(page.getByRole('search').getByRole('searchbox', { name: '搜索文件' })).toBeVisible()
      await expect(page.getByRole('heading', { name: '还没有文件' })).toBeVisible()
      await expect(page.locator('.empty > svg')).toBeVisible()
    }
    if (path === '/field-new?type=entity') {
      await expect(page.getByRole('heading', { name: '访问与维护规则' })).toBeVisible()
      await expect(page.getByText('值维护范围')).toBeVisible()
      await expect(page.getByText('值可见范围')).toBeVisible()
      await expect(page.getByRole('switch', { name: '允许修改字段值' })).toBeChecked()
      await expect(page.getByText('允许搜索')).toHaveCount(0)
      await expect(page.getByText('人员本人可见')).toHaveCount(0)
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
        if (footerTops.length === 2) expect(footerTops[1]).toBeGreaterThan(footerTops[0])
      }
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow, `horizontal overflow at ${path}`).toBe(false)
  }

  expect(noticeConfirmRequests).toBe(2)
  await page.goto('http://demo.team.lostsky.work:5175/notices/entity/detail')
  await expect(page.getByRole('alert')).toContainText('缺少有效的通知编号')
  await page.goto('http://demo.team.lostsky.work:5175/notices/entity/detail?id=404')
  await expect(page.getByRole('alert')).toContainText('通知不存在')
  emptyNotices = true
  await page.goto('http://demo.team.lostsky.work:5175/notices/entity')
  await expect(page.getByRole('heading', { name: '目前没有通知' })).toBeVisible()

  await page.goto('http://demo.team.lostsky.work:5175/notice?legacy=1')
  await expect(page).toHaveURL(/\/notices\/entity\?legacy=1$/)
  await page.goto('http://demo.team.lostsky.work:5175/notice-detail?id=21&legacy=1')
  await expect(page).toHaveURL(/\/notices\/entity\/detail\?id=21&legacy=1$/)
  await page.goto('http://demo.team.lostsky.work:5175/notice-send?legacy=1')
  await expect(page).toHaveURL(/\/notices\/send\?legacy=1$/)

  accessPermissions = accessPermissions.filter(permission => (
    permission !== 'team.notice.read' && permission !== 'team.notice.send'
  ))
  await page.goto('http://demo.team.lostsky.work:5175/notices/entity')
  await expect(page.locator('.sidebar a[href="/notices/entity"]')).toBeVisible()
  await expect(page.locator('.sidebar a[href="/notices/team"]')).toHaveCount(0)
  await expect(page.locator('.sidebar a[href="/notices/send"]')).toHaveCount(0)
  await expect(page.locator('.sidebar .nav-disabled').filter({ hasText: '站内通知' })).toBeVisible()
  await expect(page.locator('.sidebar .nav-disabled').filter({ hasText: '发送通知' })).toBeVisible()
})

test('document and file abilities gate the correct controls with transient feedback', async ({ page }) => {
  let docEnabled = true
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async route => {
    const url = new URL(route.request().url())
    let data: unknown = []
    if (url.pathname.endsWith('/access')) {
      data = {
        permissions: ['team.document.read', 'file.read', 'file.upload'],
        abilities: {
          file: { enabled: false, level: 0, expire_time: 0, reason: '未开通', label: '文件上传' },
          doc: { enabled: docEnabled, level: docEnabled ? 1 : 0, expire_time: 0, reason: docEnabled ? null : '未开通', label: '文档' },
        },
      }
    } else if (url.pathname.endsWith('/entity/options')) {
      data = [{ entity_id: 1, type: 'team', slug: 'demo', name: '测试团队' }]
    } else if (url.pathname.endsWith('/dashboard')) {
      data = {
        entities: { available: true, count: 0, error: null, reason: null },
        members: { available: true, count: 0, error: null, reason: null },
        documents: { available: false, count: null, error: null, reason: '当前团队缺失能力(Ability): 文档(Document)' },
        notices: { available: true, count: 0, error: null, reason: null },
      }
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  await page.goto('http://demo.team.lostsky.work:5175/doc-create')
  const visualEditor = page.locator('.ls-markdown-editor .ProseMirror')
  await expect(visualEditor).toHaveAttribute('contenteditable', 'true')
  await visualEditor.click()
  await expect(visualEditor).toBeFocused()
  await visualEditor.type('正文仍可编辑')
  await expect(visualEditor).toContainText('正文仍可编辑')
  await expect(visualEditor).toBeFocused()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('lostsky:markdown:document:new'))).toContain('正文仍可编辑')
  await page.reload()
  await expect(visualEditor).toContainText('正文仍可编辑')
  await visualEditor.click()
  await expect(visualEditor).toBeFocused()
  await visualEditor.type('，刷新后继续输入', { delay: 80 })
  await expect(visualEditor).toContainText('正文仍可编辑，刷新后继续输入')
  await expect(visualEditor).toBeFocused()
  const imageUpload = page.locator('button:has(svg[data-lostsky-image-upload])')
  await expect(imageUpload).toBeVisible()
  await expect(imageUpload).toBeDisabled()
  await expect(imageUpload).toHaveAttribute('aria-disabled', 'true')
  await expect(imageUpload).toHaveAttribute('aria-label', /文件上传/)
  await imageUpload.dispatchEvent('pointerdown', { button: 0 })
  await imageUpload.dispatchEvent('pointerdown', { button: 0 })
  await expect(page.locator('.milkdown-image-block')).toHaveCount(0)
  await expect(page.locator('.n-message').filter({ hasText: '文件上传' })).toBeVisible()
  await expect(page.getByText('上传本地图片', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '新建文档', level: 2 })).toBeVisible()

  docEnabled = false
  await page.goto('http://demo.team.lostsky.work:5175/docs')
  await expect(page).toHaveURL('http://demo.team.lostsky.work:5175/')
  const abilityMessage = page.locator('.n-message').filter({ hasText: '文档' })
  await expect(abilityMessage).toBeVisible()
  await expect(abilityMessage).toBeHidden({ timeout: 6_000 })
  await expect(page.locator('.sidebar .nav-disabled').filter({ hasText: '文档' })).toBeVisible()
})

test('access snapshot failure does not fabricate permission denials', async ({ page }) => {
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/access')) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ code: 503, message: '访问快照暂时不可用', data: null }),
      })
      return
    }
    const data = path.endsWith('/member/index') ? [] : null
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  await page.goto('http://demo.team.lostsky.work:5175/members')
  await expect(page.locator('.sidebar .nav-disabled')).toHaveCount(0)
  await expect(page.locator('.sidebar a[href="/docs"]')).toBeVisible()
  await expect(page.locator('.sidebar a[href="/files"]')).toBeVisible()
  await expect(page.getByRole('link', { name: '添加成员' })).toBeVisible()
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
          { id: 101, name: '公开称号', value_type: 'string', input_type: 'text', is_editable: 1, can_edit: true },
          { id: 102, name: '只读编号', value_type: 'string', input_type: 'text', is_editable: 0, can_edit: false },
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

test('entity field form saves unified access rules and custom targets', async ({ page }) => {
  let savedPayload: Record<string, unknown> | null = null
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = []
    if (path.endsWith('/entity/options')) {
      data = [
        { entity_id: 1, type: 'team', slug: 'demo', name: '测试团队' },
        { entity_id: 2, type: 'teamMember', slug: 'alice', name: '测试成员' },
      ]
    } else if (path.endsWith('/entityField/create')) {
      savedPayload = route.request().postDataJSON() as Record<string, unknown>
      data = null
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  await page.goto('http://demo.team.lostsky.work:5175/field-new?type=entity')
  await page.getByPlaceholder('department').fill('department')
  await page.getByPlaceholder('部门').fill('部门')
  const visibilitySelect = page.locator('.access-policy > label').filter({ hasText: '值可见范围' }).locator('.n-select')
  await visibilitySelect.click()
  await page.locator('.n-base-select-option').filter({ hasText: '公开可见' }).click()
  await expect(page.getByText('公开字段只有在所属实体有效且已开启公开主页展示时')).toBeVisible()
  await visibilitySelect.click()
  await page.locator('.n-base-select-option').filter({ hasText: '指定对象可见' }).click()
  const targets = page.locator('.access-policy > label').filter({ hasText: '指定可见对象' }).locator('.n-select')
  await targets.click()
  await page.locator('.n-base-select-option').filter({ hasText: '测试成员' }).click()
  await page.getByRole('button', { name: '保存字段' }).click()
  await expect.poll(() => savedPayload).not.toBeNull()
  expect(savedPayload).toMatchObject({
    entity_type: 'entity',
    field_key: 'department',
    name: '部门',
    manager_scope: 1,
    visibility: 6,
    visibility_targets: [{ entity_id: 2 }],
    is_required: 0,
    is_editable: 1,
  })
  expect(savedPayload).not.toHaveProperty('is_searchable')
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
