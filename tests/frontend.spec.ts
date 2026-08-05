import { expect, test } from '@playwright/test'

test('landing page keeps the legacy studio journey without horizontal overflow', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/')
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
  let entityIndexMode: 'full' | 'empty' | 'error' = 'full'
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
          description: null,
          intro_image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="720" height="900"%3E%3Crect width="720" height="900" fill="%230ea5a5"/%3E%3C/svg%3E',
          introduction_markdown: '欢迎 [@公开成员](lostsky://entity/public-member)\n\n<script>window.__displayXss = 1</script>',
          document_tags: [
            { tag: '精选', description: '值得优先阅读的内容' },
            { tag: '空分组', description: '没有文档时不显示' },
            { tag: '指南', description: '团队持续维护的使用说明' },
          ],
        },
        fields: [{ key: 'founded', name: '成立年份', value_type: 'int', value: 2025 }],
        settings: {
          homepage_welcome: '这里是青空协作组的主页',
          homepage_entities_link: '认识公开伙伴',
          homepage_entities_title: '公开伙伴',
          homepage_entities_description: '真人成员与数字伙伴',
          homepage_entities_empty: '伙伴资料正在准备中',
        },
      }
    } else if (url.pathname.endsWith('/entity/index')) {
      if (entityIndexMode === 'error') {
        await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ code: 503, message: '实体目录暂时不可用', data: null }) })
        return
      }
      const allEntities = [
        { slug: 'public-member', type: 'teamMember', name: '公开成员', avatar: null, description: '负责公开内容', roles: [{ name: '内容主理人', description: '维护公开资料' }] },
        { slug: 'public-bot', type: 'teamVirtual', name: '青空助手', avatar: null, description: '虚拟实体' },
        ...Array.from({ length: 20 }, (_, index) => ({
          slug: `public-member-${index + 2}`,
          type: 'teamMember' as const,
          name: `公开成员 ${index + 2}`,
          avatar: null,
          description: '团队公开成员',
        })),
      ]
      const keyword = (url.searchParams.get('keyword') ?? '').trim().toLocaleLowerCase()
      const type = url.searchParams.get('type')
      const pageNumber = Number(url.searchParams.get('page') ?? 1)
      const limit = Number(url.searchParams.get('limit') ?? 20)
      const matches = entityIndexMode === 'empty'
        ? []
        : allEntities.filter(entity => (!type || entity.type === type)
          && (!keyword || `${entity.name} ${entity.slug}`.toLocaleLowerCase().includes(keyword)))
      data = {
        total: matches.length,
        page: pageNumber,
        limit,
        list: matches.slice((pageNumber - 1) * limit, pageNumber * limit),
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
          document_tags: [{ tag: '成员资料', description: '成员相关的公开内容' }],
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
      const entitySlug = url.searchParams.get('entity_slug')
      data = {
        total: entitySlug ? 1 : 2,
        page: 1,
        limit: 20,
        list: entitySlug
          ? [{
              id: 9,
              title: '成员指南',
              tags: ['成员资料'],
              sort: 0,
              update_time: 1_753_660_800,
              entity: { slug: entitySlug, type: 'teamMember', name: '公开成员' },
            }]
          : [{
              id: 7,
              title: '团队公开指南',
              tags: ['指南', '精选'],
              sort: 0,
              update_time: 1_753_660_800,
              entity: { slug: 'demo', type: 'team', name: '青空协作组' },
            }, {
              id: 8,
              title: '团队动态',
              tags: ['未配置标签'],
              sort: 1,
              update_time: 1_753_660_801,
              entity: { slug: 'demo', type: 'team', name: '青空协作组' },
            }],
      }
    } else if (url.pathname.endsWith('/document/get')) {
      data = {
        id: 7,
        title: '团队公开指南',
        content: '# 使用说明\n\n公开正文。\n\n> 所有内容均可公开查看。\n\n## 阅读步骤\n\n- 确认范围\n- 阅读正文\n\n| 类型 | 状态 |\n| --- | --- |\n| 文档 | 公开 |',
        tags: ['指南', '精选'],
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
  await expect(page.getByText('这里是青空协作组的主页')).toBeVisible()
  await expect(page.getByRole('link', { name: '认识公开伙伴' })).toHaveAttribute('href', '#entities')
  await expect(page.getByRole('heading', { name: '公开伙伴' })).toBeVisible()
  await expect(page.getByText('真人成员与数字伙伴')).toBeVisible()
  await expect(page.locator('#entities a[href="/entity/public-member"]')).toBeVisible()
  await expect(page.locator('#entities .entity-list > a')).toHaveCount(6)
  await expect(page.locator('#entities .pager')).toHaveCount(0)
  await expect(page.locator('a[href="/entities"]')).toHaveCount(0)
  await expect(page.getByText('内容主理人').first()).toBeVisible()
  await expect(page.getByText('成立年份')).toBeVisible()
  await expect(page.locator('.content-section .section-heading h2')).toHaveText(['精选', '指南', '公开文档', '公开伙伴'])
  await expect(page.getByRole('heading', { name: '空分组' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /团队公开指南/ })).toHaveCount(2)
  await expect(page.getByRole('link', { name: /团队动态/ })).toBeVisible()
  await expect(page.locator('.hero-portrait')).toBeVisible()
  await expect(page.locator('.profile-media img')).toHaveCount(0)
  await expect(page.locator('.public-markdown script')).toHaveCount(0)
  expect(await page.evaluate(() => (window as typeof window & { __displayXss?: number }).__displayXss)).toBeUndefined()
  await expect(page.getByRole('button', { name: /聊天/ })).toHaveCount(0)

  entityIndexMode = 'empty'
  await page.reload()
  await expect(page.getByText('伙伴资料正在准备中')).toBeVisible()
  entityIndexMode = 'full'

  await page.goto('http://demo.display.lostsky.work:5178/entities')
  await expect(page.getByRole('heading', { name: '公开实体', level: 1 })).toBeVisible()
  await expect(page.getByRole('searchbox', { name: '搜索实体名称或 Slug' })).toBeVisible()
  await expect(page.getByText('共 22 个公开实体')).toBeVisible()
  await expect(page.locator('.entity-list > a')).toHaveCount(20)
  await expect(page.getByText('第 1 / 2 页')).toBeVisible()
  await page.getByRole('button', { name: '下一页' }).click()
  await expect(page.getByText('第 2 / 2 页')).toBeVisible()
  await expect(page.locator('.entity-list > a')).toHaveCount(2)

  const directorySearch = page.getByRole('searchbox', { name: '搜索实体名称或 Slug' })
  await directorySearch.fill('PUBLIC-BOT')
  await expect(page.getByText('共 1 个公开实体')).toBeVisible()
  await expect(page.getByRole('link', { name: /青空助手/ })).toBeVisible()
  await page.getByRole('button', { name: '成员', exact: true }).click()
  await expect(page.getByText('没有符合条件的公开实体。')).toBeVisible()
  await directorySearch.fill('')
  await expect(page.getByText('共 21 个公开实体')).toBeVisible()
  await page.getByRole('button', { name: '全部', exact: true }).click()
  await expect(page.getByText('共 22 个公开实体')).toBeVisible()

  entityIndexMode = 'empty'
  await page.reload()
  await expect(page.getByText('团队暂时没有公开实体。')).toBeVisible()
  entityIndexMode = 'error'
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('实体列表加载失败')
  entityIndexMode = 'full'
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByText('共 22 个公开实体')).toBeVisible()

  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 })
    await page.goto('http://demo.display.lostsky.work:5178/entities')
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `display entity directory overflows at ${width}px`).toBe(false)
  }

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('http://demo.display.lostsky.work:5178/')
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
  await expect(page.getByRole('heading', { name: '成员资料', level: 2 })).toBeVisible()
  await expect(page.getByText('成员相关的公开内容')).toBeVisible()

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
  await expect(page.getByRole('heading', { name: '精选', level: 2 })).toBeVisible()
  await expect(page.locator('#entities .entity-list > a:visible')).toHaveCount(3)
  const mobileLayout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    offenders: [...document.querySelectorAll<HTMLElement>('body *')]
      .filter(element => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .slice(0, 8)
      .map(element => ({ tag: element.tagName, className: element.className, right: Math.round(element.getBoundingClientRect().right), width: Math.round(element.getBoundingClientRect().width) })),
  }))
  expect(mobileLayout.overflow, JSON.stringify(mobileLayout)).toBe(false)
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
  await expect(page).toHaveURL(url => url.origin === 'http://account.lostsky.work:5174'
    && url.pathname === '/identity/current/profile'
    && url.searchParams.get('redirect') === 'http://demo.shop.lostsky.work:5179/')
})

