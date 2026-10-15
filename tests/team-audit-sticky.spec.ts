import { expect, test } from './fixtures'

for (const [width, scale] of [[320, 1], [375, 1], [768, 1], [1024, 1], [1440, 1], [375, 2]]) {
  test(`Team 审计日期吸顶与跨日顶替 ${width}px ${scale * 100}%`, async ({ page }) => {
    await page.setViewportSize({ width, height: 720 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/' }])
    const events = Array.from({ length: 20 }, (_, i) => ({
      id: 100 - i,
      create_time: Date.parse(i < 10 ? '2026-10-15T12:00:00+08:00' : '2026-10-14T12:00:00+08:00') / 1000 - i,
      application: 'team', application_label: '团队', action: 'update', action_label: '更新',
      resource_type: 'member', resource_label: '成员', resource_id: i + 1,
      actor: { authenticated_user_id: 1, entity_id: 1, entity_name: '跨组协作与夜间事务值班管理员', username: 'workspace-operations' },
      request_id: `sticky-fixture-${i}`,
    }))
    await page.route('http://demo.team.lostsky.work:5175/api/**', async route => {
      const pathname = new URL(route.request().url()).pathname
      const data = pathname.endsWith('/access')
        ? { permissions: ['team.audit.read'], abilities: {}, identity: { type: 'teamMember', belongs_to_team: true }, entry_warning: { required: false } }
        : pathname.endsWith('/audit/catalog')
          ? { applications: [{ value: 'team', label: '团队' }], actions: [], resource_types: [] }
          : pathname.endsWith('/audit/index') ? { total: 20, list: events, page: 1, limit: 20 } : null
      expect(data, `Unexpected fixture request: ${pathname}`).not.toBeNull()
      await route.fulfill({ json: { code: 0, message: 'ok', data } })
    })
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('http://demo.team.lostsky.work:5175/audit')
    await expect(page.locator('.audit-event-stream__event')).toHaveCount(20)
    await page.addStyleTag({ content: `html { scroll-behavior: auto !important; font-size: ${scale * 100}%; }` })
    const dates = page.locator('.audit-event-stream__date')
    await expect(dates).toHaveCount(2)
    const layout = await page.evaluate(() => {
      const headings = [...document.querySelectorAll<HTMLElement>('.audit-event-stream__date')]
      return { first: headings[0].getBoundingClientRect().top + scrollY, second: headings[1].getBoundingClientRect().top + scrollY }
    })
    await page.evaluate(y => window.scrollTo(0, y + 100), layout.first)
    await expect.poll(async () => (await dates.first().boundingBox())!.y).toBeCloseTo(0, 0)
    const surface = await dates.first().evaluate(node => {
      const box = node.getBoundingClientRect()
      return { color: getComputedStyle(node).backgroundColor, onTop: document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === node }
    })
    expect(surface.color).not.toBe('rgba(0, 0, 0, 0)')
    expect(surface.onTop).toBe(true)
    await page.evaluate(y => window.scrollTo(0, y - 10), layout.second)
    await expect.poll(async () => (await dates.first().boundingBox())!.y).toBeLessThan(0)
    const first = (await dates.first().boundingBox())!
    const second = (await dates.nth(1).boundingBox())!
    expect(first.y + first.height).toBeLessThanOrEqual(second.y)
    await page.evaluate(y => window.scrollTo(0, y + 100), layout.second)
    await expect.poll(async () => (await dates.nth(1).boundingBox())!.y).toBeCloseTo(0, 0)
    expect((await dates.first().boundingBox())!.y + first.height).toBeLessThanOrEqual(0)
    const link = page.locator('.audit-event-stream__link').nth(12)
    await link.evaluate(node => { (node as HTMLElement).focus(); node.scrollIntoView({ block: 'start' }) })
    await expect(link).toBeFocused()
    expect((await link.boundingBox())!.y).toBeGreaterThanOrEqual((await dates.nth(1).boundingBox())!.height)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    expect(errors).toEqual([])
  })
}
