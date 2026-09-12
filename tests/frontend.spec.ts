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
        fields: [
          {
            key: 'founded',
            name: '成立年份',
            value_type: 'int',
            value: 2025,
          },
        ],
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
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 503,
            message: '人员目录暂时不可用',
            data: null,
          }),
        })
        return
      }
      const allEntities = [
        {
          slug: 'public-member',
          type: 'teamMember',
          name: '公开成员',
          avatar: null,
          description: '负责公开内容',
          roles: [{ name: '内容主理人', description: '维护公开资料' }],
        },
        {
          slug: 'public-bot',
          type: 'teamVirtual',
          name: '青空助手',
          avatar: null,
          description: '虚拟人员',
        },
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
      const matches = entityIndexMode === 'empty' ? [] : allEntities.filter((entity) => (!type || entity.type === type) && (!keyword || `${entity.name} ${entity.slug}`.toLocaleLowerCase().includes(keyword)))
      data = {
        total: matches.length,
        page: pageNumber,
        limit,
        list: matches.slice((pageNumber - 1) * limit, pageNumber * limit),
      }
    } else if (url.pathname.endsWith('/entity/get')) {
      if (url.searchParams.get('slug') === 'hidden') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 404,
            message: '人员不存在',
            data: null,
          }),
        })
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
        fields: [
          {
            key: 'available',
            name: '当前在线',
            value_type: 'bool',
            value: 1,
          },
        ],
        roles: [{ name: '内容主理人', description: '维护公开资料' }],
        products: [
          {
            id: 12,
            name: '夜航陪伴',
            description: '公开成员提供的专属服务',
            cover_image: null,
            price: '39.00',
            href: '//demo.shop.lostsky.work/product/12',
          },
        ],
      }
    } else if (url.pathname.endsWith('/entity/resolve')) {
      data = [
        {
          slug: 'public-member',
          type: 'teamMember',
          display_name: '公开成员',
          avatar: null,
          team: { slug: 'demo', display_name: '青空协作组' },
          available: true,
          href: '/entity/public-member',
        },
      ]
    } else if (url.pathname.endsWith('/document/index')) {
      if (url.searchParams.get('entity_slug') === 'hidden') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 404,
            message: '人员不存在',
            data: null,
          }),
        })
        return
      }
      const entitySlug = url.searchParams.get('entity_slug')
      data = {
        total: entitySlug ? 1 : 2,
        page: 1,
        limit: 20,
        list: entitySlug
          ? [
              {
                id: 9,
                title: '成员指南',
                tags: ['成员资料'],
                sort: 0,
                update_time: 1_753_660_800,
                entity: {
                  slug: entitySlug,
                  type: 'teamMember',
                  name: '公开成员',
                },
              },
            ]
          : [
              {
                id: 7,
                title: '团队公开指南',
                tags: ['指南', '精选'],
                sort: 0,
                update_time: 1_753_660_800,
                entity: { slug: 'demo', type: 'team', name: '青空协作组' },
              },
              {
                id: 8,
                title: '团队动态',
                tags: ['未配置标签'],
                sort: 1,
                update_time: 1_753_660_801,
                entity: { slug: 'demo', type: 'team', name: '青空协作组' },
              },
            ],
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
  await expect(page.getByRole('heading', { name: '公开人员', level: 1 })).toBeVisible()
  await expect(page.getByRole('searchbox', { name: '搜索人员名称或 Slug' })).toBeVisible()
  await expect(page.getByText('共 22 位公开人员')).toBeVisible()
  await expect(page.locator('.entity-list > a')).toHaveCount(20)
  await expect(page.getByText('第 1 / 2 页')).toBeVisible()
  await page.getByRole('button', { name: '下一页' }).click()
  await expect(page.getByText('第 2 / 2 页')).toBeVisible()
  await expect(page.locator('.entity-list > a')).toHaveCount(2)

  const directorySearch = page.getByRole('searchbox', {
    name: '搜索人员名称或 Slug',
  })
  await directorySearch.fill('PUBLIC-BOT')
  await expect(page.getByText('共 1 位公开人员')).toBeVisible()
  await expect(page.getByRole('link', { name: /青空助手/ })).toBeVisible()
  await page.getByRole('button', { name: '成员', exact: true }).click()
  await expect(page.getByText('没有符合条件的公开人员。')).toBeVisible()
  await directorySearch.fill('')
  await expect(page.getByText('共 21 位公开人员')).toBeVisible()
  await page.getByRole('button', { name: '全部', exact: true }).click()
  await expect(page.getByText('共 22 位公开人员')).toBeVisible()

  entityIndexMode = 'empty'
  await page.reload()
  await expect(page.getByText('团队暂时没有公开人员。')).toBeVisible()
  entityIndexMode = 'error'
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('人员列表加载失败')
  entityIndexMode = 'full'
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByText('共 22 位公开人员')).toBeVisible()

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

  await page
    .getByRole('link', { name: /公开成员/ })
    .first()
    .click()
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
  const documentTitleSize = Number.parseFloat(await page.getByRole('heading', { name: '团队公开指南', level: 1 }).evaluate((element) => getComputedStyle(element).fontSize))
  const markdownTitleSize = Number.parseFloat(await page.getByRole('heading', { name: '使用说明', level: 1 }).evaluate((element) => getComputedStyle(element).fontSize))
  expect(markdownTitleSize).toBeLessThan(documentTitleSize)

  await page.goto('http://demo.display.lostsky.work:5178/entity/hidden')
  await expect(page.getByRole('heading', { name: '该人员没有公开资料' })).toBeVisible()

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
      .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .slice(0, 8)
      .map((element) => ({
        tag: element.tagName,
        className: element.className,
        right: Math.round(element.getBoundingClientRect().right),
        width: Math.round(element.getBoundingClientRect().width),
      })),
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
    profile: { name: '晚风顾客', avatar: null, description: '熟悉青空服务' },
    identity: { slug: 'evening-sky' },
    balance: { balance: '100.00', recharged: '100.00', spent: '0.00' },
  }
  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: baseToken,
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
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
        kind: 2,
        handler_groups: [{ product_id: 91, name: '实体礼品', handlers: [
          { entity_id: 8, slug: 'guide', name: '礼品接单甲' },
          { entity_id: 9, slug: 'guide-b', name: '礼品接单乙' },
        ] }],
        inclusions: [
          { kind: 4, name: '专属陪伴', quantity: '3.0000', unit_name: '小时', quantity_step: '1.0000', valid_days: 30 },
          { kind: 4, name: '回访沟通', quantity: '1.0000', unit_name: '次', quantity_step: '1.0000', valid_days: 0 },
          { kind: 1, name: '实体礼品', quantity: '2', unit_name: '件' },
          { kind: 3, name: '礼赠卡密', quantity: '1', unit_name: '张' },
        ],
        benefit_package: {
          name: '青空陪伴权益包',
          services: [
            {
              id: 7,
              name: '专属陪伴',
              description: '一对一完成本次陪伴服务。',
              quantity: '3.0000',
              unit_name: '小时',
              quantity_step: '1.0000',
              valid_days: 30,
            },
            {
              id: 8,
              name: '回访沟通',
              description: null,
              quantity: '1.0000',
              unit_name: '次',
              quantity_step: '1.0000',
              valid_days: 0,
            },
          ],
        },
      }
    } else if (url.pathname.endsWith('/storefront/products')) {
      data = {
        total: 1,
        page: 1,
        limit: 24,
        list: [
          {
            id: 1,
            name: '青空陪伴计划',
            description: '一段被认真准备的体验。',
            cover_image: null,
            price: '30.00',
          },
        ],
      }
    } else if (url.pathname.endsWith('/customer/bind')) {
      data = {
        token: customerToken,
        identity: { type: 'teamCustomer', id: 31 },
        customer: { id: 31 },
        created: true,
      }
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
      data = {
        balance: cancelled ? '100.00' : '100.00',
        recharged: '100.00',
        spent: cancelled ? '0.00' : '0.00',
      }
    } else if (url.pathname.endsWith('/customer/orders/44/cancel')) {
      cancelled = true
      data = null
    } else if (url.pathname.endsWith('/customer/orders/44')) {
      data = {
        id: 44,
        product_id: 1,
        product_name: '青空陪伴计划',
        product_cover_image: null,
        quantity: 1,
        unit_price: '30.00',
        total_price: '30.00',
        prepaid: '30.00',
        status: cancelled ? 3 : 1,
        memo: null,
        create_time: 1_753_660_800,
      }
    } else if (url.pathname.endsWith('/customer/orders') && request.method() === 'POST') {
      purchasePayload = request.postDataJSON()
      data = { id: 44 }
    } else if (url.pathname.endsWith('/customer/orders')) {
      data = { total: 0, page: 1, limit: 20, list: [] }
    } else {
      data = null
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.shop.lostsky.work:5179/')
  await expect(page.getByRole('heading', { name: '青空选物', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: '青空陪伴计划' })).toBeVisible()
  await expect(page.locator('.shop-markdown script')).toHaveCount(0)
  expect(await page.evaluate(() => (window as typeof window & { __shopXss?: number }).__shopXss)).toBeUndefined()

  await page.goto('http://demo.shop.lostsky.work:5179/product/1')
  await expect(page.getByRole('heading', { name: '商品内容', level: 2 })).toBeVisible()
  await expect(page.getByText('普通商品 · 无需核销', { exact: true })).toBeVisible()
  await expect(page.getByText('卡密 · 另行兑换', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '专属陪伴', level: 3 })).toBeVisible()
  await expect(page.getByText('3 小时')).toBeVisible()
  await expect(page.getByText('领取后 30 天')).toBeVisible()
  await expect(page.getByText('长期有效')).toBeVisible()

  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: '跳到主要内容' })).toBeFocused()

  await page.goto('http://demo.shop.lostsky.work:5179/product/1/checkout')
  await expect(page).toHaveURL(/\/customer\/bind/)
  await expect(page.getByRole('heading', { name: '在 青空选物 建立顾客账户' })).toBeVisible()
  await page.getByRole('button', { name: '建立账户并继续' }).click()
  await expect(page).toHaveURL(/\/product\/1\/checkout$/)
  await expect(page.getByText('当前余额')).toBeVisible()
  await expect(page.getByRole('button', { name: '使用余额购买' })).toBeDisabled()
  await page.locator('label').filter({ hasText: '实体礼品接单人' }).locator('.n-base-selection').click()
  await page.getByText('礼品接单乙', { exact: true }).click()
  await page.getByRole('button', { name: '使用余额购买' }).click()
  expect(purchasePayload).toEqual({ product_id: 1, quantity: 1, product_handlers: { '91': 9 } })
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
  await expect(page).toHaveURL('http://demo.shop.lostsky.work:5179/customer/profile')
  await expect(page.getByRole('heading', { name: '我的资料', level: 1 })).toBeVisible()
})

test('shop customer profile deep link stays in the Shop customer center', async ({ page }) => {
  const customerToken = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamCustomer', id: 31 } })).toString('base64url')}.x`
  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: customerToken,
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
  let meCalls = 0
  let uploadCalls = 0
  await page.route('http://demo.shop.lostsky.work:5179/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/storefront')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          message: 'ok',
          data: { slug: 'demo', profile: { name: '青空选物' } },
        }),
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
            profile: { name: '深链接顾客', avatar: null, description: null },
            identity: { slug: 'deep-link' },
            balance: null,
          },
        }),
      })
      return
    }
    if (path.endsWith('/customer/upload')) {
      uploadCalls++
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          message: 'ok',
          data: {
            id: 8,
            url: '/uploads/avatar.png',
            path: 'uploads/avatar.png',
          },
        }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data: null }),
    })
  })

  await page.goto('http://demo.shop.lostsky.work:5179/customer/profile')
  await expect(page).toHaveURL('http://demo.shop.lostsky.work:5179/customer/profile')
  await expect(page.getByRole('heading', { name: '我的资料', level: 1 })).toBeVisible()
  await expect(page.getByLabel('团队内昵称')).toHaveValue('深链接顾客')
  await expect(page.getByRole('button', { name: '上传头像' })).toBeVisible()
  await page.locator('.ls-media-upload-field input[type="file"]').setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: Buffer.from('avatar'),
  })
  await expect(page.locator('.ls-media-upload-field .n-input input')).toHaveValue('/uploads/avatar.png')
  expect(meCalls).toBeGreaterThan(0)
  expect(uploadCalls).toBe(1)
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

