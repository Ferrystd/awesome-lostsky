import { expect, test, type Page } from './fixtures'

const origin = process.env.TEAM_TEST_ORIGIN ?? 'http://demo.team.lostsky.work:5175'
async function noticesFixture(page: Page) {
  await page.context().addCookies([{ name: 'lostsky_token', value: `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: 'team', id: 1 } })).toString('base64url')}.x`, domain: '.lostsky.work', path: '/' }])
  const model = { permissions: ['team.notice.read', 'team.notice.send'], requests: [] as string[], confirmations: [] as { id: number; scope: string }[], marked: new Set<string>(), hold: false, fail: false, release: undefined as (() => void) | undefined, detailHold: '', releaseDetail: undefined as (() => void) | undefined, listMode: 'normal' as 'normal' | 'empty' | 'error' }
  await page.route(`${origin}/api/**`, async route => {
    const url = new URL(route.request().url())
    const scope = url.searchParams.get('scope') ?? 'team'
    model.requests.push(`${route.request().method()} ${url.pathname}${url.search}`)
    let data: unknown
    if (url.pathname.endsWith('/access')) data = { permissions: model.permissions, abilities: {}, identity: { type: 'team', entity_id: 1 } }
    else if (url.pathname.endsWith('/notice/confirmAll')) {
      const body = route.request().postDataJSON()
      if (model.hold) await new Promise<void>(resolve => { model.release = resolve })
      if (model.fail) return route.fulfill({ json: { code: 500, message: `${body.scope} 原分类标记失败` } })
      model.marked.add(body.scope)
      data = null
    } else if (url.pathname.endsWith('/notice/confirm')) {
      const body = route.request().postDataJSON()
      model.confirmations.push(body)
      model.marked.add(`${body.scope}:${body.id}`)
      data = null
    } else if (url.pathname.endsWith('/notice/get')) {
      if (model.detailHold === scope) await new Promise<void>(resolve => { model.releaseDetail = resolve })
      const id = Number(url.searchParams.get('id'))
      data = { id, title: `${scope} 通知详情`, content: '通知正文', is_read: model.marked.has(`${scope}:${id}`) ? 1 : 0 }
    } else if (url.pathname.endsWith('/notice/index')) {
      if (model.listMode === 'error') return route.fulfill({ json: { code: 500, message: '通知暂时无法读取' } })
      if (model.listMode === 'empty') return route.fulfill({ json: { code: 0, data: { list: [], total: 0 } } })
      const keyword = url.searchParams.get('keyword') ?? ''
      data = { total: 60, list: Array.from({ length: 20 }, (_, index) => ({ id: index + 1, title: `${keyword} ${scope} 通知 ${index + 1} 长标题用于检验换行`, content: '这里是通知摘要，描述安排与需要完成的事项。'.repeat(8), is_read: model.marked.has(scope) || model.marked.has(`${scope}:${index + 1}`) ? 1 : 0, create_time: 1791500000 })) }
    } else return route.abort('blockedbyclient')
    await route.fulfill({ json: { code: 0, data } })
  })
  return model
}

test('notice URL state, detail return and category links survive refresh and browser history', async ({ page }) => {
  const model = await noticesFixture(page)
  await page.goto(`${origin}/notices/team?keyword=窗口&filter=unread&page=2`)
  const search = page.getByRole('searchbox', { name: '搜索站内通知' })
  await expect(search).toHaveValue('窗口')
  await expect(page.locator('.ls-resource-row')).toHaveCount(20)
  const link = page.locator('.ls-resource-row a').nth(14)
  await expect(link).toHaveAttribute('href', /detail\?id=15&keyword=.*&filter=unread&page=2/)
  // Real anchors carry a complete, same-scope return context even in a fresh tab.
  const href = await link.getAttribute('href')
  await link.scrollIntoViewIfNeeded()
  const scroll = await page.evaluate(() => window.scrollY)
  await link.click()
  await expect(page.getByRole('link', { name: '返回站内通知列表' })).toHaveAttribute('href', /\/notices\/team\?keyword=.*&filter=unread&page=2/)
  await page.getByRole('link', { name: '返回站内通知列表' }).click()
  await expect(search).toHaveValue('窗口')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(scroll, 0)
  const fresh = await page.context().newPage()
  await noticesFixture(fresh)
  await fresh.goto(`${origin}${href}`)
  await expect(fresh.getByRole('link', { name: '返回站内通知列表' })).toHaveAttribute('href', /filter=unread&page=2/)
  await fresh.close()
  await page.reload()
  await expect(search).toHaveValue('窗口')
  await search.fill('维护')
  await expect(page).toHaveURL(/keyword=.*filter=unread$/)
  await expect.poll(() => model.requests.filter(value => value.includes('/notice/index')).at(-1)).toContain('page=1')
  await page.setViewportSize({ width: 1920, height: 1080 })
  const nav = page.getByRole('navigation', { name: '通知分类' })
  await expect(nav.getByRole('link', { name: '已发送通知' })).toHaveAttribute('href', '/notices/sent')
  await nav.getByRole('link', { name: '已发送通知' }).click()
  await expect(page.getByRole('searchbox', { name: '搜索已发送通知' })).toHaveValue('')
  await page.goBack()
  await expect(search).toHaveValue('维护')
  await page.goForward()
  await expect(page).toHaveURL(/\/notices\/sent$/)
})