test('shop customer profile deep link delegates verification to Account current entity center', async ({ page }) => {
  const customerToken = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamCustomer', id: 31 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: customerToken, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
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
  await expect(page).toHaveURL(url => url.origin === 'http://account.lostsky.work:5174'
    && url.pathname === '/identity/current/profile')
  expect(meCalls).toBe(0)
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
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
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
        profile: {
          name: '测试成员',
          avatar: '',
          description: '公开资料',
          document_tags: [{ tag: '精选', description: '优先阅读' }],
        },
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
  await expect(page.getByRole('heading', { name: '公开主页展示' }), `entity detail did not render; ${errors.join(' | ')}`).toBeVisible()
  await expect(page.getByRole('link', { name: '发起对话' }))
    .toHaveAttribute('href', 'http://demo.chat.lostsky.work:5176/new?participant=alice')
  const displaySwitch = page.getByRole('switch', { name: '在公开主页展示' })
  await expect(displaySwitch).not.toBeChecked()
  await displaySwitch.click()
  await page.getByRole('button', { name: '保存公开设置' }).click()
  await expect(page.locator('.n-message').filter({ hasText: '公开展示设置已保存' })).toBeVisible()
  expect(displayPayload).toEqual({ entity_id: 1, is_displayed: 1 })

  entityType = 'teamCustomer'
  await page.goto('http://demo.team.lostsky.work:5175/entity?id=2')
  await expect(page.getByText('Customer 属于敏感目录，始终需要 team.entity.read 才能查看。')).toBeVisible()
  await expect(page.getByRole('switch', { name: '在团队工作空间内可见' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '公开文档分组' })).toHaveCount(0)
})