test('team entity detail atomically saves one visibility group for supported entities', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  let displayed = false
  let internalVisible = true
  let entityType = 'teamMember'
  let visibilityPayload: unknown = null
  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: 'e2e-token',
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = []
    if (path.endsWith('/entity/get')) {
      data = {
        id: 1,
        slug: 'alice',
        entityable_type: entityType,
        is_displayed: displayed ? 1 : 0,
        is_internal_visible: internalVisible ? 1 : 0,
        capabilities: { read_all: true, manage_profile: true },
        profile: {
          name: '测试成员',
          avatar: '',
          description: '公开资料',
          document_tags: [{ tag: '精选', description: '优先阅读' }],
        },
      }
    } else if (path.endsWith('/entity/presentation')) {
      visibilityPayload = route.request().postDataJSON()
      displayed = Boolean((visibilityPayload as any).is_displayed)
      internalVisible = Boolean((visibilityPayload as any).is_internal_visible)
      data = {
        is_displayed: displayed ? 1 : 0,
        is_internal_visible: internalVisible ? 1 : 0,
      }
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.team.lostsky.work:5175/entity?id=1')
  await expect(page.getByRole('heading', { name: '公开主页展示' }), `entity detail did not render; ${errors.join(' | ')}`).toBeVisible()
  await expect(page.getByRole('heading', { name: '可见性设置' })).toHaveCount(1)
  await expect(page.getByRole('button', { name: /^保存/ })).toHaveCount(2)
  for (const label of ['头像', '介绍图片', '介绍视频']) {
    await expect(page.getByLabel(label, { exact: true })).toBeVisible()
  }
  const uploadButtonBoxes = await Promise.all([page.getByRole('button', { name: '上传头像' }).boundingBox(), page.getByRole('button', { name: '上传介绍图片' }).boundingBox(), page.getByRole('button', { name: '上传介绍视频' }).boundingBox()])
  if ((page.viewportSize()?.width ?? 0) < 640) {
    for (const box of uploadButtonBoxes) expect(box?.width).toBeGreaterThan(160)
  } else {
    expect(new Set(uploadButtonBoxes.map((box) => Math.round(box?.width ?? -1))).size).toBe(1)
    expect(uploadButtonBoxes[0]?.width).toBeLessThanOrEqual(140)
  }
  const mediaFields = page.locator('.entity-profile-fields > .ls-field')
  const [avatarField, introImageField, introVideoField] = await Promise.all([mediaFields.nth(1).boundingBox(), mediaFields.nth(3).boundingBox(), mediaFields.nth(4).boundingBox()])
  expect(Math.round(avatarField?.x ?? -1)).toBe(Math.round(introImageField?.x ?? -2))
  expect(Math.round(introImageField?.x ?? -1)).toBe(Math.round(introVideoField?.x ?? -2))
  expect(Math.round(avatarField?.width ?? -1)).toBe(Math.round(introImageField?.width ?? -2))
  expect(Math.round(introImageField?.width ?? -1)).toBe(Math.round(introVideoField?.width ?? -2))
  expect((introImageField?.y ?? 0) + (introImageField?.height ?? 0)).toBeLessThanOrEqual(introVideoField?.y ?? -1)
  await expect(page.getByRole('link', { name: '发起对话' })).toHaveAttribute('href', 'http://demo.chat.lostsky.work:5176/new?participant=alice')
  const displaySwitch = page.getByRole('switch', { name: '公开主页展示' })
  const internalSwitch = page.getByRole('switch', { name: '团队内可见' })
  await expect(displaySwitch).toHaveText('')
  await expect(internalSwitch).toHaveText('')
  await expect(displaySwitch).not.toBeChecked()
  await expect(page.getByRole('button', { name: '保存可见性' })).toBeDisabled()
  await displaySwitch.click()
  await internalSwitch.click()
  await page.getByRole('button', { name: '保存可见性' }).click()
  await expect(page.locator('.n-message').filter({ hasText: '可见性设置已保存' })).toBeVisible()
  expect(visibilityPayload).toEqual({
    entity_id: 1,
    is_internal_visible: 0,
    is_displayed: 1,
  })

  entityType = 'teamCustomer'
  await page.goto('http://demo.team.lostsky.work:5175/entity?id=2')
  await expect(page.getByText('Customer 属于敏感目录，始终需要 team.entity.read 才能查看。')).toHaveCount(0)
  const customerInternalSwitch = page.getByRole('switch', { name: '团队内可见' })
  const customerPublicSwitch = page.getByRole('switch', { name: '公开主页展示' })
  await expect(customerInternalSwitch).toHaveAttribute('aria-disabled', 'true')
  await expect(customerPublicSwitch).toHaveAttribute('aria-disabled', 'true')
  await expect(customerInternalSwitch).not.toHaveAttribute('title')
  await expect(customerPublicSwitch).not.toHaveAttribute('title')
  await customerInternalSwitch.click({ force: true })
  await expect(page.locator('.n-message').filter({ hasText: 'team.entity.read' })).toBeVisible()
  await customerPublicSwitch.click({ force: true })
  await expect(page.locator('.n-message').filter({ hasText: '不支持互联网公开主页' })).toBeVisible()
  await expect(page.getByRole('button', { name: '保存可见性' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '公开文档分组' })).toHaveCount(0)
})

test('team document and entity tag editors validate, reorder and preserve API order', async ({ page }, testInfo) => {
  test.setTimeout(120_000)
  let documentPayload: Record<string, unknown> | null = null
  let profilePayload: Record<string, unknown> | null = null
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: 'e2e-token',
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    let data: unknown = []
    if (path.endsWith('/access')) {
      data = {
        permissions: ['team.document.read', 'team.entity.profile.manage'],
        abilities: {
          file: {
            enabled: true,
            level: 1,
            expire_time: 0,
            reason: null,
            label: '文件上传',
          },
          doc: {
            enabled: true,
            level: 1,
            expire_time: 0,
            reason: null,
            label: '文档',
          },
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
  const documentTagValues = () => documentTags.evaluateAll((elements) => elements.map((element) => (element as HTMLInputElement).value))
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
  const addDisplayTag = page.getByRole('button', { name: '添加展示标签' })
  const saveProfile = page.getByRole('button', { name: '保存资料' })
  const [addDisplayTagBox, saveProfileBox] = await Promise.all([addDisplayTag.boundingBox(), saveProfile.boundingBox()])
  if (testInfo.project.name.includes('mobile')) {
    expect(addDisplayTagBox?.width).toBeGreaterThan(160)
    expect(Math.round(addDisplayTagBox?.width ?? -1)).toBe(Math.round(saveProfileBox?.width ?? -2))
    expect(Math.round(addDisplayTagBox?.x ?? -1)).toBe(Math.round(saveProfileBox?.x ?? -2))
  } else {
    expect(addDisplayTagBox?.width).toBeGreaterThanOrEqual(112)
    expect(saveProfileBox?.width).toBeGreaterThanOrEqual(112)
    expect(addDisplayTagBox?.width).toBeLessThanOrEqual(160)
    expect(saveProfileBox?.width).toBeLessThanOrEqual(160)
  }
  const firstGroupInputs = groupRows.nth(0).locator('input')
  await expect(firstGroupInputs.nth(0)).toHaveValue('精选')
  await expect(firstGroupInputs.nth(1)).toHaveValue('优先阅读')
  const [tagBox, descriptionBox] = await Promise.all([firstGroupInputs.nth(0).boundingBox(), firstGroupInputs.nth(1).boundingBox()])
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
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), 'tag editor overflow at 200% text').toBe(false)
  const actionTarget = await page.getByRole('button', { name: '删除展示标签 1' }).boundingBox()
  expect(actionTarget?.width).toBeGreaterThanOrEqual(44)
  expect(actionTarget?.height).toBeGreaterThanOrEqual(44)
})

test('team keeps level 0 upload capacity while explaining read-only permissions', async ({ page }, testInfo) => {
  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: 'e2e-token',
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = []
    if (path.endsWith('/access')) {
      data = {
        permissions: ['file.read'],
        abilities: {
          file: {
            enabled: true,
            level: 0,
            expire_time: 0,
            reason: null,
            label: '文件上传',
          },
          doc: {
            enabled: true,
            level: 1,
            expire_time: 0,
            reason: null,
            label: '文档',
          },
        },
        file_upload: {
          count: 0,
          total_size: 0,
          size_limit: 134217728,
          remaining_size: 134217728,
          available: true,
          reason: null,
        },
      }
    } else if (path.endsWith('/dashboard')) {
      data = {
        entities: { available: true, count: null, error: null, reason: null },
        members: { available: true, count: null, error: null, reason: null },
        documents: {
          available: true,
          count: null,
          error: null,
          reason: null,
        },
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
      data = {
        count: 0,
        total_size: 0,
        size_limit: 134217728,
        remaining_size: 134217728,
        available: true,
        reason: null,
      }
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
  const teamSummary = page.getByLabel('团队资源摘要')
  await expect(teamSummary.getByText('人员', { exact: true })).toBeVisible()
  await expect(teamSummary.getByText('成员', { exact: true })).toBeVisible()
  await expect(teamSummary.getByText('文档', { exact: true })).toBeVisible()

  await page.goto('http://demo.team.lostsky.work:5175/entity?id=2')
  await expect(page.getByText(/当前为只读模式。/)).toHaveCount(0)
  const disabledSaveProfile = page.getByRole('button', { name: '保存资料' })
  const disabledAddDisplayTag = page.getByRole('button', {
    name: '添加展示标签',
  })
  await expect(disabledSaveProfile).toBeDisabled()
  await disabledSaveProfile.click({ force: true })
  await expect(page.locator('.n-message').filter({ hasText: 'team.entity.profile.manage' })).toBeVisible()
  await expect(disabledAddDisplayTag).toBeDisabled()
  await expect(page.getByRole('button', { name: '删除展示标签 1' })).toBeDisabled()
  const [disabledSaveProfileBox, disabledAddDisplayTagBox] = await Promise.all([disabledSaveProfile.boundingBox(), disabledAddDisplayTag.boundingBox()])
  if (testInfo.project.name.includes('mobile')) {
    expect(disabledAddDisplayTagBox?.width).toBeGreaterThan(160)
    expect(Math.round(disabledAddDisplayTagBox?.width ?? -1)).toBe(Math.round(disabledSaveProfileBox?.width ?? -2))
  } else {
    expect(disabledAddDisplayTagBox?.width).toBeGreaterThanOrEqual(112)
    expect(disabledSaveProfileBox?.width).toBeGreaterThanOrEqual(112)
    expect(disabledAddDisplayTagBox?.width).toBeLessThanOrEqual(160)
    expect(disabledSaveProfileBox?.width).toBeLessThanOrEqual(160)
  }

  await page.goto('http://demo.team.lostsky.work:5175/files')
  const uploadButton = page.getByRole('button', { name: '上传文件' })
  await expect(uploadButton).toBeDisabled()
  await expect(page.locator('.ls-upload-field__reason')).toHaveCount(0)
  await expect(page.getByText('您缺少该团队权限（Permission）: file.upload,请联系团队管理员开通。', { exact: true })).toHaveCount(0)
  await uploadButton.click({ force: true })
  await expect(page.getByText('您缺少该团队权限（Permission）: file.upload,请联系团队管理员开通。', { exact: true })).toBeVisible()
})

test('team disables uploads by byte capacity and offers upgrades only to ability managers', async ({ page }) => {
  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: 'e2e-token',
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
  const quota = {
    count: 240,
    total_size: 524_288_000,
    size_limit: 524_288_000,
    remaining_size: 0,
    available: false,
    reason: 'quota',
  }
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/access')
      ? {
          permissions: ['file.read', 'file.upload', 'team.ability.redeem'],
          abilities: {
            file: {
              enabled: true,
              level: 1,
              expire_time: 0,
              reason: null,
              label: '文件上传',
            },
          },
          file_upload: quota,
        }
      : path.endsWith('/file/usage')
        ? quota
        : path.endsWith('/file/index')
          ? { list: [], total: 0 }
          : []
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.team.lostsky.work:5175/files')
  const uploadButton = page.getByRole('button', { name: '上传文件' })
  await expect(uploadButton).toBeDisabled()
  await expect(page.getByText('已使用 500.0 MB / 容量 500.0 MB · 240 个文件')).toBeVisible()
  await expect(page.getByRole('link', { name: '升级团队能力' })).toHaveAttribute('href', '/abilities')
  await uploadButton.click({ force: true })
  await expect(page.getByText('该团队文件已达到上限，请联系团队管理员。', { exact: true })).toBeVisible()
})

test('account login remains usable at mobile and desktop widths', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('http://account.lostsky.work:5174/login')
  await expect(page.getByRole('heading', { name: '欢迎回来' }), `login did not render; ${errors.join(' | ')}`).toBeVisible()
  await expect(page.getByLabel('手机号码')).toBeVisible()
  await expect(page.getByLabel('短信验证码')).toBeVisible()
  await expect(page.getByRole('button', { name: '获取验证码' })).toBeVisible()
  const modeTabs = page.getByRole('tab')
  await expect(modeTabs).toHaveCount(2)
  const [smsTabBox, passwordTabBox] = await Promise.all([modeTabs.nth(0).boundingBox(), modeTabs.nth(1).boundingBox()])
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
      body: JSON.stringify({
        code: 0,
        message: 'ok',
        data: { token: 'e2e-token' },
      }),
    })
  })
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: 'ok',
        data: {
          id: 11,
          title: '回跳验证文档',
          content: '登录后应返回当前文档。',
          entity_id: 1,
          manager_scope: 1,
          visibility: 1,
          sort: 0,
        },
      }),
    })
  })

  await page.goto(originalUrl)
  await expect(page).toHaveURL((url) => url.origin === 'http://account.lostsky.work:5174' && url.pathname === '/login' && url.searchParams.get('redirect') === originalUrl)

  await page.getByText('密码登录', { exact: true }).click()
  await page.getByLabel('手机号 / 用户名 / 邮箱').fill('13800138000')
  await page.getByRole('textbox', { name: '密码', exact: true }).fill('test-password')
  await page.getByRole('button', { name: '密码登录' }).click()

  await expect(page).toHaveURL(originalUrl)
  await expect(page.getByRole('heading', { name: '回跳验证文档', level: 1 })).toBeVisible()
})