test('notice read mutations keep their origin scope and confirmed detail does not confirm twice after reload', async ({ page }) => {
  const model = await noticesFixture(page)
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto(`${origin}/notices/team`)
  model.hold = true
  model.fail = true
  await page.getByRole('button', { name: '全部标为已读' }).click()
  await expect.poll(() => Boolean(model.release)).toBe(true)
  await page.getByRole('navigation', { name: '通知分类' }).getByRole('link', { name: '已发送通知' }).click()
  await expect(page).toHaveURL(/\/notices\/sent$/)
  model.release!()
  await expect(page.locator('.notice-list-content')).not.toContainText('原分类标记失败')
  await page.goBack()
  await expect(page.locator('.notice-list-content')).toContainText('team 原分类标记失败')
  model.fail = false
  model.release = undefined
  await page.getByRole('button', { name: '全部标为已读' }).click()
  await expect.poll(() => Boolean(model.release)).toBe(true)
  await page.getByRole('navigation', { name: '通知分类' }).getByRole('link', { name: '已发送通知' }).click()
  await expect(page).toHaveURL(/\/notices\/sent$/)
  const sentReads = model.requests.filter(value => value.includes('/notice/index') && value.includes('scope=sent')).length
  model.release!()
  await expect.poll(() => model.marked.has('team')).toBe(true)
  await expect(page.locator('.ls-resource-row').first()).toContainText('未读')
  expect(model.requests.filter(value => value.includes('/notice/index') && value.includes('scope=sent'))).toHaveLength(sentReads)
  await page.goto(`${origin}/personal/notices/detail?id=1`)
  await expect(page.getByText('已读', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('已读', { exact: true })).toBeVisible()
  expect(model.confirmations).toEqual([{ id: 1, scope: 'entity' }])
  await page.goto(`${origin}/notices/sent/detail?id=1`)
  await expect(page.getByRole('heading', { name: 'sent 通知详情' })).toBeVisible()
  expect(model.confirmations).toEqual([{ id: 1, scope: 'entity' }])
})

test('notice center keeps responsive category semantics and permissions at large text sizes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const model = await noticesFixture(page)
  await page.goto(`${origin}/notices/team`)
  await expect(page.locator('.ls-resource-row')).toHaveCount(20)
  const aurora = await page.locator('.team-aurora-backdrop').evaluate(element => {
    const style = getComputedStyle(element)
    return { pointer: style.pointerEvents, animation: style.animationName, hidden: element.getAttribute('aria-hidden'), overflow: getComputedStyle(element.parentElement!).overflow }
  })
  expect(aurora).toMatchObject({ pointer: 'none', animation: 'none', hidden: 'true', overflow: 'visible' })
  // Navigation owns an opaque surface: contrast does not depend on the decorative light underneath.
  await page.setViewportSize({ width: 1920, height: 1100 })
  const contrast = await page.locator('.team-category-navigation').evaluate(element => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    const rgb = (color: string) => { context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1); return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map(value => value / 255) }
    const luminance = (color: number[]) => color.map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0)
    const base = getComputedStyle(element).backgroundColor
    return [...element.querySelectorAll('a, .team-category-navigation__label'), ...document.querySelectorAll('.notice-content-header .ls-page-primary-action')].map(node => {
      const style = getComputedStyle(node)
      const foreground = luminance(rgb(style.color))
      const background = luminance(rgb(style.backgroundColor === 'rgba(0, 0, 0, 0)' ? base : style.backgroundColor))
      return (Math.max(background, foreground) + .05) / (Math.min(background, foreground) + .05)
    })
  })
  expect(Math.min(...contrast)).toBeGreaterThanOrEqual(4.5)
  await test.info().attach('aurora-contrast.json', { body: JSON.stringify({ contrast, aurora }), contentType: 'application/json' })
  for (const fontSize of [16, 32]) for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1100 })
    await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px` }, fontSize)
    // Let responsive media/container queries commit before comparing separate geometry reads.
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
    const center = (await page.locator('.team-category-layout').boundingBox())!
    const header = (await page.locator('.ls-page-header').boundingBox())!
    expect(center.width).toBeCloseTo(header.width, 0)
    if (width === 1920 && fontSize === 16) expect(center.width).toBe(1440)
    const availableWidth = await page.locator('.team-category-layout').evaluate(element => element.clientWidth - parseFloat(getComputedStyle(element).paddingLeft) - parseFloat(getComputedStyle(element).paddingRight))
    const desktop = availableWidth >= 48 * fontSize
    await expect(page.locator('.team-category-navigation__desktop')).toBeVisible({ visible: desktop })
    await expect(page.locator('.team-category-navigation__mobile')).toBeVisible({ visible: !desktop })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${width}/${fontSize}`).toBe(true)
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = '16px' })
  await page.setViewportSize({ width: 1920, height: 1100 })
  const categoryLinks = page.getByRole('navigation', { name: '通知分类' }).getByRole('link')
  await categoryLinks.first().focus()
  await page.keyboard.press('ArrowDown')
  await expect(categoryLinks.nth(1)).toBeFocused()
  await expect(page).toHaveURL(/\/notices\/team$/)
  await page.keyboard.press('Home')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/notices\/sent$/)
  await page.setViewportSize({ width: 375, height: 1100 })
  await page.locator('.team-category-navigation__mobile .n-select').click()
  await page.locator('.n-base-select-menu:visible .n-base-select-option').filter({ hasText: '平台通知' }).click()
  await expect(page).toHaveURL(/\/notices\/team$/)
  await page.goto(`${origin}/personal/notices`)
  await expect(page.locator('#workspace').getByRole('heading', { name: '收件箱' })).toBeVisible()
  await expect(page.locator('.team-category-navigation')).toHaveCount(0)
  model.permissions = []
  await page.goto(`${origin}/notices/team`)
  await expect(page.locator('.ls-empty-state')).toBeVisible()
  await expect(page.locator('.ls-resource-row')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '全部标为已读' })).toHaveAttribute('aria-disabled', 'true')
})