test('team document and entity tag editors validate, reorder and preserve API order', async ({ page }, testInfo) => {
  test.setTimeout(120_000)
  let documentPayload: Record<string, unknown> | null = null
  let profilePayload: Record<string, unknown> | null = null
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    let data: unknown = []
    if (path.endsWith('/access')) {
      data = {
        permissions: ['team.document.read', 'team.entity.profile.manage'],
        abilities: {
          file: { enabled: true, level: 1, expire_time: 0, reason: null, label: '文件上传' },
          doc: { enabled: true, level: 1, expire_time: 0, reason: null, label: '文档' },
        },
      }
    } else if (path.endsWith('/entity/options')) {
      data = [{ entity_id: 1, type: 'team', slug: 'demo', name: '测试团队' }]
    } else if (path.endsWith('/doc/get')) {
      data = {
        id: 11,
        title: '标签测试文档',
        content: '正文',
        entity_id: 1,
        manager_scope: 1,
        visibility: 1,
        sort: 0,
        tags: ['指南', '精选'],
      }
    } else if (path.endsWith('/doc/edit')) {
      documentPayload = route.request().postDataJSON() as Record<string, unknown>
      data = null
    } else if (path.endsWith('/entity/get')) {
      data = {
        id: 1,
        slug: 'demo',
        entityable_type: 'team',
        is_displayed: 1,
        is_internal_visible: 1,
        capabilities: { read_all: true, manage_profile: true },
        profile: {
          name: '测试团队',
          avatar: '',
          description: '团队公开资料',
          document_tags: [
            { tag: '精选', description: '优先阅读' },
            { tag: '指南', description: null },
          ],
        },
      }
    } else if (path.endsWith('/entity/profile')) {
      profilePayload = route.request().postDataJSON() as Record<string, unknown>
      data = null
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.team.lostsky.work:5175/doc-edit?id=11')
  const documentTags = page.locator('.document-tags input')
  const documentTagValues = () => documentTags.evaluateAll(elements => elements.map(element => (element as HTMLInputElement).value))
  await expect(documentTags).toHaveCount(2)
  await expect.poll(documentTagValues).toEqual(['指南', '精选'])
  await documentTags.nth(1).fill('指南')
  await page.getByRole('button', { name: '保存文档' }).click()
  await expect(page.getByText('标签不能重复')).toBeVisible()
  expect(documentPayload).toBeNull()
  await documentTags.nth(1).fill('精选')

  const handles = page.locator('.document-tags .ls-form-list__handle')
  if (testInfo.project.name.includes('mobile')) {
    await page.getByRole('button', { name: '上移文档标签 2' }).click()
  } else {
    await handles.nth(1).dragTo(page.locator('.document-tags .ls-form-list__item').nth(0))
  }
  await expect.poll(documentTagValues).toEqual(['精选', '指南'])
  await page.getByRole('button', { name: '下移文档标签 1' }).click()
  await expect.poll(documentTagValues).toEqual(['指南', '精选'])
  await page.getByRole('button', { name: '添加标签' }).click()
  await expect(documentTags).toHaveCount(3)
  await documentTags.nth(2).fill('更新')
  await page.getByRole('button', { name: '保存文档' }).click()
  await expect.poll(() => documentPayload).not.toBeNull()
  expect(documentPayload).toMatchObject({ tags: ['指南', '精选', '更新'] })

  await page.goto('http://demo.team.lostsky.work:5175/entity?id=1')
  const groupRows = page.locator('.document-tag-group-fields')
  await expect(groupRows).toHaveCount(2)
  const firstGroupInputs = groupRows.nth(0).locator('input')
  await expect(firstGroupInputs.nth(0)).toHaveValue('精选')
  await expect(firstGroupInputs.nth(1)).toHaveValue('优先阅读')
  const [tagBox, descriptionBox] = await Promise.all([
    firstGroupInputs.nth(0).boundingBox(),
    firstGroupInputs.nth(1).boundingBox(),
  ])
  expect(tagBox?.height).toBe(44)
  expect(descriptionBox?.height).toBe(44)
  if (testInfo.project.name.includes('mobile')) expect(tagBox?.x).toBe(descriptionBox?.x)
  else expect(tagBox?.y).toBe(descriptionBox?.y)
  await groupRows.nth(1).locator('input').nth(0).fill('精选')
  await page.getByRole('button', { name: '保存资料' }).click()
  await expect(page.getByText('标签不能重复')).toBeVisible()
  expect(profilePayload).toBeNull()
  await groupRows.nth(1).locator('input').nth(0).fill('指南')
  await page.getByRole('button', { name: '下移展示标签 1' }).click()
  await page.getByRole('button', { name: '添加展示标签' }).click()
  await expect(groupRows).toHaveCount(3)
  await groupRows.nth(2).locator('input').nth(0).fill('动态')
  await groupRows.nth(2).locator('input').nth(1).fill('   ')
  await page.getByRole('button', { name: '保存资料' }).click()
  await expect.poll(() => profilePayload).not.toBeNull()
  expect(profilePayload).toMatchObject({
    document_tags: [
      { tag: '指南', description: null },
      { tag: '精选', description: '优先阅读' },
      { tag: '动态', description: null },
    ],
  })

  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `tag editor overflow at ${width}px`).toBe(false)
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), 'tag editor overflow at 200% text').toBe(false)
  const actionTarget = await page.getByRole('button', { name: '删除展示标签 1' }).boundingBox()
  expect(actionTarget?.width).toBeGreaterThanOrEqual(44)
  expect(actionTarget?.height).toBeGreaterThanOrEqual(44)
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
        profile: {
          name: '测试成员',
          avatar: '',
          description: '可读资料',
          document_tags: [{ tag: '只读分组', description: '不可修改' }],
        },
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
  await expect(page.getByText(/当前为只读模式。您缺少权限\(Permission\): team\.entity\.profile\.manage,请联系团队管理员开通。/)).toBeVisible()
  await expect(page.getByRole('button', { name: '保存资料' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '添加展示标签' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '删除展示标签 1' })).toBeDisabled()

  await page.goto('http://demo.team.lostsky.work:5175/files')
  const uploadButton = page.getByRole('button', { name: '上传文件' })
  await expect(uploadButton).toBeDisabled()
  await expect(page.locator('.ls-upload-field__reason')).toHaveCount(0)
  await expect(page.getByText('团队能力(Ability)缺失: 文件上传(File),管理员可按需购买。', { exact: true })).toHaveCount(0)
  await uploadButton.focus()
  await uploadButton.press('Enter')
  await expect(page.getByText('团队能力(Ability)缺失: 文件上传(File),管理员可按需购买。', { exact: true })).toBeVisible()
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
  const modeTabs = page.getByRole('tab')
  await expect(modeTabs).toHaveCount(2)
  const [smsTabBox, passwordTabBox] = await Promise.all([
    modeTabs.nth(0).boundingBox(),
    modeTabs.nth(1).boundingBox(),
  ])
  expect(smsTabBox).not.toBeNull()
  expect(passwordTabBox).not.toBeNull()
  expect(Math.abs(smsTabBox!.y - passwordTabBox!.y)).toBeLessThan(1)
  const smsAuthFormBox = await page.locator('.auth-form').boundingBox()
  const smsFormBox = await page.locator('.form').boundingBox()
  const smsCodeInputBox = await page.locator('.code-row .ls-input').boundingBox()
  const smsCodeButtonBox = await page.locator('.code-row .ls-button').boundingBox()
  expect(smsAuthFormBox).not.toBeNull()
  expect(smsFormBox).not.toBeNull()
  expect(smsCodeInputBox).not.toBeNull()
  expect(smsCodeButtonBox).not.toBeNull()
  expect(Math.abs(smsCodeInputBox!.height - smsCodeButtonBox!.height)).toBeLessThan(1)
  await page.getByText('密码登录', { exact: true }).click()
  await expect(page.getByLabel('手机号 / 用户名 / 邮箱')).toBeVisible()
  await expect(page.getByRole('textbox', { name: '密码', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '密码登录' })).toBeVisible()
  const passwordAuthFormBox = await page.locator('.auth-form').boundingBox()
  const passwordFormBox = await page.locator('.form').boundingBox()
  expect(passwordAuthFormBox).not.toBeNull()
  expect(passwordFormBox).not.toBeNull()
  expect(Math.abs(smsAuthFormBox!.y - passwordAuthFormBox!.y)).toBeLessThan(1)
  expect(Math.abs(smsAuthFormBox!.height - passwordAuthFormBox!.height)).toBeLessThan(1)
  expect(Math.abs(smsFormBox!.height - passwordFormBox!.height)).toBeLessThan(1)
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

  await page.getByText('密码登录', { exact: true }).click()
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
  await expect(page.getByText('团队管理可见', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: '编辑文档' })).toHaveAttribute('href', '/doc-edit?id=150')
  await expect(page.locator('.document-sheet')).toBeVisible()
  await expect(page.getByText('未命名文档')).toHaveCount(0)

  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
})