test('authenticated account visits honor a LostSky development redirect', async ({ page }) => {
  const originalUrl = 'http://demo.team.lostsky.work:5175/doc?id=11'
  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: 'e2e-token',
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: 'ok',
        data: {
          id: 11,
          title: '已登录回跳文档',
          content: '登录页应直接返回原页面。',
          entity_id: 1,
          manager_scope: 1,
          visibility: 1,
          sort: 0,
        },
      }),
    })
  })

  await page.goto(`http://account.lostsky.work:5174/login?redirect=${encodeURIComponent(originalUrl)}`)

  await expect(page).toHaveURL(originalUrl)
  await expect(page.getByRole('heading', { name: '已登录回跳文档', level: 1 })).toBeVisible()
})

test('team document reader unwraps the API list response and keeps a readable responsive surface', async ({ page }) => {
  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: 'e2e-token',
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/access')
      ? {
          permissions: ['team.document.read'],
          abilities: {
            doc: {
              enabled: true,
              level: 1,
              expire_time: 0,
              reason: null,
              label: '文档',
            },
          },
        }
      : path.endsWith('/doc/get')
        ? {
            total: 1,
            list: [
              {
                id: 150,
                title: '黄金款服务手册',
                content: '## 服务流程\n\n这是已经保存的正文内容。',
                entity_id: 1,
                visibility: '团队管理可见',
                update_time: '2026-07-30 07:14:09',
                subject: { id: 1, name: '演示团队', slug: 'demo' },
              },
            ],
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
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: 'e2e-token',
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/access')
      ? { permissions: ['team.customer.read'], abilities: {} }
      : path.endsWith('/customer/518')
        ? {
            id: 518,
            slug: 'broken-customer',
            name: '响应不完整的顾客',
            can_manage: false,
          }
        : []
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.team.lostsky.work:5175/customers/518')

  const errorState = page.locator('.ls-async-state')
  await expect(errorState).toContainText('暂时无法读取顾客详情')
  await expect(errorState).toContainText('顾客详情数据不完整，请刷新后重试')
  expect(pageErrors).toEqual([])
})

test('team customer detail reuses typed entity options for assignment and sender collaboration', async ({ page }, testInfo) => {
  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: 'e2e-token',
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
  let customerUpdatePayload: Record<string, unknown> | null = null
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (route.request().method() === 'POST' && path.endsWith('/customer/518')) {
      customerUpdatePayload = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          message: '顾客资料已更新',
          data: null,
        }),
      })
      return
    }
    const data = path.endsWith('/access')
      ? { permissions: ['team.customer.manage'], abilities: {} }
      : path.endsWith('/customer/assignees')
        ? [
            { entity_id: 1, slug: 'demo', type: 'team', name: 'test团队' },
            {
              entity_id: 2,
              slug: 'member-1',
              type: 'teamMember',
              name: '测试的所有者',
            },
            {
              entity_id: 3,
              slug: 'member-2',
              type: 'teamMember',
              name: 'member-2',
            },
            { entity_id: 4, slug: 'virtual', type: 'teamVirtual', name: '1' },
          ]
        : path.endsWith('/customer/518')
          ? {
              id: 518,
              slug: 'customer-518',
              name: '测试顾客',
              avatar: null,
              description: null,
              is_blocked: false,
              create_time: 1_782_633_600,
              balance: { balance: '0.00', recharged: '0.00', spent: '0.00' },
              assignee: null,
              senders: [
                {
                  entity_id: 3,
                  slug: 'member-2',
                  type: 'teamMember',
                  name: 'member-2',
                },
              ],
              summary: {
                transaction_count: 0,
                transaction_total: '0.00',
                order_count: 0,
                order_total: '0.00',
              },
              can_manage: true,
            }
          : []
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.team.lostsky.work:5175/customers/518')
  const saveCustomerProfile = page.getByRole('button', {
    name: '保存顾客资料',
  })
  await expect(saveCustomerProfile).toBeVisible()
  const saveCustomerProfileBox = await saveCustomerProfile.boundingBox()
  if (testInfo.project.name.includes('mobile')) expect(saveCustomerProfileBox?.width).toBeGreaterThan(160)
  else {
    expect(saveCustomerProfileBox?.width).toBeGreaterThanOrEqual(112)
    expect(saveCustomerProfileBox?.width).toBeLessThanOrEqual(180)
  }
  await page.locator('#customer-assignee').click()

  const options = page.locator('.ls-entity-select-menu .ls-entity-select-option')
  await expect(options).toHaveCount(4)
  await expect(options.nth(0)).toContainText('test团队')
  await expect(options.nth(0)).toContainText('团队')
  await expect(options.nth(0)).toContainText('@demo')
  await expect(options.nth(1)).toContainText('成员')
  await expect(options.nth(3)).toContainText('虚拟人员')
  await page.keyboard.press('Escape')

  await page.locator('#customer-senders').click()
  await expect(page.locator('#customer-senders')).toContainText('member-2')
  await page.locator('.ls-entity-select-menu:visible .ls-entity-select-option').nth(3).click()
  await saveCustomerProfile.click()
  await expect.poll(() => customerUpdatePayload).not.toBeNull()
  expect(customerUpdatePayload).toMatchObject({ sender_entity_ids: [3, 4] })
})