test('late detail responses never confirm a notice under the newly selected scope', async ({ page }) => {
  const model = await noticesFixture(page)
  model.detailHold = 'entity'
  await page.goto(`${origin}/personal/notices/detail?id=1`)
  await expect.poll(() => Boolean(model.releaseDetail)).toBe(true)
  await page.evaluate(async () => { const { router } = await import(/* @vite-ignore */ '/src/router.ts'); await router.push('/notices/team/detail?id=2') })
  await expect(page.getByRole('heading', { name: 'team 通知详情' })).toBeVisible()
  await expect.poll(() => model.confirmations).toEqual([{ id: 2, scope: 'team' }])
  const oldResponse = page.waitForResponse(response => {
    const url = new URL(response.url())
    return url.pathname.endsWith('/notice/get') && url.searchParams.get('scope') === 'entity'
  })
  model.releaseDetail!()
  await (await oldResponse).finished()
  await expect.poll(() => page.evaluate(() => {
    const client = (document.querySelector('#app') as any).__vue_app__._context.provides.VUE_QUERY_CLIENT
    const state = client.getQueryState(['notice', 'entity', 1])
    return `${state?.status}:${state?.fetchStatus}`
  })).toBe('success:idle')
  await expect(page.getByRole('heading', { name: 'team 通知详情' })).toBeVisible()
  expect(model.confirmations).toEqual([{ id: 2, scope: 'team' }])
  await page.evaluate(async () => { const { router } = await import(/* @vite-ignore */ '/src/router.ts'); await router.push('/notices/sent/detail?id=3') })
  await expect(page.getByRole('heading', { name: 'sent 通知详情' })).toBeVisible()
  expect(model.confirmations).toEqual([{ id: 2, scope: 'team' }])
})

test('notice list error and empty states retain categories and invalid query cannot change return scope', async ({ page }) => {
  const model = await noticesFixture(page)
  model.listMode = 'empty'
  await page.goto(`${origin}/notices/team?keyword=a&keyword=b&page=-2&filter=wrong&scope=sent`)
  await expect(page.locator('.ls-empty-state')).toContainText('目前没有站内通知')
  await expect(page.getByRole('searchbox')).toHaveValue('')
  expect(model.requests.filter(value => value.includes('/notice/index')).at(-1)).toContain('scope=team&page=1')
  model.listMode = 'error'
  await page.reload()
  await expect(page.locator('.ls-async-state')).toContainText('通知暂时无法读取')
  await expect(page.locator('.team-category-navigation')).toBeVisible()
  await page.goto(`${origin}/notices/team/detail?id=1&return=https://example.org&keyword=a&keyword=b&page=Infinity`)
  await expect(page.getByRole('link', { name: '返回站内通知列表' })).toHaveAttribute('href', '/notices/team')
})