test('team customer detail reports incomplete success responses instead of rendering a blank page', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/access')
      ? { permissions: ['team.customer.read'], abilities: {} }
      : path.endsWith('/customer/518')
        ? { id: 518, slug: 'broken-customer', name: '响应不完整的客户', can_manage: false }
        : []
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.team.lostsky.work:5175/customers/518')

  const errorState = page.locator('.ls-async-state')
  await expect(errorState).toContainText('暂时无法读取客户详情')
  await expect(errorState).toContainText('客户详情数据不完整，请刷新后重试')
  expect(pageErrors).toEqual([])
})

test('team customer detail renders assignees as typed entity options', async ({ page }) => {
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/access')
      ? { permissions: ['team.customer.manage'], abilities: {} }
      : path.endsWith('/customer/assignees')
        ? [
            { entity_id: 1, slug: 'demo', type: 'team', name: 'test团队' },
            { entity_id: 2, slug: 'member-1', type: 'teamMember', name: '测试的所有者' },
            { entity_id: 3, slug: 'member-2', type: 'teamMember', name: 'member-2' },
            { entity_id: 4, slug: 'virtual', type: 'teamVirtual', name: '1' },
          ]
        : path.endsWith('/customer/518')
          ? {
              id: 518,
              slug: 'customer-518',
              name: '测试客户',
              avatar: null,
              description: null,
              is_blocked: false,
              create_time: 1_782_633_600,
              balance: { balance: '0.00', recharged: '0.00', spent: '0.00' },
              assignee: null,
              summary: { transaction_count: 0, transaction_total: '0.00', order_count: 0, order_total: '0.00' },
              can_manage: true,
            }
          : []
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  await page.goto('http://demo.team.lostsky.work:5175/customers/518')
  await page.locator('#customer-assignee').click()

  const options = page.locator('.entity-select-menu .entity-select-option')
  await expect(options).toHaveCount(4)
  await expect(options.nth(0)).toContainText('test团队')
  await expect(options.nth(0)).toContainText('团队')
  await expect(options.nth(0)).toContainText('@demo')
  await expect(options.nth(1)).toContainText('成员')
  await expect(options.nth(3)).toContainText('虚拟实体')
})