test('team workspace routes remain responsive with the API boundary mocked', async ({ page }) => {
  test.setTimeout(240_000)
  const pageErrors: string[] = []
  let emptyNotices = false
  let noticeConfirmRequests = 0
  let noticeSendPayload: Record<string, unknown> | null = null
  let settingPayload: Record<string, unknown> | null = null
  let accessPermissions = ['team.entity.read', 'team.entity.profile.manage', 'team.document.read', 'team.customer.read', 'team.member.read', 'team.member.invite', 'team.member.update', 'team.member.remove', 'team.entity.field.manage', 'team.entity.virtual.*.manage', 'team.role.read', 'team.role.write', 'team.join_field.read', 'team.join_field.write', 'team.join_review.read', 'team.notice.read', 'team.notice.send', 'team.setting.read', 'file.read', 'file.upload', 'file.delete']
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(message.text())
  })
  page.on('requestfailed', (request) => pageErrors.push(`${request.url()}: ${request.failure()?.errorText}`))
  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: 'e2e-token',
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const url = new URL(route.request().url())
    let data: unknown = []
    if (url.pathname.endsWith('/notice/get') && url.searchParams.get('id') === '404') {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 404,
          message: '通知不存在',
          data: null,
        }),
      })
      return
    }
    if (url.pathname.endsWith('/access'))
      data = {
        permissions: accessPermissions,
        abilities: {
          file: {
            enabled: true,
            level: 1,
            expire_time: 0,
            reason: null,
            label: '文件上传',
          },
          doc: {
            enabled: true,
            level: 1,
            expire_time: 0,
            reason: null,
            label: '文档',
          },
        },
        file_upload: {
          count: 6,
          total_size: 17_825_792,
          size_limit: 524_288_000,
          remaining_size: 506_462_208,
          available: true,
          reason: null,
        },
      }
    else if (url.pathname.endsWith('/dashboard'))
      data = {
        entities: { available: true, count: 3, error: null, reason: null },
        members: { available: true, count: 1, error: null, reason: null },
        documents: { available: true, count: 2, error: null, reason: null },
        notices: { available: true, count: 1, error: null, reason: null },
      }
    else if (url.pathname.endsWith('/entity/index'))
      data = {
        list: [
          { id: 1, slug: 'demo', entityable_type: 'team' },
          { id: 2, slug: 'alice', entityable_type: 'teamMember' },
          { id: 3, slug: 'helper', entityable_type: 'teamVirtual' },
        ],
        total: 3,
      }
    else if (url.pathname.endsWith('/file/usage'))
      data = {
        count: 6,
        total_size: 17_825_792,
        size_limit: 524_288_000,
        remaining_size: 506_462_208,
        available: true,
        reason: null,
      }
    else if (url.pathname.endsWith('/joinReview/index'))
      data = {
        list: [{ id: 1, user_id: 6, status: '审核中', name: '青空成员' }],
        total: 1,
      }
    else if (url.pathname.endsWith('/joinReview/get'))
      data = {
        id: 1,
        user_id: 6,
        status: '审核中',
        memo: '希望参与工作室协作',
        values: [],
        tasks: [
          {
            id: 8,
            title: '确认协作约定',
            description: '阅读并确认团队协作方式',
            is_passed: 0,
          },
        ],
      }
    else if (url.pathname.endsWith('/joinField/index'))
      data = [
        {
          id: 41,
          field_key: 'experience',
          name: '相关经验',
          value_type: 'string',
          input_type: 'text',
          options: null,
          default_value: null,
          is_apply_fillable: 1,
          is_apply_required: 1,
          is_transfer_entity_field: 1,
          entity_field_id: 7,
          entity_field: {
            id: 7,
            field_key: 'member_experience',
            name: '成员经验',
            value_type: 'string',
            input_type: 'text',
          },
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
    else if (url.pathname.endsWith('/joinField/transferOptions'))
      data = [
        {
          id: 7,
          field_key: 'member_experience',
          name: '成员经验',
          value_type: 'string',
          input_type: 'text',
          sort: 10,
        },
      ]
    else if (url.pathname.endsWith('/doc/get'))
      data = {
        id: 11,
        title: '第一份文档',
        content: '欢迎 [@测试成员](lostsky://entity/alice)\n\n关联 [@测试团队](lostsky://entity/demo)、[@协作助手](lostsky://entity/helper) 和 [@测试顾客](lostsky://entity/customer-1)。\n\n<script>window.__lostskyXss = 1</script>',
        entity_id: 1,
        manager_scope: 1,
        visibility: 1,
        sort: 0,
      }
    else if (url.pathname.endsWith('/doc'))
      data = {
        list: [
          { id: 11, title: '第一份文档', content: '', visibility: 1 },
          {
            id: 12,
            title: '第二份文档',
            content: '这是一段长度不同的摘要，用来验证文档卡片底栏仍然共用同一条基线。',
            visibility: 1,
          },
        ],
        total: 2,
      }
    else if (url.pathname.endsWith('/member/get'))
      data = {
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
    else if (url.pathname.endsWith('/member/index'))
      data = [
        {
          id: 1,
          user_id: 1,
          nickname: '测试成员',
          slug: 'alice',
          status_code: 'active',
          status_label: '正常',
        },
      ]
    else if (url.pathname.endsWith('/customer/assignees'))
      data = [
        {
          entity_id: 2,
          slug: 'alice',
          type: 'teamMember',
          name: '测试成员',
          avatar: null,
        },
      ]
    else if (url.pathname.endsWith('/customer')) {
      const list = url.searchParams.get('keyword')
        ? []
        : [
            {
              id: 8,
              slug: 'customer-1',
              name: '测试顾客',
              avatar: null,
              description: '长期顾客',
              is_blocked: false,
              create_time: 1_782_633_600,
              balance: { balance: '880', recharged: '1200', spent: '320' },
              assignee: null,
            },
          ]
      data = { list, total: list.length, page: 1, limit: 20, scope: 'all' }
    } else if (url.pathname.endsWith('/postType/index')) data = []
    else if (url.pathname.endsWith('/chatVirtual/get'))
      data = {
        slug: 'sales-assistant',
        name: '销售助手',
        avatar: null,
        description: '负责接收销售咨询',
        is_active: 1,
        integrations: [
          {
            id: 1,
            name: 'CRM 工作流',
            endpoint_url: 'https://example.com/lostsky/events',
            events: ['message.created'],
            is_active: 1,
          },
        ],
      }
    else if (url.pathname.endsWith('/entity/options'))
      data = [
        {
          id: 1,
          entity_id: 1,
          type: 'team',
          slug: 'demo',
          name: '测试团队',
          avatar: null,
        },
        {
          id: 2,
          entity_id: 2,
          type: 'teamCustomer',
          slug: 'customer-1',
          name: '测试顾客',
          avatar: null,
        },
        {
          id: 3,
          entity_id: 3,
          type: 'teamMember',
          slug: 'member-1',
          name: '测试成员',
          avatar: null,
        },
        {
          id: 4,
          entity_id: 4,
          type: 'teamVirtual',
          slug: 'helper',
          name: '协作助手',
          avatar: null,
        },
      ]
    else if (url.pathname.endsWith('/entity/search'))
      data = [
        {
          slug: 'alice',
          type: 'teamMember',
          display_name: '测试成员',
          available: true,
          team: { slug: 'demo', display_name: '测试团队' },
        },
      ]
    else if (url.pathname.endsWith('/entity/resolve'))
      data = [
        {
          slug: 'alice',
          type: 'teamMember',
          display_name: '测试成员',
          available: true,
          team: { slug: 'demo', display_name: '测试团队' },
          href: '/member-detail?id=1',
        },
        {
          slug: 'demo',
          type: 'team',
          display_name: '测试团队',
          available: true,
          team: null,
          href: '/',
        },
        {
          slug: 'helper',
          type: 'teamVirtual',
          display_name: '协作助手',
          available: true,
          team: { slug: 'demo', display_name: '测试团队' },
          href: null,
        },
        {
          slug: 'customer-1',
          type: 'teamCustomer',
          display_name: '测试顾客',
          available: true,
          team: { slug: 'demo', display_name: '测试团队' },
          href: null,
        },
      ]
    else if (url.pathname.endsWith('/notice/get'))
      data = {
        id: 21,
        title: '维护窗口提醒',
        content: '## 维护安排\n\n请提前保存正在处理的内容。\n\n- 保存草稿\n- 回复确认\n\n<script>window.__noticeXss = 1</script>',
        is_pinned: 1,
        is_read: 0,
        create_time: 1752883200,
      }
    else if (url.pathname.endsWith('/notice/index'))
      data = emptyNotices
        ? { list: [], total: 0, can_send: true }
        : url.searchParams.get('is_read') === '0'
          ? {
              list: [
                {
                  id: 21,
                  title: '维护窗口提醒',
                  content: '系统将在今晚进行维护。',
                  is_pinned: 1,
                  is_read: 0,
                  create_time: 1752883200,
                },
              ],
              total: 1,
              can_send: true,
            }
          : {
              list: [
                {
                  id: 21,
                  title: '维护窗口提醒',
                  content: '系统将在今晚进行维护。',
                  is_pinned: 1,
                  is_read: 0,
                  create_time: 1752883200,
                },
                {
                  id: 20,
                  title: '欢迎加入团队',
                  content: '',
                  is_pinned: 0,
                  is_read: 1,
                  create_time: 1752796800,
                },
              ],
              total: 2,
              can_send: true,
            }
    else if (url.pathname.endsWith('/notice/send')) {
      noticeSendPayload = route.request().postDataJSON() as Record<string, unknown>
      data = {
        id: 22,
        team_id: null,
        sender_team_id: 1,
        entity_id: Number(noticeSendPayload.entity_id),
        is_pinned: noticeSendPayload.is_pinned ? 1 : 0,
      }
    } else if (url.pathname.endsWith('/notice/confirm')) {
      noticeConfirmRequests++
      data = null
    } else if (url.pathname.endsWith('/file/index')) data = { list: [], total: 0 }
    else if (url.pathname.endsWith('/setting/schema'))
      data = {
        apps: [
          {
            app_name: 'entity',
            label: '人员',
            description: '控制团队和成员是否可以通过对象标识被搜索。',
            order: 10,
            settings: [
              {
                key: 'team_searchable',
                label: '团队自身可搜索',
                description: '允许已登录用户通过 @slug 找到当前团队。',
                type: 'boolean',
                control: 'switch',
                order: 10,
                default: false,
                value: false,
              },
              {
                key: 'member_searchable',
                label: '成员默认可搜索',
                description: '成员未设置个人覆盖值时采用此默认值。',
                type: 'boolean',
                control: 'switch',
                order: 20,
                default: false,
                value: false,
              },
              {
                key: 'member_search_priority',
                label: '搜索优先级',
                description: '决定团队默认值与成员显式设置冲突时采用哪一个。',
                type: 'enum',
                control: 'radio',
                order: 30,
                default: 'team',
                value: 'team',
                options: [
                  {
                    value: 'team',
                    label: '团队优先',
                    description: '团队关闭搜索时，所有成员均不可被搜索。',
                  },
                  {
                    value: 'member',
                    label: '成员优先',
                    description: '成员的显式设置可以覆盖团队默认值。',
                  },
                ],
              },
            ],
          },
          {
            app_name: 'member',
            label: '成员',
            description: '配置成员离队、复职与非正常状态人员的处理方式。',
            order: 15,
            settings: [
              {
                key: 'inactive_entity_available',
                label: '封禁或离队后仍可代管人员',
                description: '开启后，有代入权限的人员仍可以进入并使用其完整业务能力。',
                type: 'boolean',
                control: 'switch',
                order: 20,
                default: false,
                value: false,
              },
            ],
          },
          {
            app_name: 'chat',
            label: '聊天',
            description: '控制顾客会话、群历史、已读回执与消息保留策略。',
            order: 20,
            settings: [
              {
                key: 'customer_direct_start',
                label: '顾客可发起单聊',
                description: '允许顾客主动联系团队公开的成员或虚拟人员。',
                type: 'boolean',
                control: 'switch',
                order: 10,
                default: true,
                value: true,
              },
              {
                key: 'customer_group_mode',
                label: '顾客群聊权限',
                description: '决定顾客是否可以加入或创建群聊。',
                type: 'enum',
                control: 'radio',
                order: 20,
                default: 'invite_only',
                value: 'invite_only',
                options: [
                  {
                    value: 'disabled',
                    label: '禁止顾客加入',
                    description: '顾客不能创建群聊，也不能被邀请进入群聊。',
                  },
                  {
                    value: 'invite_only',
                    label: '仅限团队邀请',
                    description: '顾客不能创建群聊，只能由团队成员邀请进入。',
                  },
                  {
                    value: 'create',
                    label: '允许顾客创建',
                    description: '顾客可以创建群聊，但不能主动邀请其他顾客。',
                  },
                ],
              },
              {
                key: 'group_history',
                label: '新成员可见群历史',
                description: '决定新参与者看到全部历史，还是仅看到加入后的消息。',
                type: 'enum',
                control: 'radio',
                order: 30,
                default: 'from_join',
                value: 'from_join',
                options: [
                  {
                    value: 'from_join',
                    label: '仅加入后消息',
                    description: '新参与者只能查看加入群聊之后的消息。',
                  },
                  {
                    value: 'all',
                    label: '全部历史消息',
                    description: '新参与者可以查看加入前的全部群聊消息。',
                  },
                ],
              },
              {
                key: 'read_receipts',
                label: '显示已读回执',
                description: '向会话参与者展示已读状态。',
                type: 'boolean',
                control: 'switch',
                order: 40,
                default: true,
                value: true,
              },
              {
                key: 'edit_window_minutes',
                label: '消息编辑窗口',
                description: '发送后允许本人编辑的分钟数。',
                type: 'integer',
                control: 'number',
                order: 50,
                default: 15,
                value: 15,
                min: 0,
                max: 1440,
              },
            ],
          },
          {
            app_name: 'shop',
            label: '商城',
            description: '控制商城订单与其他应用之间的自动联动。',
            order: 30,
            settings: [
              {
                key: 'enabled',
                label: '开放商城',
                description: '控制已上架商品是否向顾客开放浏览和购买。',
                type: 'boolean',
                control: 'switch',
                order: 5,
                default: false,
                value: false,
                ability_requirement: {
                  key: 'shop',
                  label: '商城',
                  minimum_level: 1,
                  satisfied: false,
                  reason: 'missing',
                },
              },
              {
                key: 'sync_transaction',
                label: '自动同步记账流水',
                description: '下单时自动生成关联流水；仅在团队已开通且未过期的 Transaction Ability 时生效。',
                type: 'boolean',
                control: 'switch',
                order: 10,
                default: true,
                value: true,
              },
              {
                key: 'sync_manual_entitlement_transaction',
                label: '手动赋予权益时同步流水',
                description: '在记账工作台直接赋予顾客权益时，按商品快照生成服务包收款；关闭时只赋予权益。',
                type: 'boolean',
                control: 'switch',
                order: 20,
                default: false,
                value: false,
              },
            ],
          },
          {
            app_name: 'display',
            label: '展示',
            description: '配置团队公开主页的固定展示文案。',
            order: 40,
            settings: [
              {
                key: 'homepage_welcome',
                label: '主页欢迎语',
                description: '团队公开简介为空时显示在主页首屏。',
                type: 'string',
                control: 'input',
                order: 10,
                default: '欢迎来到我们的公开主页',
                value: '欢迎来到我们的公开主页',
                min_length: 1,
                max_length: 100,
              },
              {
                key: 'homepage_entities_link',
                label: '人员入口文案',
                description: '主页首屏中跳转到公开人员区域的链接文案。',
                type: 'string',
                control: 'input',
                order: 20,
                default: '浏览公开人员',
                value: '浏览公开人员',
                min_length: 1,
                max_length: 100,
              },
              {
                key: 'homepage_entities_title',
                label: '人员区域标题',
                description: '主页公开人员预览区域的标题。',
                type: 'string',
                control: 'input',
                order: 30,
                default: '公开人员',
                value: '公开人员',
                min_length: 1,
                max_length: 100,
              },
              {
                key: 'homepage_entities_description',
                label: '人员区域说明',
                description: '主页公开人员预览区域的辅助说明。',
                type: 'string',
                control: 'input',
                order: 40,
                default: '团队成员与虚拟人员',
                value: '团队成员与虚拟人员',
                min_length: 1,
                max_length: 100,
              },
              {
                key: 'homepage_entities_empty',
                label: '人员空状态文案',
                description: '团队没有可公开人员时显示的提示。',
                type: 'string',
                control: 'input',
                order: 50,
                default: '团队暂时没有公开人员',
                value: '团队暂时没有公开人员',
                min_length: 1,
                max_length: 100,
              },
            ],
          },
        ],
      }
    else if (url.pathname.endsWith('/setting')) {
      if (route.request().method() === 'POST') settingPayload = route.request().postDataJSON() as Record<string, unknown>
      data = {
        team_searchable: false,
        member_searchable: false,
        member_search_priority: 'team',
      }
    } else if (url.pathname.endsWith('/me/get'))
      data = {
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
    else if (url.pathname.endsWith('/join/form'))
      data = {
        purpose_code: 'join',
        purpose_label: '加入',
        refill_required: true,
        fields: [],
        file_upload: {
          count: 6,
          total_size: 17_825_792,
          size_limit: 524_288_000,
          remaining_size: 506_462_208,
          available: true,
          reason: null,
        },
      }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })
  const collectionPaths = new Set(['/entities', '/members', '/customers', '/roles', '/fields', '/join-fields', '/chat-virtuals', '/notices/entity', '/notices/team', '/files', '/docs', '/join-review'])
  for (const path of ['/', '/entities', '/members', '/customers', '/member-detail?id=1', '/member-add', '/member-edit?id=1', '/roles', '/roles/new', '/fields', '/field-new?type=entity', '/join-fields', '/join-fields/new', '/join-fields/42', '/chat-virtuals', '/chat-virtual-new', '/chat-virtual?slug=sales-assistant', '/chat-integration-new?slug=sales-assistant', '/notices/entity', '/notices/entity/detail?id=21', '/notices/team', '/notices/team/detail?id=21', '/notices/send', '/files', '/docs', '/doc-create', '/doc-edit?id=11', '/doc?id=11', '/settings', '/join-review', '/join-review/review?id=1']) {
    await page.goto(`http://demo.team.lostsky.work:5175${path}`)
    expect(page.url(), `unexpected navigation at ${path}; errors: ${pageErrors.join(' | ')}`).toContain('demo.team.lostsky.work:5175')
    if (!(await page.locator('#workspace').count())) throw new Error(`workspace missing at ${path}; url=${page.url()}; authenticated=${Boolean(await page.evaluate(() => localStorage.getItem('lostsky_token')))}; errors=${pageErrors.join(' | ')}; body=${(await page.locator('body').innerText()).slice(0, 400)}`)
    await expect(page.locator('#workspace')).toBeVisible()
    await expect(page.locator('#workspace > .ls-page'), `admin page hidden at ${path}; errors: ${pageErrors.join(' | ')}`).toBeVisible({ timeout: 60_000 })
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
        await expect(page.getByRole('link', { name: '聊天', exact: true })).toHaveAttribute('href', 'http://demo.chat.lostsky.work:5176/')
        const typography = await header.locator('.ls-workspace-header__desktop a').evaluateAll((elements) =>
          elements.map((element) => {
            const style = getComputedStyle(element)
            return `${style.fontFamily}|${style.fontSize}|${style.fontWeight}`
          }),
        )
        expect(new Set(typography).size).toBe(1)
      }
      await expect(page.getByRole('link', { name: '进入个人工作台' })).toHaveAttribute('href', '/personal')
      await expect(page.getByRole('link', { name: '使用文档' })).toHaveAttribute('href', '//doc.lostsky.work')
      const overviewActions = page.locator('.ls-workspace-overview__actions > a')
      const overviewActionBoxes = await Promise.all((await overviewActions.all()).map((action) => action.boundingBox()))
      expect(overviewActionBoxes).toHaveLength(2)
      if ((page.viewportSize()?.width ?? 0) < 480) {
        expect(Math.abs((overviewActionBoxes[0]?.width ?? 0) - (overviewActionBoxes[1]?.width ?? 0))).toBeLessThan(1)
      } else {
        expect(overviewActionBoxes[0]?.width ?? 0).toBeGreaterThan(overviewActionBoxes[1]?.width ?? 0)
        expect(Math.abs((overviewActionBoxes[0]?.height ?? 0) - (overviewActionBoxes[1]?.height ?? 0))).toBeLessThanOrEqual(1)
      }
      await expect(overviewActions.nth(0).locator('svg')).toHaveCount(2)
      await expect(overviewActions.nth(1).locator('svg')).toHaveCount(2)
      await expect(page.getByLabel('团队资源摘要').locator('dd')).toHaveText(['3', '1', '2', '1'])
      const originalViewport = page.viewportSize()
      await page.setViewportSize({ width: 1000, height: 560 })
      const sidebarMenu = page.locator('.sidebar nav')
      await expect(page.getByRole('link', { name: '切换身份' })).toHaveCSS('justify-content', 'flex-start')
      const abilityEntry = page.locator('.sidebar a[href="/settings"]')
      await expect(abilityEntry).toBeVisible()
      await expect(abilityEntry).toHaveCSS('display', 'grid')
      expect(await abilityEntry.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' '))).toHaveLength(3)
      expect(
        await abilityEntry.locator(':scope > *').evaluateAll(
          (elements) =>
            new Set(
              elements.map((element) => {
                const bounds = element.getBoundingClientRect()
                return Math.round(bounds.top + bounds.height / 2)
              }),
            ).size,
        ),
      ).toBe(1)
      const moreMenu = page.getByRole('button', { name: '向下查看更多菜单' })
      await expect(moreMenu).toBeVisible()
      const initialScrollTop = await sidebarMenu.evaluate((element) => element.scrollTop)
      await moreMenu.click()
      await expect.poll(() => sidebarMenu.evaluate((element) => element.scrollTop)).toBeGreaterThan(initialScrollTop)
      await sidebarMenu.evaluate((element) => element.scrollTo({ top: element.scrollHeight }))
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
        expect(
          await row.locator('.ls-responsive-actions__desktop .n-button').evaluateAll((buttons) =>
            buttons.every((button) => {
              const style = getComputedStyle(button)
              return style.backgroundColor === 'rgba(0, 0, 0, 0)' && style.borderStyle === 'none'
            }),
          ),
        ).toBe(true)
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
      const customerSearch = page.getByRole('searchbox', { name: '搜索顾客' })
      await customerSearch.fill('不存在的顾客')
      const empty = page.locator('.ls-empty-state')
      await expect(empty).toContainText('没有匹配的顾客')
      await expect(empty).toContainText('顾客领取团队商店身份后会进入顾客目录。')
      await customerSearch.fill('')
    }
    if (path === '/member-detail?id=1') {
      await expect(page.getByRole('link', { name: '发起对话' })).toHaveAttribute('href', 'http://demo.chat.lostsky.work:5176/new?participant=alice')
    }
    if (path === '/join-review') {
      await expect(page.getByRole('link', { name: /青空成员/ })).toBeVisible()
      await expect(page.getByText('查看申请状态，选择一条申请进入独立审核页面。')).toBeVisible()
    }
    if (path === '/join-fields') {
      await expect(page.getByRole('link', { name: /相关经验/ })).toBeVisible()
      await expect(page.getByRole('link', { name: /作品说明/ })).toContainText('已停用')
      await expect(page.locator('.sidebar a[href="/join-review"]')).toContainText('人事审核')
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
      if ((page.viewportSize()?.width ?? 0) < 640) {
        const header = page.locator('.ls-page-header')
        const titleBox = await header.getByRole('heading', { level: 1 }).boundingBox()
        const descriptionBox = await header.locator('p').boundingBox()
        const actionBox = await header.getByRole('button', { name: '全部标为已读' }).boundingBox()
        expect(titleBox).not.toBeNull()
        expect(descriptionBox).not.toBeNull()
        expect(actionBox).not.toBeNull()
        expect(Math.abs((titleBox?.x ?? 0) - (descriptionBox?.x ?? 0))).toBeLessThanOrEqual(1)
        expect(descriptionBox?.y ?? 0).toBeGreaterThan(titleBox?.y ?? 0)
        expect(actionBox?.y ?? 0).toBeGreaterThan(descriptionBox?.y ?? 0)
      }
      await expect(page.locator('.notice-detail-view')).toHaveCount(0)
      await expect(page.locator('.sidebar a[href="/notices/entity"]')).toContainText('通知中心')
    }
    if (path === '/notices/entity/detail?id=21' || path === '/notices/team/detail?id=21') {
      const isTeamScope = path.includes('/team/')
      await expect(page.getByRole('heading', { name: '维护窗口提醒', level: 1 })).toBeVisible()
      await expect(page.getByRole('heading', { name: '维护安排', level: 2 })).toBeVisible()
      await expect(page.getByText('请提前保存正在处理的内容。')).toBeVisible()
      await expect(page.locator('.notice-content li')).toHaveText(['保存草稿', '回复确认'])
      expect(await page.evaluate(() => (window as typeof window & { __noticeXss?: number }).__noticeXss)).toBeUndefined()
      await expect(
        page.getByRole('link', {
          name: isTeamScope ? '返回站内通知列表' : '返回通知列表',
        }),
      ).toHaveAttribute('href', isTeamScope ? '/notices/team' : '/notices/entity')
      await expect(page.getByText('已读', { exact: true })).toBeVisible()
    }
    if (path === '/notices/send') {
      await expect(page.locator('#workspace').getByRole('heading', { name: '发送通知', level: 1 })).toBeVisible()
      await expect(page.getByText('通知只进入所选人员的收件箱，不支持回复、抄送或会话；发送方统一显示为当前 Team。')).toBeVisible()
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
      await expect(recipientMenu.locator('.recipient-option').filter({ hasText: '测试顾客' })).toContainText('顾客@customer-1')
      await expect(recipientMenu.locator('.recipient-option').filter({ hasText: '测试成员' })).toContainText('成员@member-1')
      await expect(recipientMenu.locator('.recipient-option').filter({ hasText: '协作助手' })).toContainText('虚拟人员@helper')
      await recipientMenu.locator('.n-base-select-option').filter({ hasText: '测试顾客' }).click()
      await page.getByLabel('标题 *').fill('顾客专属通知')
      await page.getByRole('tab', { name: '源码' }).click()
      await page.getByRole('textbox', { name: 'Markdown 源码' }).fill('## 行动\n\n- 保存工作\n- 回复确认')
      await page.getByRole('button', { name: '发送通知' }).click()
      await expect(page.getByRole('status')).toContainText('通知已发送给 测试顾客')
      expect(noticeSendPayload).toMatchObject({
        entity_id: 2,
        title: '顾客专属通知',
        content: '## 行动\n\n- 保存工作\n- 回复确认',
        is_pinned: false,
      })
    }
    if (path === '/doc-create') {
      await expect(page.locator('#workspace').getByRole('heading', { name: '新建文档', level: 1 })).toBeVisible()
      await expect(page.getByRole('tab', { name: '可视化' })).toBeVisible()
      await expect(page.getByRole('tab', { name: '源码' })).toBeVisible()
      await expect(page.getByRole('tab', { name: '预览' })).toBeVisible()
      await expect(page.locator('dialog')).toHaveCount(0)
      const mentionButton = page.getByRole('button', {
        name: '引用团队或成员',
      })
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
      await mentionButton.dispatchEvent('pointerdown', {
        button: 0,
        buttons: 1,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
      })
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
      expect((await documentSearch.boundingBox())?.height).toBeCloseTo((page.viewportSize()?.width ?? 0) < 640 ? 44 : 40, 0)
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
      const saveButtons = page.locator('.settings-header .ls-button')
      const saveButtonWidths = await saveButtons.evaluateAll((buttons) => buttons.map((button) => Math.round(button.getBoundingClientRect().width)))
      const clippedSaveLabels = await saveButtons.locator('.n-button__content').evaluateAll((labels) => labels.filter((label) => label.scrollWidth > label.clientWidth).map((label) => label.textContent))
      expect(saveButtonWidths.length).toBeGreaterThan(1)
      expect(clippedSaveLabels).toEqual([])
      if ((page.viewportSize()?.width ?? 0) >= 641) {
        expect(new Set(saveButtonWidths)).toEqual(new Set([144]))
      } else {
        expect(new Set(saveButtonWidths).size).toBe(1)
        expect(saveButtonWidths[0]).toBeGreaterThan(144)
      }
      await expect(page.getByRole('heading', { name: '人员', level: 2 })).toBeVisible()
      await expect(page.getByRole('button', { name: '保存成员设置' })).toBeVisible()
      await expect(page.getByRole('heading', { name: '聊天', level: 2 })).toBeVisible()
      await expect(page.getByRole('heading', { name: '商城', level: 2 })).toBeVisible()
      await expect(page.getByRole('heading', { name: '展示', level: 2 })).toBeVisible()
      await expect(page.getByRole('switch', { name: '团队自身可搜索' })).toBeVisible()
      await expect(page.getByRole('switch', { name: '成员默认可搜索' })).toBeVisible()
      await expect(page.getByRole('switch', { name: '自动同步记账流水' })).toBeChecked()
      await expect(page.getByRole('switch', { name: '手动赋予权益时同步流水' })).not.toBeChecked()
      await expect(page.getByRole('radio', { name: /团队优先/ })).toBeChecked()
      await expect(page.getByText('成员优先', { exact: true })).toBeVisible()
      await page.getByText('成员优先', { exact: true }).click()
      await expect(page.getByRole('radio', { name: /成员优先/ })).toBeChecked()
      await expect(page.getByRole('radio', { name: /仅限团队邀请/ })).toBeChecked()
      await expect(page.getByRole('radio', { name: /仅加入后消息/ })).toBeChecked()
      await expect(page.getByText('顾客不能创建群聊，只能由团队成员邀请进入。')).toBeVisible()
      await expect(page.getByText('新参与者可以查看加入前的全部群聊消息。')).toBeVisible()
      await expect(page.getByText('InviteOnly', { exact: true })).toHaveCount(0)
      await expect(page.getByText('FromJoin', { exact: true })).toHaveCount(0)
      const shopSwitch = page.locator('[aria-labelledby="setting-shop-enabled-label"]')
      await expect(shopSwitch).toHaveAttribute('aria-disabled', 'true')
      await expect(shopSwitch).not.toHaveAttribute('title')
      await expect(shopSwitch).toHaveCSS('cursor', 'not-allowed')
      await expect(shopSwitch.locator('.n-switch__rail')).toHaveCSS('cursor', 'not-allowed')
      await expect(shopSwitch.locator('.n-switch__button')).toHaveCSS('cursor', 'not-allowed')
      await expect(shopSwitch.locator('.n-switch__button')).toHaveCSS('background-color', 'oklch(0.885 0.012 210)')
      await expect(page.locator('.requirement-reason')).toHaveCount(0)
      await shopSwitch.click({ force: true })
      await expect(page.locator('.n-message').filter({ hasText: '商城' })).toBeVisible()
      await expect(page.locator('.settings-view .n-select')).toHaveCount(0)
      await expect(page.getByRole('textbox', { name: '消息编辑窗口' })).toHaveValue('15')
      await expect(page.getByRole('textbox', { name: '主页欢迎语' })).toHaveValue('欢迎来到我们的公开主页')
      await expect(page.getByRole('textbox', { name: '人员入口文案' })).toHaveValue('浏览公开人员')
      await expect(page.getByRole('textbox', { name: '人员区域标题' })).toHaveValue('公开人员')
      await expect(page.getByRole('textbox', { name: '人员区域说明' })).toHaveValue('团队成员与虚拟人员')
      const emptyCopy = page.getByRole('textbox', { name: '人员空状态文案' })
      await expect(emptyCopy).toHaveValue('团队暂时没有公开人员')
      await emptyCopy.fill('伙伴资料正在准备中')
      await page.getByRole('button', { name: '保存展示设置' }).click()
      await expect
        .poll(() => settingPayload)
        .toEqual({
          app_name: 'display',
          settings: {
            homepage_welcome: '欢迎来到我们的公开主页',
            homepage_entities_link: '浏览公开人员',
            homepage_entities_title: '公开人员',
            homepage_entities_description: '团队成员与虚拟人员',
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
        { slug: 'helper', type: '虚拟人员' },
        { slug: 'customer-1', type: '顾客' },
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
    if (path === '/docs' && (await page.locator('.document-list article').count()) === 2) {
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

  accessPermissions = accessPermissions.filter((permission) => permission !== 'team.notice.read' && permission !== 'team.notice.send')
  await page.goto('http://demo.team.lostsky.work:5175/notices/entity')
  await expect(page.locator('.sidebar a[href="/notices/entity"]')).toBeVisible()
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
      options: [
        { label: '有经验', value: 'yes' },
        { label: '暂无经验', value: 'no' },
      ],
      default_value: 'no',
      is_apply_fillable: 1,
      is_apply_required: 1,
      is_transfer_entity_field: 1,
      entity_field_id: 7,
      entity_field: {
        id: 7,
        field_key: 'member_experience',
        name: '成员经验',
        value_type: 'select',
        input_type: 'select',
      },
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

  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: 'e2e-token',
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const url = new URL(route.request().url())
    let data: unknown = null
    if (url.pathname.endsWith('/access')) data = { permissions, abilities: {} }
    else if (url.pathname.endsWith('/joinField/index')) {
      indexRequests++
      data = fields
    } else if (url.pathname.endsWith('/joinField/transferOptions')) {
      transferRequests++
      data = [
        {
          id: 7,
          field_key: 'member_experience',
          name: '成员经验',
          value_type: 'select',
          input_type: 'select',
          sort: 10,
        },
      ]
    } else if (url.pathname.endsWith('/joinField/edit')) {
      editPayload = route.request().postDataJSON() as Record<string, unknown>
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
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
  await expect
    .poll(() => editPayload)
    .toMatchObject({
      id: 41,
      is_active: 0,
      is_transfer_entity_field: 1,
      entity_field_id: 7,
      options: [
        { label: '有经验', value: 'yes' },
        { label: '暂无经验', value: 'no' },
      ],
    })
  expect(editPayload).not.toHaveProperty('field_key')

  permissions = ['team.join_field.read']
  const transferRequestsBeforeReadOnly = transferRequests
  await page.goto('http://demo.team.lostsky.work:5175/join-fields/41')
  await expect(page.locator('#workspace').getByRole('heading', { name: '查看申请字段' })).toBeVisible()
  await expect(page.getByRole('button', { name: '保存字段' })).toHaveAttribute('aria-disabled', 'true')
  await expect(page.getByRole('button', { name: '删除字段' })).toHaveAttribute('aria-disabled', 'true')
  await page.getByRole('button', { name: '保存字段' }).click({ force: true })
  await expect(page.locator('.n-message').filter({ hasText: 'team.join_field.write' })).toBeVisible()
  expect(transferRequests).toBe(transferRequestsBeforeReadOnly)

  permissions = []
  const indexRequestsBeforeDenied = indexRequests
  await page.goto('http://demo.team.lostsky.work:5175/join-fields')
  await expect(page.locator('.ls-empty-state')).toContainText('team.join_field.read')
  await expect(page.locator('.n-message').filter({ hasText: 'team.join_field.read' })).toBeVisible()
  expect(indexRequests).toBe(indexRequestsBeforeDenied)
})

test('document Ability gates its route while level 0 file uploads remain usable', async ({ page }) => {
  let docEnabled = true
  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: 'e2e-token',
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const url = new URL(route.request().url())
    let data: unknown = []
    if (url.pathname.endsWith('/access')) {
      data = {
        permissions: ['team.document.read', 'file.read', 'file.upload'],
        abilities: {
          file: {
            enabled: false,
            level: 0,
            expire_time: 0,
            reason: '未开通',
            label: '文件上传',
          },
          doc: {
            enabled: docEnabled,
            level: docEnabled ? 1 : 0,
            expire_time: 0,
            reason: docEnabled ? null : '未开通',
            label: '文档',
          },
        },
      }
    } else if (url.pathname.endsWith('/entity/options')) {
      data = [{ entity_id: 1, type: 'team', slug: 'demo', name: '测试团队' }]
    } else if (url.pathname.endsWith('/dashboard')) {
      data = {
        entities: { available: true, count: 0, error: null, reason: null },
        members: { available: true, count: 0, error: null, reason: null },
        documents: {
          available: false,
          count: null,
          error: null,
          reason: '当前团队缺失能力(Ability): 文档(Document)',
        },
        notices: { available: true, count: 0, error: null, reason: null },
      }
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
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
  await expect(imageUpload).toBeEnabled()
  await expect(imageUpload).not.toHaveAttribute('aria-disabled', 'true')
  await expect(imageUpload).toHaveAttribute('aria-label', '插入图片')
  await expect(page.locator('.milkdown-image-block')).toHaveCount(0)
  await expect(page.getByText('上传本地图片', { exact: true })).toHaveCount(0)
  await expect(page.locator('#workspace').getByRole('heading', { name: '新建文档', level: 1 })).toBeVisible()

  docEnabled = false
  await page.goto('http://demo.team.lostsky.work:5175/docs')
  await expect(page).toHaveURL('http://demo.team.lostsky.work:5175/docs')
  await expect(page.locator('.ls-empty-state')).toContainText('文档')
  await expect(page.locator('.ls-empty-state')).toContainText('Ability')
  await expect(page.locator('.n-message').filter({ hasText: '文档' })).toBeVisible()
  await expect(page.locator('.sidebar a[href="/docs"]')).toBeVisible()
})

test('access snapshot failure does not fabricate permission denials', async ({ page }) => {
  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: 'e2e-token',
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/access')) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 503,
          message: '访问快照暂时不可用',
          data: null,
        }),
      })
      return
    }
    const data = path.endsWith('/member/index') ? [] : null
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.team.lostsky.work:5175/members')
  await expect(page.locator('.sidebar .nav-disabled')).toHaveCount(0)
  await expect(page.locator('.sidebar a[href="/docs"]')).toBeVisible()
  await expect(page.locator('.sidebar a[href="/files"]')).toBeVisible()
  await expect(page.getByRole('link', { name: '添加成员' })).toBeVisible()
})

