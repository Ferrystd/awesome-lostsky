import path from 'node:path'
import { seedTeamIdentity } from './first-paint-helpers'
import { expect, test, type Page } from './fixtures'

const origin = 'http://demo.team.lostsky.work:5175'
const harness = path.resolve('tests/fixtures/mobile-layout-harness.ts').replaceAll('\\', '/')
async function mount(page: Page, query = '') {
  await page.route(`${origin}/mobile-layout-harness*`, route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><div id="app"></div><script type="module" src="/@fs/${harness}"></script></body></html>` }))
  await page.goto(`${origin}/mobile-layout-harness${query}`)
  await expect(page.locator('[data-template]')).toHaveCount(6)
}

test('模板双操作保持紧凑且搜索筛选同行', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await mount(page)
  for (const width of [320, 375, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    const layout = await page.evaluate(() => {
      const bounds = (element: Element) => { const b = element.getBoundingClientRect(); return { x: b.x, y: b.y, right: b.right, width: b.width, height: b.height, vertical: !!element.closest('.ls-page-header__actions') && getComputedStyle(element.parentElement!).flexDirection === 'column' } }
      const pairs = [...document.querySelectorAll('[data-template]')].map(section => [...section.querySelectorAll('a')].map(bounds))
      pairs.push([...document.querySelectorAll('.ls-resource-row__actions a')].map(bounds))
      pairs.push([...document.querySelectorAll('[data-command-pair] button')].map(bounds))
      const toolbars = [...document.querySelectorAll('[data-toolbar]')].map(section => ({ search: bounds(section.querySelector('input')!), filter: bounds(section.querySelector('.n-base-selection')!), box: bounds(section), count: bounds(section.querySelector('.ls-list-toolbar__count')!) }))
      return { pairs, toolbars, scroll: document.documentElement.scrollWidth, width: innerWidth }
    })
    expect(layout.scroll, `${width}px page overflow`).toBeLessThanOrEqual(width + 1)
    for (const pair of layout.pairs) {
      expect(pair).toHaveLength(2)
      if (pair[0].vertical) {
        expect(pair[1].y).toBeGreaterThanOrEqual(pair[0].y + pair[0].height)
        expect(pair[0].right).toBeCloseTo(pair[1].right, 0)
      } else {
        expect(Math.abs(pair[0].y - pair[1].y), `${width}px action row`).toBeLessThanOrEqual(1)
        expect(pair[0].right).toBeLessThanOrEqual(pair[1].x + 1)
      }
      for (const button of pair) expect(button.height).toBeGreaterThanOrEqual(44)
    }
    for (const toolbar of layout.toolbars) {
      expect(Math.abs(toolbar.search.y + toolbar.search.height / 2 - toolbar.filter.y - toolbar.filter.height / 2), `${width}px search/filter center`).toBeLessThanOrEqual(2)
      expect(toolbar.search.width).toBeGreaterThan(20)
      expect(toolbar.count.right).toBeLessThanOrEqual(toolbar.box.right + 1)
      expect(toolbar.box.height, `${width}px one-row toolbar`).toBeLessThanOrEqual(60)
    }
  }
  await expect(page.getByRole('button', { name: /暂停极光|播放极光/ })).toHaveCount(0)
  expect(errors).toEqual([])
})

test('模板长文案和200%文字保留完整动作及移动边界', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await mount(page, '?long=1&state=disabled')
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    const geometry = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      overflowing: [...document.querySelectorAll('main *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).map(el => ({ class: el.className, width: el.getBoundingClientRect().width, text: el.textContent?.slice(0, 40) })),
      clipped: [...document.querySelectorAll('[data-template] a, [data-primary] button')].filter(el => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1).map(el => el.textContent),
    }))
    expect(geometry.scroll, `${width}px zoom overflow ${JSON.stringify(geometry.overflowing)}`).toBeLessThanOrEqual(width + 1)
    expect(geometry.clipped).toEqual([])
  }
  await expect(page.locator('[data-primary] button')).toHaveAttribute('aria-disabled', 'true')
  await page.goto(`${origin}/mobile-layout-harness?state=loading`)
  await expect(page.locator('[data-primary] button')).toHaveAttribute('aria-busy', 'true')
  await expect(page.locator('[data-primary] button')).toBeDisabled()
})

test('实际人员页面的双入口和搜索筛选在移动端同行', async ({ page }) => {
  await seedTeamIdentity(page)
  const entity = { id: 1, slug: 'qingkong', entityable_type: 'teamMember', entityable_id: 1, profile: { name: '青空成员' } }
  await page.route(`${origin}/api/**`, async route => {
    const pathname = new URL(route.request().url()).pathname
    const data = pathname.endsWith('/access') ? { permissions: ['team'], team: { id: 1, name: '测试团队', slug: 'demo' }, identity: { type: 'teamMember', entity_id: 1, name: '青空成员', belongs_to_team: true, is_external: false } } : pathname.endsWith('/entity/index') ? { list: [entity] } : undefined
    expect(data, `unexpected fixture ${pathname}`).toBeDefined()
    await route.fulfill({ json: { code: 0, data } })
  })
  await page.goto(`${origin}/entities`)
  await expect(page.locator('.ls-resource-row')).toHaveCount(1)
  for (const width of [320, 375, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    const geometry = await page.evaluate(() => {
      const box = (selector: string) => { const b = document.querySelector(selector)!.getBoundingClientRect(); return { y: b.y, center: b.y + b.height / 2, height: b.height } }
      return { search: box('.ls-list-toolbar input'), filter: box('.ls-list-toolbar .n-base-selection'), actions: [...document.querySelectorAll('.ls-page-header__actions a')].map(el => el.getBoundingClientRect().y), collapsed: !!document.querySelector(".ls-page-navigation__trigger")?.getBoundingClientRect().width, title: box(".ls-page-header h1"), rowActions: [...document.querySelectorAll('.ls-resource-row__actions a')].map(el => el.getBoundingClientRect().y), scroll: document.documentElement.scrollWidth }
    })
    expect(geometry.scroll).toBeLessThanOrEqual(width + 1)
    expect(Math.abs(geometry.search.center - geometry.filter.center)).toBeLessThanOrEqual(2)
    expect(geometry.actions).toHaveLength(2)
    if (width <= 390) expect(geometry.collapsed).toBe(true)
    if (!geometry.collapsed) expect(geometry.actions[0]).toBe(geometry.actions[1])
    expect(geometry.rowActions).toHaveLength(2)
    expect(geometry.rowActions[0]).toBe(geometry.rowActions[1])
  }
  await expect(page.getByRole('button', { name: /暂停极光|播放极光/ })).toHaveCount(0)
})

test('页头主副标题紧凑成组且操作不遮挡', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const query of ['', '?long=1']) {
    await mount(page, query)
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const size of ['100%', '200%']) {
        await page.evaluate(async value => { document.documentElement.style.fontSize = value; await document.fonts.ready; await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame) }, size)
        const headers = await page.locator('[data-template] .ls-page-header > header').evaluateAll(elements => elements.map(header => {
          const rect = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, height: r.height } }
          const copy = header.querySelector('.ls-page-header__copy')!
          const title = header.querySelector('h1')!
          const actions = header.querySelector('.ls-page-header__actions')! as HTMLElement
          const description = header.querySelector('p')!
          const before = rect(description).y - rect(title).bottom
          const links = [...actions.querySelectorAll('a')].map(rect)
          const mobile = getComputedStyle(actions).flexDirection === 'column'
          actions.style.paddingBottom = '120px'
          const after = rect(description).y - rect(title).bottom
          actions.style.paddingBottom = ''
          return { header: rect(header), copy: rect(copy), actions: rect(actions), links, before, after, margin: parseFloat(getComputedStyle(description).marginTop), grouped: title.parentElement === description.parentElement, mobile, clipped: [...actions.querySelectorAll('a')].some(el => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) }
        }))
        expect(headers).toHaveLength(6)
        for (const geometry of headers) {
          expect(geometry.grouped).toBe(true)
          expect(geometry.before).toBeCloseTo(geometry.margin, 0)
          expect(geometry.after).toBeCloseTo(geometry.before, 0)
          expect(geometry.actions.right).toBeLessThanOrEqual(geometry.header.right + 1)
          expect(geometry.clipped).toBe(false)
          for (const link of geometry.links) expect(link.height).toBeGreaterThanOrEqual(44)
          if (geometry.mobile) {
            expect(geometry.links[1].y).toBeGreaterThanOrEqual(geometry.links[0].bottom)
            expect(geometry.links[0].right).toBeCloseTo(geometry.links[1].right, 0)
            expect(geometry.actions.right).toBeCloseTo(geometry.header.right, 0)
            if (geometry.actions.y < geometry.copy.bottom) {
              expect(geometry.actions.y).toBeCloseTo(geometry.copy.y, 0)
              expect(geometry.copy.right).toBeLessThanOrEqual(geometry.actions.x + 1)
            } else expect(geometry.actions.y).toBeGreaterThanOrEqual(geometry.copy.bottom)
            if (!query && size === '100%' && width <= 390) expect(geometry.actions.y, JSON.stringify({ width, size, query, geometry })).toBeCloseTo(geometry.copy.y, 0)
          } else {
            if (!query && size === '100%') expect(geometry.links[0].y).toBeCloseTo(geometry.links[1].y, 0)
            if (geometry.actions.y < geometry.copy.bottom) expect(geometry.copy.right).toBeLessThanOrEqual(geometry.actions.x + 1)
          }
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1)
      }
    }
  }
})

test('真实长表单命令完整可读且横向筛选可键盘访问', async ({ page }) => {
  await mount(page)
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const size of ['100%', '200%']) {
      await page.evaluate(value => { document.documentElement.style.fontSize = value }, size)
      const result = await page.evaluate(() => {
        const single = document.querySelector('[data-long-commands="single"] button')!
        return {
          button: single.getBoundingClientRect().width,
          container: single.parentElement!.getBoundingClientRect().width,
          clipped: [...document.querySelectorAll('[data-long-commands] button, [data-long-commands] .n-button__content')].filter(el => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1).map(el => ({ text: el.textContent, cls: el.className, width: el.clientWidth, sw: el.scrollWidth, height: el.clientHeight, sh: el.scrollHeight, ws: getComputedStyle(el).whiteSpace, display: getComputedStyle(el).display, h: getComputedStyle(el).height })),
          scroll: document.documentElement.scrollWidth,
        }
      })
      expect(result.button).toBeCloseTo(result.container, 0)
      expect(result.clipped).toEqual([])
      expect(result.scroll).toBeLessThanOrEqual(width + 1)
    }
  }
  const choices = page.locator('[data-toolbar="multiple"] .n-base-selection-label')
  await choices.first().focus()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(choices.last()).toBeFocused()
  expect(await choices.last().evaluate(el => {
    const box = el.getBoundingClientRect()
    const track = el.closest('.ls-list-toolbar__filters')!.getBoundingClientRect()
    return box.right > track.left && box.left < track.right
  })).toBe(true)
})