test('team workspace routes remain responsive with the API boundary mocked', async ({ page }) => {
  test.setTimeout(240_000)
  const pageErrors: string[] = []
  let emptyNotices = false
  let noticeConfirmRequests = 0
  let noticeSendPayload: Record<string, unknown> | null = null
  let settingPayload: Record<string, unknown> | null = null
  let accessPermissions = [
    'team.entity.read',
    'team.entity.profile.manage',
    'team.document.read',
    'team.customer.read',
    'team.member.read',
    'team.member.invite',
    'team.member.update',
    'team.member.remove',
    'team.entity_field.manage',
    'chat.virtual.*.manage',
    'team.role.read',
    'team.join_field.read',
    'team.join_field.write',
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
    else if (url.pathname.endsWith('/joinField/index')) data = [
      { id: 41, field_key: 'experience', name: '相关经验', value_type: 'string', input_type: 'text', options: null, default_value: null, is_apply_fillable: 1, is_apply_required: 1, is_transfer_entity_field: 1, entity_field_id: 7, entity_field: { id: 7, field_key: 'member_experience', name: '成员经验', value_type: 'string', input_type: 'text' }, is_active: 1, sort: 10 },
      { id: 42, field_key: 'portfolio', name: '作品说明', value_type: 'text', input_type: 'textarea', options: null, default_value: null, is_apply_fillable: 1, is_apply_required: 0, is_transfer_entity_field: 0, entity_field_id: null, entity_field: null, is_active: 0, sort: 20 },
    ]
    else if (url.pathname.endsWith('/joinField/transferOptions')) data = [{ id: 7, field_key: 'member_experience', name: '成员经验', value_type: 'string', input_type: 'text', sort: 10 }]
    else if (url.pathname.endsWith('/doc/get')) data = { id: 11, title: '第一份文档', content: '欢迎 [@测试成员](lostsky://entity/alice)\n\n关联 [@测试团队](lostsky://entity/demo)、[@协作助手](lostsky://entity/helper) 和 [@测试客户](lostsky://entity/customer-1)。\n\n<script>window.__lostskyXss = 1</script>', entity_id: 1, manager_scope: 1, visibility: 1, sort: 0 }
    else if (url.pathname.endsWith('/doc')) data = { list: [{ id: 11, title: '第一份文档', content: '', visibility: 1 }, { id: 12, title: '第二份文档', content: '这是一段长度不同的摘要，用来验证文档卡片底栏仍然共用同一条基线。', visibility: 1 }], total: 2 }
    else if (url.pathname.endsWith('/member/get')) data = {
      id: 1,
      user_id: 1,
      nickname: '测试成员',
      slug: 'alice',
      status_code: 'active',
      status_label: '正常',
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
    else if (url.pathname.endsWith('/member/index')) data = [{ id: 1, user_id: 1, nickname: '测试成员', slug: 'alice', status_code: 'active', status_label: '正常' }]
    else if (url.pathname.endsWith('/customer/assignees')) data = [{ entity_id: 2, slug: 'alice', type: 'teamMember', name: '测试成员', avatar: null }]
    else if (url.pathname.endsWith('/customer')) {
      const list = url.searchParams.get('keyword')
        ? []
        : [{ id: 8, slug: 'customer-1', name: '测试客户', avatar: null, description: '长期客户', is_blocked: false, create_time: 1_782_633_600, balance: { balance: '880', recharged: '1200', spent: '320' }, assignee: null }]
      data = { list, total: list.length, page: 1, limit: 20, scope: 'all' }
    }
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
        {
          app_name: 'display', label: '公开主页', description: '配置团队公开主页的固定展示文案。', order: 40,
          settings: [
            { key: 'homepage_welcome', label: '主页欢迎语', description: '团队公开简介为空时显示在主页首屏。', type: 'string', control: 'input', order: 10, default: '欢迎来到我们的公开主页', value: '欢迎来到我们的公开主页', min_length: 1, max_length: 100 },
            { key: 'homepage_entities_link', label: '实体入口文案', description: '主页首屏中跳转到公开实体区域的链接文案。', type: 'string', control: 'input', order: 20, default: '浏览公开实体', value: '浏览公开实体', min_length: 1, max_length: 100 },
            { key: 'homepage_entities_title', label: '实体区域标题', description: '主页公开实体预览区域的标题。', type: 'string', control: 'input', order: 30, default: '公开实体', value: '公开实体', min_length: 1, max_length: 100 },
            { key: 'homepage_entities_description', label: '实体区域说明', description: '主页公开实体预览区域的辅助说明。', type: 'string', control: 'input', order: 40, default: '团队成员与虚拟实体', value: '团队成员与虚拟实体', min_length: 1, max_length: 100 },
            { key: 'homepage_entities_empty', label: '实体空状态文案', description: '团队没有可公开实体时显示的提示。', type: 'string', control: 'input', order: 50, default: '团队暂时没有公开实体', value: '团队暂时没有公开实体', min_length: 1, max_length: 100 },
          ],
        },
      ],
    }
    else if (url.pathname.endsWith('/setting')) {
      if (route.request().method() === 'POST') settingPayload = route.request().postDataJSON() as Record<string, unknown>
      data = { team_searchable: false, member_searchable: false, member_search_priority: 'team' }
    }
    else if (url.pathname.endsWith('/me/get')) data = {
      id: 1,
      user_id: 1,
      nickname: '测试成员',
      slug: 'alice',
      status_code: 'active',
      status_label: '正常',
      custom_fields: [],
      custom_field_values: [],
      role_assignments: [],
      effective_permissions: [],
    }
    else if (url.pathname.endsWith('/join/form')) data = { purpose_code: 'join', purpose_label: '加入', refill_required: true, fields: [] }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })
  const collectionPaths = new Set(['/entities', '/members', '/customers', '/roles', '/fields', '/join-fields', '/chat-virtuals', '/notices/entity', '/notices/team', '/files', '/docs', '/join-review'])
  for (const path of ['/', '/entities', '/members', '/customers', '/member-detail?id=1', '/member-add', '/member-edit?id=1', '/roles', '/roles/new', '/fields', '/field-new?type=entity', '/join-fields', '/join-fields/new', '/join-fields/42', '/chat-virtuals', '/chat-virtual-new', '/chat-virtual?slug=sales-assistant', '/chat-integration-new?slug=sales-assistant', '/notices/entity', '/notices/entity/detail?id=21', '/notices/team', '/notices/team/detail?id=21', '/notices/send', '/files', '/docs', '/doc-create', '/doc-edit?id=11', '/doc?id=11', '/settings', '/join-review', '/join-review/review?id=1']) {
    await page.goto(`http://demo.team.lostsky.work:5175${path}`)
    expect(page.url(), `unexpected navigation at ${path}; errors: ${pageErrors.join(' | ')}`).toContain('demo.team.lostsky.work:5175')
    if (!await page.locator('#workspace').count()) throw new Error(`workspace missing at ${path}; url=${page.url()}; authenticated=${Boolean(await page.evaluate(() => localStorage.getItem('lostsky_token')))}; errors=${pageErrors.join(' | ')}; body=${(await page.locator('body').innerText()).slice(0, 400)}`)
    await expect(page.locator('#workspace')).toBeVisible()
    await expect(
      page.locator('#workspace > .ls-page'),
      `admin page hidden at ${path}; errors: ${pageErrors.join(' | ')}`,
    ).toBeVisible({ timeout: 60_000 })
    if (collectionPaths.has(path)) await expect(page.locator('.ls-list-toolbar')).toBeVisible()
    if (path === '/entities' || path === '/customers') {
      const toolbar = page.locator('.ls-list-toolbar')
      const searchBox = await toolbar.locator('.ls-search-input').boundingBox()
      expect(searchBox).not.toBeNull()
      if ((page.viewportSize()?.width ?? 0) < 640) {
        expect(searchBox?.height).toBeCloseTo(44, 0)
        for (const select of await toolbar.locator('.n-select').all()) {
          const box = await select.boundingBox()
          expect(box?.height).toBeCloseTo(44, 0)
          expect(box?.width).toBeCloseTo(searchBox?.width ?? 0, 0)
        }
      } else {
        expect(searchBox?.height).toBeCloseTo(40, 0)
        expect(searchBox?.width).toBeLessThanOrEqual(449)
        for (const select of await toolbar.locator('.n-select').all()) {
          const box = await select.boundingBox()
          expect(box?.height).toBeCloseTo(40, 0)
          expect(box?.width).toBeCloseTo(160, 0)
          expect(box?.x).toBeGreaterThanOrEqual((searchBox?.x ?? 0) + (searchBox?.width ?? 0))
        }
      }
    }
    if (path === '/') {
      if ((page.viewportSize()?.width ?? 0) < 768) {
        await expect(page.locator('.ls-workspace-header').getByRole('button', { name: '操作' })).toBeVisible()
      } else {
        const header = page.locator('.ls-workspace-header')
        await expect(header.getByRole('button', { name: '操作' })).toBeHidden()
        await expect(page.getByRole('link', { name: '消息', exact: true })).toHaveAttribute('href', 'http://demo.chat.lostsky.work:5176/')
        const typography = await header.locator('.ls-workspace-header__desktop a').evaluateAll(elements => elements.map(element => {
          const style = getComputedStyle(element)
          return `${style.fontFamily}|${style.fontSize}|${style.fontWeight}`
        }))
        expect(new Set(typography).size).toBe(1)
      }
      await expect(page.getByRole('link', { name: '进入消息' })).toHaveAttribute('href', 'http://demo.chat.lostsky.work:5176/')
      await expect(page.getByRole('link', { name: '使用文档' })).toHaveAttribute('href', '/docs')
      await expect(page.getByRole('link', { name: /实体 3/ })).toBeVisible()
      await expect(page.getByRole('link', { name: /成员 1/ })).toBeVisible()
      await expect(page.getByRole('link', { name: /文档 2/ })).toHaveAttribute('href', '/docs')
      await expect(page.getByRole('link', { name: /通知 1/ })).toHaveAttribute('href', '/notices/entity')
      const originalViewport = page.viewportSize()
      await page.setViewportSize({ width: 1000, height: 560 })
      const sidebarMenu = page.locator('.sidebar nav')
      await expect(page.getByRole('button', { name: '退出登录' })).toHaveCSS('justify-content', 'flex-start')
      const disabledAbility = page.locator('.sidebar .nav-disabled').filter({ hasText: '团队能力' })
      await expect(disabledAbility).toBeVisible()
      const disabledAbilityContent = disabledAbility.locator('.n-button__content')
      await expect(disabledAbilityContent).toHaveCSS('display', 'grid')
      expect(await disabledAbilityContent.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' '))).toHaveLength(3)
      expect(await disabledAbilityContent.locator(':scope > *').evaluateAll((elements) => (
        new Set(elements.map((element) => {
          const bounds = element.getBoundingClientRect()
          return Math.round(bounds.top + bounds.height / 2)
        })).size
      ))).toBe(1)
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
      const row = page.locator('.entity-row').filter({ hasText: '@alice' })
      if ((page.viewportSize()?.width ?? 0) < 640) {
        await row.getByRole('button', { name: '更多' }).click()
        await expect(page.getByText('对话', { exact: true }).last()).toBeVisible()
        await page.keyboard.press('Escape')
      } else {
        await expect(row.getByRole('button', { name: '对话' })).toBeVisible()
        expect(await row.locator('.ls-responsive-actions__desktop .n-button').evaluateAll(buttons => buttons.every((button) => {
          const style = getComputedStyle(button)
          return style.backgroundColor === 'rgba(0, 0, 0, 0)' && style.borderStyle === 'none'
        }))).toBe(true)
      }
    }
    if (path === '/members') {
      await expect(page.locator('.sidebar a[href="/members"]')).toContainText('成员')
      await expect(page.getByRole('search').getByRole('searchbox', { name: '搜索成员' })).toBeVisible()
      await expect(page.getByLabel('成员分类')).toBeVisible()
      await expect(page.locator('.member-list')).toBeVisible()
      const row = page.locator('.member-list article').filter({ hasText: '@alice' })
      await expect(row.locator('.ls-entity-identity__name-row .n-tag')).toContainText('正常')
      if ((page.viewportSize()?.width ?? 0) < 640) {
        await row.getByRole('button', { name: '更多' }).click()
        await expect(page.getByText('对话', { exact: true }).last()).toBeVisible()
        await page.keyboard.press('Escape')
      } else await expect(row.getByRole('button', { name: '对话' })).toBeVisible()
    }
    if (path === '/customers') {
      const customerSearch = page.getByRole('searchbox', { name: '搜索客户' })
      await customerSearch.fill('不存在的客户')
      const empty = page.locator('.ls-empty-state')
      await expect(empty).toContainText('没有匹配的客户')
      await expect(empty).toContainText('客户领取团队商店身份后会进入客户目录。')
      await customerSearch.fill('')
    }
    if (path === '/member-detail?id=1') {
      await expect(page.getByRole('link', { name: '发起对话' }))
        .toHaveAttribute('href', 'http://demo.chat.lostsky.work:5176/new?participant=alice')
    }
    if (path === '/join-review') {
      await expect(page.getByRole('link', { name: /青空成员/ })).toBeVisible()
      await expect(page.getByText('查看申请状态，选择一条申请进入独立审核页面。')).toBeVisible()
    }
    if (path === '/join-fields') {
      await expect(page.getByRole('link', { name: /相关经验/ })).toBeVisible()
      await expect(page.getByRole('link', { name: /作品说明/ })).toContainText('已停用')
      await expect(page.locator('.sidebar a[href="/join-fields"]')).toContainText('申请字段')
    }
    if (path === '/join-fields/new') {
      await expect(page.locator('#workspace').getByRole('heading', { name: '创建申请字段' })).toBeVisible()
      await expect(page.getByRole('switch', { name: '启用字段' })).toBeChecked()
    }
    if (path === '/join-fields/42') {
      await expect(page.locator('#workspace').getByRole('heading', { name: '编辑申请字段' })).toBeVisible()
      await expect(page.getByLabel('字段标识')).toHaveValue('portfolio')
      await expect(page.getByRole('switch', { name: '启用字段' })).not.toBeChecked()
    }
    if (path.startsWith('/join-review/review')) {
      await expect(page.getByText('审核任务')).toBeVisible()
      await expect(page.getByLabel('任务标题')).toHaveValue('确认协作约定')
      await expect(page.getByRole('checkbox', { name: '已完成' })).toBeVisible()
      await expect(page.getByRole('link', { name: '返回申请列表' })).toBeVisible()
    }
    if (path === '/roles/new') {
      await expect(page.locator('#workspace').getByRole('heading', { name: '新建角色', level: 1 })).toBeVisible()
      await expect(page.getByLabel('角色标识')).toBeVisible()
      await expect(page.getByLabel('角色名称')).toBeVisible()
    }
    if (path.startsWith('/chat-integration?')) {
      await expect(page.locator('#workspace').getByRole('heading', { name: '编辑 Webhook 集成', level: 1 })).toBeVisible()
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
      await expect(page.locator('#workspace').getByRole('heading', { name: '发送通知', level: 1 })).toBeVisible()
      await expect(page.getByText('通知只进入所选实体的收件箱，不支持回复、抄送或会话；发送方统一显示为当前 Team。')).toBeVisible()
      await expect(page.getByRole('tab', { name: '可视化' })).toBeVisible()
      await expect(page.getByRole('tab', { name: '源码' })).toBeVisible()
      await expect(page.getByRole('tab', { name: '预览' })).toBeVisible()
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
      await page.getByRole('tab', { name: '源码' }).click()
      await page.getByRole('textbox', { name: 'Markdown 源码' }).fill('## 行动\n\n- 保存工作\n- 回复确认')
      await page.getByRole('button', { name: '发送通知' }).click()
      await expect(page.getByRole('status')).toContainText('通知已发送给 测试客户')
      expect(noticeSendPayload).toMatchObject({ entity_id: 2, title: '客户专属通知', content: '## 行动\n\n- 保存工作\n- 回复确认', is_pinned: false })
    }
    if (path === '/doc-create') {
      await expect(page.locator('#workspace').getByRole('heading', { name: '新建文档', level: 1 })).toBeVisible()
      await expect(page.getByRole('tab', { name: '可视化' })).toBeVisible()
      await expect(page.getByRole('tab', { name: '源码' })).toBeVisible()
      await expect(page.getByRole('tab', { name: '预览' })).toBeVisible()
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
      const visibilitySelect = page.locator('.ls-field').filter({ hasText: '可见范围' }).locator('.n-select')
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
      await page.getByRole('tab', { name: '源码' }).click()
      await expect(page.locator('.ls-markdown-editor textarea')).toHaveValue(/\[@测试成员\]\(lostsky:\/\/entity\/alice\)/)
    }
    if (path === '/docs') {
      const documentSearch = page.getByRole('search').getByRole('searchbox', { name: '搜索文档' })
      await expect(documentSearch).toBeVisible()
      expect((await documentSearch.boundingBox())?.height).toBeCloseTo(
        (page.viewportSize()?.width ?? 0) < 640 ? 44 : 40,
        0,
      )
      await expect(page.getByLabel('文档分类')).toBeVisible()
      await expect(page.locator('.document-list')).toBeVisible()
    }
    if (path === '/files') {
      await expect(page.getByRole('search').getByRole('searchbox', { name: '搜索文件' })).toBeVisible()
      await expect(page.locator('.ls-empty-state')).toContainText('还没有文件')
      await expect(page.locator('.ls-empty-state .n-empty__icon')).toBeVisible()
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
      await expect(page.locator('.ls-page-header .member-primary-actions')).toContainText('保存成员')
    }
    if (path === '/settings') {
      await expect(page.getByRole('heading', { name: '对象搜索', level: 2 })).toBeVisible()
      await expect(page.getByRole('heading', { name: '聊天', level: 2 })).toBeVisible()
      await expect(page.getByRole('heading', { name: '商城', level: 2 })).toBeVisible()
      await expect(page.getByRole('heading', { name: '公开主页', level: 2 })).toBeVisible()
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
      await expect(page.getByRole('textbox', { name: '主页欢迎语' })).toHaveValue('欢迎来到我们的公开主页')
      await expect(page.getByRole('textbox', { name: '实体入口文案' })).toHaveValue('浏览公开实体')
      await expect(page.getByRole('textbox', { name: '实体区域标题' })).toHaveValue('公开实体')
      await expect(page.getByRole('textbox', { name: '实体区域说明' })).toHaveValue('团队成员与虚拟实体')
      const emptyCopy = page.getByRole('textbox', { name: '实体空状态文案' })
      await expect(emptyCopy).toHaveValue('团队暂时没有公开实体')
      await emptyCopy.fill('伙伴资料正在准备中')
      await page.getByRole('button', { name: '保存公开主页设置' }).click()
      await expect.poll(() => settingPayload).toEqual({
        app_name: 'display',
        settings: {
          homepage_welcome: '欢迎来到我们的公开主页',
          homepage_entities_link: '浏览公开实体',
          homepage_entities_title: '公开实体',
          homepage_entities_description: '团队成员与虚拟实体',
          homepage_entities_empty: '伙伴资料正在准备中',
        },
      })
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
      await expect(page.locator('.entity-card .ls-entity-identity__text small')).toHaveText('成员')
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
        await expect(page.locator('.entity-card .ls-entity-identity__text small')).toHaveText(entity.type)
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
  await expect(page.locator('.ls-empty-state')).toContainText('目前没有通知')

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

test('team join fields support management, validation and read-only permission downgrade', async ({ page }) => {
  let permissions = ['team.join_field.read', 'team.join_field.write']
  let indexRequests = 0
  let transferRequests = 0
  let editPayload: Record<string, unknown> | null = null
  const fields = [
    {
      id: 41,
      field_key: 'experience_level',
      name: '经验水平',
      value_type: 'select',
      input_type: 'select',
      options: [{ label: '有经验', value: 'yes' }, { label: '暂无经验', value: 'no' }],
      default_value: 'no',
      is_apply_fillable: 1,
      is_apply_required: 1,
      is_transfer_entity_field: 1,
      entity_field_id: 7,
      entity_field: { id: 7, field_key: 'member_experience', name: '成员经验', value_type: 'select', input_type: 'select' },
      is_active: 1,
      sort: 10,
    },
    {
      id: 42,
      field_key: 'portfolio',
      name: '作品说明',
      value_type: 'text',
      input_type: 'textarea',
      options: null,
      default_value: null,
      is_apply_fillable: 1,
      is_apply_required: 0,
      is_transfer_entity_field: 0,
      entity_field_id: null,
      entity_field: null,
      is_active: 0,
      sort: 20,
    },
  ]

  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async route => {
    const url = new URL(route.request().url())
    let data: unknown = null
    if (url.pathname.endsWith('/access')) data = { permissions, abilities: {} }
    else if (url.pathname.endsWith('/joinField/index')) { indexRequests++; data = fields }
    else if (url.pathname.endsWith('/joinField/transferOptions')) {
      transferRequests++
      data = [{ id: 7, field_key: 'member_experience', name: '成员经验', value_type: 'select', input_type: 'select', sort: 10 }]
    } else if (url.pathname.endsWith('/joinField/edit')) {
      editPayload = route.request().postDataJSON() as Record<string, unknown>
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  await page.goto('http://demo.team.lostsky.work:5175/join-fields')
  await expect(page.getByRole('link', { name: /经验水平/ })).toContainText('已启用')
  await expect(page.getByRole('link', { name: /作品说明/ })).toContainText('已停用')
  await page.getByRole('searchbox', { name: '搜索申请字段' }).fill('作品')
  await expect(page.getByRole('link', { name: /作品说明/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /经验水平/ })).toHaveCount(0)

  await page.goto('http://demo.team.lostsky.work:5175/join-fields/41')
  await expect(page.getByLabel('选项 1 显示名称')).toHaveValue('有经验')
  await expect(page.getByLabel('转存目标')).toContainText('成员经验')
  await page.getByLabel('选项 2 提交值').fill('yes')
  await page.getByRole('button', { name: '保存字段' }).click()
  await expect(page.getByText('选项的提交值不能重复。')).toBeVisible()
  expect(editPayload).toBeNull()

  await page.getByLabel('选项 2 提交值').fill('no')
  await page.getByRole('switch', { name: '启用字段' }).click()
  await page.getByRole('button', { name: '保存字段' }).click()
  await expect.poll(() => editPayload).toMatchObject({
    id: 41,
    is_active: 0,
    is_transfer_entity_field: 1,
    entity_field_id: 7,
    options: [{ label: '有经验', value: 'yes' }, { label: '暂无经验', value: 'no' }],
  })
  expect(editPayload).not.toHaveProperty('field_key')

  permissions = ['team.join_field.read']
  const transferRequestsBeforeReadOnly = transferRequests
  await page.goto('http://demo.team.lostsky.work:5175/join-fields/41')
  await expect(page.locator('#workspace').getByRole('heading', { name: '查看申请字段' })).toBeVisible()
  await expect(page.getByRole('button', { name: '保存字段' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '删除字段' })).toHaveCount(0)
  expect(transferRequests).toBe(transferRequestsBeforeReadOnly)

  permissions = []
  const indexRequestsBeforeDenied = indexRequests
  await page.goto('http://demo.team.lostsky.work:5175/join-fields')
  await expect(page.getByRole('alert')).toContainText('team.join_field.read')
  expect(indexRequests).toBe(indexRequestsBeforeDenied)
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
  await expect(page.locator('#workspace').getByRole('heading', { name: '新建文档', level: 1 })).toBeVisible()

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

test('member task hides unauthorized management controls', async ({ page }) => {
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
          status_code: 'active',
          status_label: '正常',
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
  let optionsMode: 'full' | 'missing' | 'empty' | 'error' = 'full'
  await page.route('http://demo.transaction.lostsky.work:5177/api/**', async (route) => {
    const url = new URL(route.request().url())
    const entity = { id: 11, entity_id: 11, entityable_type: 'teamMember', entityable_id: 1, type: 'member', slug: 'handler', name: 'Handler', profile: { nickname: 'Handler' }, nickname: '青空接单人', avatar: null, status_code: 'active', status_label: '正常' }
    const customer = { id: 8, nickname: '晚风客户', avatar: null, description: '长期客户', is_blocked: 0, balance: { balance: 880, recharged: 1200, spent: 320 } }
    const transaction = {
      id: 21, handler_entity_id: 11, sender_entity_id: null, cs_entity_id: null, customer_id: 8, type: 2,
      total_price: 320, cost: 80, cash: 200, prepaid: 120, handler_cut: 140, sender_cut: 0,
      cs_cut: 0, team_cut: 100, trans_at: 1784563200, memo: '七月陪玩服务',
      handler: entity, customer,
    }
    let data: unknown = null
    if (url.pathname.endsWith('/transaction/options')) {
      if (optionsMode === 'error') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 50300, message: '选项服务暂不可用', data: null }) })
        return
      }
      data = optionsMode === 'missing'
        ? {}
        : optionsMode === 'empty'
          ? { entities: [], customers: [] }
          : { entities: [entity], customers: [customer] }
    }
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
    await expect(page.locator('#workspace').getByRole('heading', { level: 1 }).first()).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow, `horizontal overflow at ${path}`).toBe(false)
    if (['/', '/bindings', '/balances'].includes(path)) await expect(page.locator('.ls-list-toolbar')).toBeVisible()
  }

  await page.goto('http://demo.transaction.lostsky.work:5177/')
  await expect(page.getByText('晚风客户', { exact: true })).toBeVisible()
  await expect(page.getByText('¥320.00', { exact: true })).toBeVisible()
  await page.goto('http://demo.transaction.lostsky.work:5177/new')
  await expect(page.getByText('金额平衡')).toBeVisible()
  await expect(page.getByRole('button', { name: '保存流水' })).toBeDisabled()
  optionsMode = 'missing'
  await page.goto('http://demo.transaction.lostsky.work:5177/new')
  await expect(page.getByText('当前响应未提供主体选项')).toBeVisible()
  await expect(page.getByText('当前响应未提供客户选项')).toBeVisible()
  await expect(page.getByRole('button', { name: '保存流水' })).toBeDisabled()
  optionsMode = 'empty'
  await page.goto('http://demo.transaction.lostsky.work:5177/new')
  await expect(page.getByText('金额平衡')).toBeVisible()
  await expect(page.getByRole('button', { name: '保存流水' })).toBeDisabled()
  optionsMode = 'error'
  await page.goto('http://demo.transaction.lostsky.work:5177/new')
  await expect(page.getByRole('alert')).toContainText('参与方选项暂时无法读取')
  await expect(page.getByText('金额平衡')).toBeVisible()
  await expect(page.getByRole('button', { name: '保存流水' })).toBeDisabled()
  optionsMode = 'full'
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 })
    await page.goto('http://demo.transaction.lostsky.work:5177/new')
    await expect(page.locator('#workspace')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `horizontal overflow at ${width}px`).toBe(false)
    if (width < 768) await expect(page.getByRole('button', { name: '操作' })).toBeVisible()
    else await expect(page.getByRole('link', { name: /登记流水/ }).last()).toBeVisible()
  }
  await page.goto('http://demo.transaction.lostsky.work:5177/stats')
  await expect(page.getByText('成交金额', { exact: true })).toBeVisible()
  await expect(page.getByText('青空接单人')).toBeVisible()
  expect(pageErrors).toEqual([])
})