test('entity field form saves unified access rules and custom targets', async ({ page }) => {
  let savedPayload: Record<string, unknown> | null = null
  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: 'e2e-token',
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = []
    if (path.endsWith('/access')) {
      data = { permissions: ['team.entity.field.manage'], abilities: {} }
    } else if (path.endsWith('/entity/options')) {
      data = [
        { entity_id: 1, type: 'team', slug: 'demo', name: '测试团队' },
        { entity_id: 2, type: 'teamMember', slug: 'alice', name: '测试成员' },
      ]
    } else if (path.endsWith('/entityField/create')) {
      savedPayload = route.request().postDataJSON() as Record<string, unknown>
      data = null
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.team.lostsky.work:5175/field-new?type=entity')
  await page.getByPlaceholder('department').fill('department')
  await page.getByPlaceholder('部门').fill('部门')
  const visibilitySelect = page.locator('.access-policy > label').filter({ hasText: '值可见范围' }).locator('.n-select')
  await visibilitySelect.click()
  await page.locator('.n-base-select-option').filter({ hasText: '公开可见' }).click()
  await expect(page.getByText('公开字段只有在所属人员有效且已开启公开主页展示时')).toBeVisible()
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

test('member task keeps unauthorized operations visible in the shared permission state', async ({ page }) => {
  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: 'e2e-token',
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
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
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.team.lostsky.work:5175/member-edit?id=3')
  await expect(page.getByText('只读成员', { exact: true })).toBeVisible()
  const saveMember = page.getByRole('button', { name: '保存成员' })
  await expect(saveMember).toHaveAttribute('aria-disabled', 'true')
  await saveMember.dispatchEvent('click')
  await expect(page.locator('.n-message').filter({ hasText: 'team.member.update' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '对象字段' })).toBeVisible()
  await expect(page.getByText('-', { exact: true })).toBeVisible()
  await expect(page.locator('.ls-empty-state')).toContainText('team.role.read')
  await expect(page.getByRole('heading', { name: '管理操作' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: '团队昵称' })).toHaveCount(0)
})

test('team role tasks use independent routes for entity assignment and permission editing', async ({ page }) => {
  let entityAssignment: { slug?: string; role_ids?: number[] } | null = null
  let savedPermissions: string[] = []
  let savedRole: unknown = null
  let entitySearches = 0
  let teamEntityOptionLoads = 0
  const actorToken = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamMember', id: 11 } })).toString('base64url')}.x`
  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: actorToken,
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    let status = 200
    let data: unknown = []
    if (path.endsWith('/role/index')) {
      data = [
        {
          id: 1,
          name: '自动化操作员',
          role_key: 'operator',
          description: '',
          sort: 10,
          is_displayed: 0,
        },
      ]
    } else if (path.endsWith('/access')) {
      data = {
        permissions: ['team.ability', 'team.role.read', 'team.role.write'],
        abilities: {
          doc: {
            enabled: true,
            level: 1,
            expire_time: 0,
            reason: null,
            label: '文档',
          },
          transaction: {
            enabled: true,
            level: 1,
            expire_time: 0,
            reason: null,
            label: '记账',
          },
        },
      }
    } else if (path.endsWith('/role/get')) {
      data = {
        id: 1,
        name: '自动化操作员',
        role_key: 'operator',
        description: '',
        sort: 10,
        is_displayed: 0,
      }
    } else if (path.endsWith('/member/index')) {
      data = []
    } else if (path.endsWith('/rolePermission/catalog')) {
      data = {
        groups: [
          {
            name: '团队能力',
            items: [{ key: 'team.ability.redeem', label: '兑换团队能力' }],
          },
          {
            name: '文档管理',
            items: [
              { key: 'team.document.read', label: '查看全部文档' },
              { key: 'team.document.team.manage', label: '管理团队文档' },
              {
                key: 'team.document.customer.*.manage',
                label: '管理全部顾客文档',
              },
            ],
          },
          {
            name: '人员管理',
            items: [
              {
                key: 'team.entity.virtual.helper.manage',
                label: '管理 · 协作助手',
              },
              {
                key: 'team.entity.virtual.helper.field.manage',
                label: '管理字段 · 协作助手',
              },
            ],
          },
          {
            name: '人员委托',
            items: [
              { key: 'identity.team.assume', label: '领取团队身份' },
              { key: 'identity.member.*.assume', label: '领取全部成员身份' },
              {
                key: 'identity.virtual.helper.assume',
                label: '领取 · 协作助手身份',
              },
            ],
          },
          {
            name: '聊天',
            items: [
              {
                key: 'chat.virtual.helper.act',
                label: '代表 · 协作助手参与聊天',
              },
            ],
          },
        ],
        advanced_items: [
          {
            key: 'team',
            label: '覆盖 team 下全部权限',
            covered_keys: ['team.ability.redeem'],
          },
          {
            key: 'team.ability',
            label: '覆盖 team.ability 下全部权限',
            covered_keys: ['team.ability.redeem'],
          },
          {
            key: 'identity.member',
            label: '覆盖 identity.member 下全部权限',
            covered_keys: ['identity.member.*.assume'],
          },
        ],
      }
    } else if (path.endsWith('/rolePermission/index')) {
      data = [{ permission_key: 'identity.member.*.assume' }, { permission_key: 'identity.member.member-2.assume' }]
    } else if (path.endsWith('/personal')) {
      data = {
        identity: {
          entity_id: 22,
          type: 'teamMember',
          slug: 'member-2',
          name: '成员二号',
          team: { name: '当前团队' },
        },
        profile: { name: '成员二号' },
        custom_fields: [],
        custom_field_values: [],
        role_assignments: [
          {
            role_id: 1,
            role: { id: 1, name: '自动化操作员', role_key: 'operator' },
          },
        ],
        effective_permissions: [
          {
            key: 'identity.member.*.assume',
            label: '领取全部成员身份',
            group: '人员委托',
          },
          {
            key: 'identity.member.member-2.assume',
            label: '领取成员二号身份',
            group: '人员委托',
          },
          {
            key: 'identity.member.member-2.assume',
            label: '领取成员二号身份',
            group: '人员委托',
          },
          {
            key: 'identity.member.member-2',
            label: '覆盖 identity.member.member-2 下全部权限',
            group: '人员委托',
          },
        ],
      }
    } else if (path.endsWith('/entity/options')) {
      teamEntityOptionLoads++
      data = [
        {
          id: 22,
          entity_id: 22,
          slug: 'member-2',
          type: 'teamMember',
          name: '成员二号',
          avatar: null,
        },
        {
          id: 23,
          entity_id: 23,
          slug: 'helper',
          type: 'teamVirtual',
          name: '协作助手',
          avatar: null,
        },
        {
          id: 24,
          entity_id: 24,
          slug: 'customer-1',
          type: 'teamCustomer',
          name: '顾客一号',
          avatar: null,
        },
      ]
    } else if (path.endsWith('/entity/search')) {
      entitySearches++
      data = [
        {
          slug: 'bot-a',
          type: 'teamVirtual',
          display_name: 'Bot A',
          available: true,
          href: null,
        },
      ]
    } else if (path.endsWith('/entityRole/resolve')) {
      const slug = url.searchParams.get('slug')
      if (slug === 'bot') {
        status = 404
        data = null
      } else
        data =
          slug === 'bot-a'
            ? {
                type: 'teamVirtual',
                id: 9,
                slug,
                name: 'Bot A',
                team: { id: 7, slug: 'team-a', name: '团队 A' },
                is_external: true,
              }
            : {
                type: 'teamMember',
                id: 21,
                slug,
                name: slug === 'member-2' ? '成员二号' : 'Bob',
                team: { id: 8, slug: 'demo', name: '当前团队' },
                is_external: false,
              }
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
  await expect(page.getByText('跨团队身份')).toBeVisible()
  await page.getByRole('checkbox', { name: /自动化操作员/ }).check()
  await page.getByRole('button', { name: '保存分配' }).click()
  await expect.poll(() => entityAssignment).toEqual({ slug: 'bot-a', role_ids: [1] })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)

  await page.goto('http://demo.team.lostsky.work:5175/roles/1')
  await expect(page.getByRole('link', { name: '返回角色列表' })).toBeVisible()
  await page.getByRole('switch', { name: '在公开人员资料中展示此角色' }).click()
  await page.getByRole('button', { name: '保存资料' }).click()
  await expect.poll(() => savedRole).toMatchObject({ id: 1, is_displayed: 1 })
  await page.getByText('高级范围权限', { exact: true }).click()
  await expect(page.getByText('人员委托', { exact: true })).toBeVisible()
  await page.getByLabel('搜索高级范围权限').fill('team.ability')
  await page.getByRole('checkbox', { name: /覆盖 team\.ability 下全部权限/ }).check()
  await page.getByText('团队能力 · 已选择 1/1', { exact: true }).click()
  await expect(page.getByRole('checkbox', { name: /兑换团队能力/ })).toBeDisabled()
  await page.getByRole('button', { name: '保存权限' }).click()
  await expect(page.getByText('未来新增的同前缀权限')).toBeVisible()
  await page.getByRole('button', { name: '确认并保存' }).click()
  await expect.poll(() => savedPermissions).toContain('team.ability')
  expect(savedPermissions).not.toContain('team.ability.redeem')
  expect(savedPermissions).toContain('identity.member.*.assume')
  expect(savedPermissions).not.toContain('identity.member.member-2.assume')
  await expect(page.getByText('人员委托 · 已配置 1 项', { exact: true })).toBeVisible()
  await expect(page.getByText('人员管理 · 已配置 0 项', { exact: true })).toBeVisible()
  await expect(page.getByText('文档管理 · 已配置 0 项', { exact: true })).toBeVisible()
  await expect(page.getByText('身份委托', { exact: true })).toHaveCount(0)
  await expect(page.getByText('指定虚拟人员', { exact: true })).toHaveCount(0)
  await expect(page.getByText('动态权限', { exact: true })).toHaveCount(0)
  await expect(page.getByLabel('选择权限目标')).toHaveCount(0)
  await page.getByText('文档管理 · 已配置 0 项', { exact: true }).click()
  await page.getByLabel('选择权限目标').fill('customer-1')
  await page.getByRole('option', { name: /顾客一号.*customer-1/ }).click()
  let dynamicPermissions = page.locator('.dynamic-permission-list:visible')
  await dynamicPermissions
    .getByRole('checkbox', {
      name: /管理指定人员文档.*team\.document\.customer\.customer-1\.manage/,
    })
    .check()
  await expect(page.getByText('文档管理 · 已配置 1 项', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '保存权限' }).click()
  await expect.poll(() => savedPermissions).toContain('team.document.customer.customer-1.manage')
  await page.getByRole('button', { name: '清除 顾客一号' }).click()
  await page.getByText('文档管理 · 已配置 1 项', { exact: true }).click()
  await page.getByText('聊天 · 已选择 0/1', { exact: true }).click()
  await page
    .getByRole('checkbox', {
      name: /代表 · 协作助手参与聊天.*chat\.virtual\.helper\.act/,
    })
    .check()
  await page.getByText('人员委托 · 已配置 1 项', { exact: true }).click()
  await expect(page.getByLabel('选择权限目标')).toBeVisible()
  dynamicPermissions = page.locator('.dynamic-permission-list:visible')
  await expect(dynamicPermissions.getByRole('checkbox')).toHaveCount(1)
  for (const checkbox of await dynamicPermissions.getByRole('checkbox').all()) await expect(checkbox).toBeDisabled()
  await page.getByLabel('选择权限目标').fill('helper')
  await page.getByRole('option', { name: /协作助手.*helper/ }).click()
  expect(teamEntityOptionLoads).toBe(1)
  await dynamicPermissions
    .getByRole('checkbox', {
      name: /领取指定人员身份.*identity\.virtual\.helper\.assume/,
    })
    .check()
  await expect(page.getByText('人员委托 · 已配置 2 项', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '已进入角色草稿' })).toBeVisible()
  await page.getByText('人员管理 · 已配置 0 项', { exact: true }).click()
  dynamicPermissions = page.locator('.dynamic-permission-list:visible')
  await dynamicPermissions
    .getByRole('checkbox', {
      name: /管理指定虚拟人员.*team\.entity\.virtual\.helper\.manage/,
    })
    .check()
  await expect(page.getByText('人员管理 · 已配置 1 项', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '保存权限' }).click()
  await expect.poll(() => savedPermissions).toContain('team.entity.virtual.helper.manage')
  expect(savedPermissions).toContain('chat.virtual.helper.act')
  expect(savedPermissions).toContain('identity.virtual.helper.assume')

  await page.goto('http://demo.team.lostsky.work:5175/roles/entities?slug=bob')
  await page.getByRole('checkbox', { name: /自动化操作员/ }).check()
  await page.getByRole('button', { name: '保存分配' }).click()
  await expect.poll(() => entityAssignment).toEqual({ slug: 'bob', role_ids: [1] })
  await expect(page.locator('.sidebar a[href="/settings"]')).toContainText('团队设置')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)

  await page.goto('http://demo.team.lostsky.work:5175/personal/access')
  await page.getByText('人员委托', { exact: true }).click()
  const delegationSummary = page.locator('.effective')
  await expect(delegationSummary.locator('li')).toHaveCount(4)
  await expect(delegationSummary.locator('code').filter({ hasText: 'identity.member.member-2.assume' })).toHaveCount(2)
  await expect(delegationSummary.getByText('高级范围', { exact: true })).toHaveCount(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
})

test('transaction workspace covers ledger tasks without horizontal overflow', async ({ page }, testInfo) => {
  test.setTimeout(120_000)
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(message.text())
  })
  const actorToken = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamMember', id: 11 } })).toString('base64url')}.x`
  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: actorToken,
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
  let optionsMode: 'full' | 'missing' | 'empty' | 'error' = 'full'
  let manualGrantPayload: Record<string, unknown> | null = null
  let personalGrantPayload: Record<string, unknown> | null = null
  let statsFailureType: string | null = null
  const statsRequests: string[] = []
  await page.route('http://demo.transaction.lostsky.work:5177/api/**', async (route) => {
    const url = new URL(route.request().url())
    const entity = {
      id: 11,
      entity_id: 11,
      entityable_type: 'teamMember',
      entityable_id: 1,
      type: 'member',
      slug: 'handler',
      name: 'Handler',
      profile: { nickname: 'Handler' },
      nickname: '青空接单人',
      avatar: null,
      status_code: 'active',
      status_label: '正常',
    }
    const customer = {
      id: 8,
      nickname: '晚风顾客',
      avatar: null,
      description: '长期顾客',
      is_blocked: 0,
      balance: { balance: 880, recharged: 1200, spent: 320 },
    }
    const transaction = {
      id: 21,
      handler_entity_id: 11,
      sender_entity_id: null,
      cs_entity_id: null,
      customer_id: 8,
      type: 2,
      total_price: 320,
      cost: 80,
      cash: 200,
      prepaid: 120,
      handler_cut: 140,
      sender_cut: 0,
      cs_cut: 0,
      team_cut: 100,
      trans_at: 1784563200,
      memo: '七月陪玩服务',
      handler: entity,
      customer,
    }
    let data: unknown = null
    if (url.pathname.endsWith('/workspace/access')) {
      data = {
        team: { id: 1, slug: 'demo', name: '青空团队' },
        permissions: ['transaction.read', 'transaction.write', 'transaction.report.read', 'service.redemption.read', 'service.entitlement.grant'],
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
    } else if (url.pathname.endsWith('/transaction/options') || url.pathname.endsWith('/personal/transaction-options')) {
      if (optionsMode === 'error') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 50300,
            message: '选项服务暂不可用',
            data: null,
          }),
        })
        return
      }
      data = optionsMode === 'missing' ? {} : optionsMode === 'empty' ? { entities: [], customers: [] } : { entities: [entity], customers: [customer] }
    } else if (url.pathname.endsWith('/entitlement-grant/options')) {
      data = {
        products: [{ id: 31, name: '三小时服务', price: '300.00' }],
        entities: [entity],
        customers: [customer],
        sync_transaction: false,
      }
    } else if (url.pathname.endsWith('/personal/entitlement-grant')) {
      personalGrantPayload = route.request().postDataJSON() as Record<string, unknown>
      data = {
        entitlement_ids: [102],
        entitlement_count: 1,
        transaction_id: null,
        order_id: null,
      }
    } else if (url.pathname.endsWith('/personal/entitlements')) {
      data = {
        total: 1,
        page: 1,
        limit: 20,
        list: [
          {
            id: 102,
            create_time: 1784563200,
            granted_quantity: '3.0000',
            consumed_quantity: '1.0000',
            available_quantity: '2.0000',
            unit_name: '小时',
            expire_time: 0,
            is_expired: false,
            is_exhausted: false,
            customer: { id: 8, name: '晚风顾客', avatar: null },
            service: { id: 6, name: '陪玩服务' },
            product: { id: 31, name: '三小时服务' },
          },
        ],
      }
    } else if (url.pathname.endsWith('/entitlement-grant')) {
      manualGrantPayload = route.request().postDataJSON() as Record<string, unknown>
      data = {
        entitlement_ids: [101],
        entitlement_count: 1,
        transaction_id: null,
        order_id: null,
      }
    } else if (url.pathname.endsWith('/service')) data = { list: [], total: 0, page: 1, limit: 20 }
    else if (url.pathname.endsWith('/transaction/stats')) {
      const type = url.searchParams.get('type')
      statsRequests.push(url.search)
      if (type === statsFailureType) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 50300,
            message: 'stats unavailable',
            data: null,
          }),
        })
        return
      }
      if (type === 'timeline')
        data =
          url.searchParams.get('granularity') === 'hour'
            ? [
                {
                  date: '2026-08-17 09:00',
                  count: 1,
                  amount: '320.00',
                  receipt_amount: '320.00',
                },
              ]
            : [
                {
                  date: '2026-08-05',
                  count: 1,
                  amount: '320.00',
                  receipt_amount: '320.00',
                },
              ]
      else if (type === 'byEntity')
        data = [
          {
            entity_id: 11,
            type: 'member',
            slug: 'handler',
            name: '青空接单人',
            count: 1,
            amount: 140,
          },
        ]
      else if (type === 'byCustomer')
        data = [
          {
            customer_id: 8,
            customer_name: '晚风顾客',
            count: 1,
            amount: 320,
          },
        ]
      else if (type === 'byAssignee')
        data = [
          {
            entity_id: 11,
            slug: 'handler',
            name: '青空接单人',
            customer_count: 1,
            transaction_count: 1,
            total_price: '320.00',
            total_cost: '80.00',
            team_cut: '100.00',
          },
        ]
      else if (type === 'byPerson') {
        const currentPage = Number(url.searchParams.get('page') ?? 1)
        const requestedLimit = Number(url.searchParams.get('limit') ?? 20)
        const people = Array.from({ length: currentPage === 1 ? Math.min(8, requestedLimit) : 1 }, (_, index) => ({
          entity_id: currentPage === 1 ? 11 + index : 31,
          slug: currentPage === 1 && index === 0 ? 'handler' : `member-${index + 1}`,
          name: currentPage === 1 && index === 0 ? '青空接单人' : currentPage === 1 ? `协作成员 ${index + 1}` : '第二页成员',
          avatar: null,
          handler_count: Math.max(0, 12 - index),
          sender_count: Math.max(0, 9 - index),
          handler_performance_total: String(3200 - index * 180),
          sender_performance_total: String(2800 - index * 160),
          income_total: String(1600 - index * 90),
        }))
        data = {
          total: 21,
          list: people,
          page: currentPage,
          limit: requestedLimit,
        }
      } else
        data = {
          total_count: 1,
          total_price: '320.00',
          receipt_total: '320.00',
          performance_total: '320.00',
          total_cost: '80.00',
          total_cut: '240.00',
          cash_total: '200.00',
          prepaid_total: '120.00',
          recharge_total: '480.00',
          avg_price: '320.00',
          service_receipt_count: 0,
          service_redemption_count: 0,
        }
    } else if (url.pathname.endsWith('/transaction/balance/logs'))
      data = {
        list: [
          {
            id: 5,
            customer_id: 8,
            type: 1,
            amount: 1200,
            balance_after: 1200,
            memo: '首次充值',
            create_time: 1784563200,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      }
    else if (url.pathname.endsWith('/transaction/21')) data = transaction
    else if (url.pathname.endsWith('/transaction')) data = { list: [transaction], total: 1, page: 1, limit: 20 }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  const routes = ['/overview', '/transactions', '/personal/transactions/new', '/detail?id=21', '/edit?id=21', '/stats', '/services', '/entitlements/new', '/balances', '/balance?customer_id=8', '/recharge?customer_id=8']
  for (const path of routes) {
    await page.goto(`http://demo.transaction.lostsky.work:5177${path}`)
    await expect(page.locator('#workspace'), `workspace missing at ${path}; ${pageErrors.join(' | ')}`).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 }).first(), `page heading missing at ${path}`).toBeVisible()
    if (path === '/detail?id=21') {
      await expect(page.locator('.facts').getByText('未知人员', { exact: true })).toHaveCount(0)
      await expect(page.locator('.facts').getByText('—', { exact: true })).toHaveCount(2)
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow, `horizontal overflow at ${path}`).toBe(false)
    if (['/transactions', '/balances'].includes(path)) await expect(page.locator('.ls-list-toolbar')).toBeVisible()
  }

  await page.goto('http://demo.transaction.lostsky.work:5177/transactions')
  await expect(page.getByText('晚风顾客', { exact: true })).toBeVisible()
  await expect(page.getByText('¥320.00', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /登记流水/ })).toHaveCount(0)
  await page.goto('http://demo.transaction.lostsky.work:5177/personal/transactions')
  await expect(page.getByRole('link', { name: /登记流水/ }).last()).toHaveAttribute('href', '/personal/transactions/new')
  await page.goto('http://demo.transaction.lostsky.work:5177/personal/transactions/new')
  await expect(page.getByText('金额平衡')).toBeVisible()
  await expect(page.getByRole('link', { name: '返回我的流水' })).toHaveAttribute('href', '/personal/transactions')
  await expect(page.getByRole('button', { name: '保存流水' })).toBeDisabled()
  optionsMode = 'missing'
  await page.goto('http://demo.transaction.lostsky.work:5177/personal/transactions/new')
  await expect(page.getByText('当前响应未提供主体选项')).toBeVisible()
  await expect(page.getByText('当前响应未提供顾客选项')).toBeVisible()
  await expect(page.getByRole('button', { name: '保存流水' })).toBeDisabled()
  optionsMode = 'empty'
  await page.goto('http://demo.transaction.lostsky.work:5177/personal/transactions/new')
  await expect(page.getByText('金额平衡')).toBeVisible()
  await expect(page.getByRole('button', { name: '保存流水' })).toBeDisabled()
  optionsMode = 'error'
  await page.goto('http://demo.transaction.lostsky.work:5177/personal/transactions/new')
  await expect(page.getByRole('alert')).toContainText('参与方选项暂时无法读取')
  await expect(page.getByText('金额平衡')).toBeVisible()
  await expect(page.getByRole('button', { name: '保存流水' })).toBeDisabled()
  optionsMode = 'full'
  await page.goto('http://demo.transaction.lostsky.work:5177/services')
  await expect(page.getByRole('link', { name: '赋予顾客权益' })).toHaveAttribute('href', '/entitlements/new')
  await page.getByRole('link', { name: '赋予顾客权益' }).click()
  await expect(page.locator('#workspace').getByRole('heading', { name: '赋予顾客权益', level: 1 })).toBeVisible()
  await expect(page.getByText('当前设置只赋予权益，不同步流水。')).toBeVisible()
  await page.locator('#grant-product').click()
  await page.getByText('三小时服务 · ¥300.00', { exact: true }).click()
  await page.locator('#grant-customer').click()
  await page.getByText('晚风顾客', { exact: true }).last().click()
  await page.getByRole('button', { name: '确认提交' }).click()
  await expect
    .poll(() => manualGrantPayload)
    .toEqual({
      product_id: 31,
      customer_id: 8,
      quantity: 1,
      sender_entity_id: 11,
      cs_entity_id: null,
    })
  await expect(page.locator('.grant-result')).toContainText('未创建商城订单；未同步流水')
  await page.goto('http://demo.transaction.lostsky.work:5177/personal')
  await page.locator('.ls-workspace-overview__entry').filter({ hasText: '权益下发' }).click()
  await expect(page).toHaveURL(/\/personal\/entitlements$/)
  await expect(page.locator('#workspace').getByRole('heading', { name: '权益下发', level: 1 })).toBeVisible()
  await expect(page.getByText('陪玩服务', { exact: true })).toBeVisible()
  await expect(page.getByText('三小时服务', { exact: true })).toBeVisible()
  await expect(page.locator('.ls-responsive-data-table')).toContainText('2 小时')
  await page.getByRole('link', { name: '下发权益' }).click()
  await expect(page).toHaveURL(/\/personal\/entitlements\/new$/)
  await expect(page.locator('#workspace').getByRole('heading', { name: '下发顾客权益', level: 1 })).toBeVisible()
  await expect(page.locator('#grant-sender')).toHaveCount(0)
  await expect(page.getByText('发单人固定为当前人员')).toBeVisible()
  await page.locator('#grant-product').click()
  await page.getByText('三小时服务 · ¥300.00', { exact: true }).click()
  await page.locator('#grant-customer').click()
  await page.getByText('晚风顾客', { exact: true }).last().click()
  await page.getByRole('button', { name: '下发权益' }).click()
  await expect
    .poll(() => personalGrantPayload)
    .toEqual({
      product_id: 31,
      customer_id: 8,
      quantity: 1,
      cs_entity_id: null,
    })
  await expect(page.locator('.grant-result')).toContainText('未创建商城订单；未同步流水')
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 })
    await page.goto('http://demo.transaction.lostsky.work:5177/personal/transactions/new')
    await expect(page.locator('#workspace')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `horizontal overflow at ${width}px`).toBe(false)
    if (width < 768) await expect(page.getByRole('button', { name: '操作' })).toBeVisible()
    else await expect(page.locator('#workspace').getByRole('heading', { name: '登记流水' })).toBeVisible()
    await page.goto('http://demo.transaction.lostsky.work:5177/entitlements/new')
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `entitlement grant horizontal overflow at ${width}px`).toBe(false)
    await page.goto('http://demo.transaction.lostsky.work:5177/personal/entitlements/new')
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `personal entitlement grant horizontal overflow at ${width}px`).toBe(false)
    await page.goto('http://demo.transaction.lostsky.work:5177/personal/entitlements')
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `personal entitlement history horizontal overflow at ${width}px`).toBe(false)
    await page.goto('http://demo.transaction.lostsky.work:5177/stats')
    await expect(page.getByText('实际流水', { exact: true }).first(), pageErrors.join(' | ')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `stats horizontal overflow at ${width}px`).toBe(false)
  }
  const reviewViewport = testInfo.project.name === 'mobile-chromium' ? { width: 390, height: 844 } : { width: 1440, height: 1000 }
  await page.setViewportSize(reviewViewport)
  await page.goto('http://demo.transaction.lostsky.work:5177/stats')
  await expect(page.locator('.person-performance')).toBeVisible()
  const handlerQuantity = page.locator('.rankings article').filter({ has: page.getByRole('heading', { name: '接单数量' }) })
  await expect(handlerQuantity.getByText('按接单数量从高到低')).toBeVisible()
  await expect(handlerQuantity.getByText('1 笔', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '接单人分成' })).toHaveCount(0)
  await page.screenshot({
    path: `.impeccable/review/${testInfo.project.name === 'mobile-chromium' ? 'mobile.png' : 'desktop.png'}`,
    fullPage: true,
  })
  if (testInfo.project.name === 'mobile-chromium') {
    await page.locator('.mobile-sort .n-select').click()
    await page.locator('.n-base-select-option').nth(2).click()
    await expect.poll(() => statsRequests.some((request) => request.includes('sort_by=sender_count'))).toBe(true)
    await page.locator('.mobile-sort .n-radio-button').nth(1).click()
    await expect.poll(() => statsRequests.some((request) => request.includes('sort_by=sender_count') && request.includes('sort_order=asc'))).toBe(true)
  }
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('http://demo.transaction.lostsky.work:5177/stats')
  await expect(page.getByText('实际流水', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('新增预存', { exact: true })).toBeVisible()
  await expect(page.getByText('¥480.00', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '发单业绩' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '人员业绩明细' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: '接单业绩' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: '发单业绩' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: '个人收入' })).toBeVisible()
  await expect(page.locator('.person-performance').getByText('青空接单人', { exact: true }).first()).toBeVisible()
  const toolbar = page.locator('.period-toolbar')
  const navigator = page.locator('.period-navigator')
  const expectNavigatorCentered = async () => {
    const [toolbarBox, navigatorBox] = await Promise.all([toolbar.boundingBox(), navigator.boundingBox()])
    expect(toolbarBox).not.toBeNull()
    expect(navigatorBox).not.toBeNull()
    expect(Math.abs(navigatorBox!.x + navigatorBox!.width / 2 - (toolbarBox!.x + toolbarBox!.width / 2))).toBeLessThanOrEqual(1)
  }
  await page.locator('.period-toolbar .n-radio-button').filter({ hasText: /^日$/ }).click()
  await expect.poll(() => statsRequests.some((request) => request.includes('granularity=hour'))).toBe(true)
  await expectNavigatorCentered()
  await page.locator('.period-toolbar .n-radio-button').filter({ hasText: /^周$/ }).click()
  await expect.poll(() => statsRequests.some((request) => request.includes('granularity=day'))).toBe(true)
  await expectNavigatorCentered()
  await page.locator('.period-toolbar .n-radio-button').filter({ hasText: /^月$/ }).click()
  await expectNavigatorCentered()
  await page.getByRole('columnheader', { name: /派单数/ }).click()
  await expect.poll(() => statsRequests.some((request) => request.includes('sort_by=sender_count'))).toBe(true)
  await page.getByRole('columnheader', { name: /个人收入/ }).click()
  await expect.poll(() => statsRequests.some((request) => request.includes('sort_by=income_total'))).toBe(true)
  await page.locator('.n-pagination-item').filter({ hasText: /^2$/ }).click()
  await expect(page.getByText('第二页成员')).toBeVisible()
  statsFailureType = 'byCustomer'
  await page.locator('.period-navigator button').first().click()
  await expect(page.locator('.rankings .ls-async-state')).toHaveCount(1)
  await expect(page.locator('.person-performance')).toBeVisible()
  await expect(page.locator('.tick-ranking')).toBeVisible()
  statsFailureType = null
  await page.setViewportSize({ width: 1024, height: 900 })
  await page.locator('html').evaluate((element) => {
    element.style.fontSize = '200%'
  })
  const overflowingElements = await page.locator('.stats-view').evaluate((root) => {
    const rootRect = root.getBoundingClientRect()
    return [...root.children]
      .map((element) => ({
        element: element as HTMLElement,
        rect: element.getBoundingClientRect(),
      }))
      .filter(({ rect }) => rect.width > 0 && (rect.right > rootRect.right + 1 || rect.left < rootRect.left - 1))
      .map(({ element, rect }) => ({
        element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${[...element.classList].map((name) => `.${name}`).join('')}`,
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
      }))
  })
  expect(overflowingElements, 'stats overflow at 200% text size').toEqual([])
  expect(pageErrors).toEqual([])
})

test('personal transaction list opens a scoped read-only detail route', async ({ page }) => {
  const actorToken = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamMember', id: 11 } })).toString('base64url')}.x`
  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: actorToken,
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
  const requestedPaths: string[] = []
  const transaction = {
    id: 21,
    handler_entity_id: 11,
    sender_entity_id: null,
    cs_entity_id: null,
    customer_id: 8,
    type: 2,
    total_price: 320,
    cost: 80,
    cash: 200,
    prepaid: 120,
    handler_cut: 140,
    sender_cut: 0,
    cs_cut: 0,
    team_cut: 100,
    trans_at: 1784563200,
    memo: '七月陪玩服务',
    handler: { id: 11, type: 'member', name: '青空接单人' },
    customer: { id: 8, nickname: '晚风顾客' },
  }
  await page.route('http://demo.transaction.lostsky.work:5177/api/**', async (route) => {
    const url = new URL(route.request().url())
    requestedPaths.push(url.pathname)
    let data: unknown = null
    if (url.pathname.endsWith('/workspace/access')) {
      data = {
        team: { id: 1, slug: 'demo', name: '青空团队' },
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
    } else if (url.pathname.endsWith('/personal/stats')) {
      data = {
        handler_count: 1,
        sender_count: 0,
        cs_count: 0,
        monthly_performance_total: '140.00',
        monthly_flow_total: '320.00',
        performance_total: '140.00',
      }
    } else if (url.pathname.endsWith('/personal/transactions/21')) {
      data = transaction
    } else if (url.pathname.endsWith('/personal/transactions')) {
      data = { list: [transaction], total: 1, page: 1, limit: 20 }
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })

  await page.goto('http://demo.transaction.lostsky.work:5177/personal/transactions')
  const personalDetailLink = page.getByRole('link', {
    name: '查看流水 21 详情',
  })
  await expect(personalDetailLink).toHaveAttribute('href', '/personal/transactions/21')
  await personalDetailLink.click()
  await expect(page).toHaveURL(/\/personal\/transactions\/21$/)
  await expect(page.locator('#workspace').getByRole('heading', { name: '流水详情', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '返回我的流水' })).toHaveAttribute('href', '/personal/transactions')
  await expect(page.getByRole('link', { name: '编辑' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '删除' })).toHaveCount(0)
  expect(requestedPaths).toContain('/api/personal/transactions/21')
  expect(requestedPaths).not.toContain('/api/transaction/21')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
})
