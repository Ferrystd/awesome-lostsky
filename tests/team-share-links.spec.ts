import { expect, test } from './fixtures'

test('team share links group destinations and copying across both overviews and responsive sizes', async ({ page }) => {
  const token = `e2e.${Buffer.from(JSON.stringify({ act: { type: 'teamMember', id: 1 } })).toString('base64url')}.signature`
  await page.context().addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  let hasTeam = true
  await page.route('http://demo.team.lostsky.work:5175/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/access')
      ? { team: hasTeam ? { id: 1, slug: 'demo', name: '青空团队' } : null, permissions: [], abilities: {}, identity: { type: 'teamMember', entity_id: 1, name: '测试成员', belongs_to_team: true, is_external: false } }
      : path.endsWith('/personal') ? { identity: { entity_id: 1, type: 'teamMember', slug: 'member', name: '测试成员', team: { name: '青空团队' } }, profile: { name: '测试成员' }, custom_fields: [], custom_field_values: [], role_assignments: [], effective_permissions: [] }
      : path.endsWith('/dashboard') ? {} : []
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async (value: string) => { (window as any).__copiedLink = value },
    } })
  })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://demo.team.lostsky.work:5175/')
  const region = page.getByRole('region', { name: '本团队分享链接' })
  await expect(region).toBeVisible()
  const urls = ['https://demo.shop.lostsky.work/', 'https://demo.display.lostsky.work/', 'https://demo.team.lostsky.work/join']
  const items = region.getByRole('listitem')
  for (let index = 0; index < 3; index++) {
    const link = items.nth(index).getByRole('link')
    await expect(link).toHaveAttribute('href', urls[index])
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    await expect(link).toHaveAttribute('target', '_blank')
    await items.nth(index).getByRole('button').click()
    await expect.poll(() => page.evaluate(() => (window as any).__copiedLink)).toBe(urls[index])
  }
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const bounds = await items.evaluateAll(nodes => nodes.map(node => {
      const item = node.getBoundingClientRect()
      const link = node.querySelector('a')!.getBoundingClientRect()
      const button = node.querySelector('button')!.getBoundingClientRect()
      return { x: item.x, y: item.y, width: item.width, linkRight: link.right, buttonLeft: button.left, linkHeight: link.height, buttonHeight: button.height }
    }))
    for (const bound of bounds) {
      expect(bound.linkRight).toBeLessThanOrEqual(bound.buttonLeft)
      expect(bound.linkHeight).toBeGreaterThanOrEqual(44)
      expect(bound.buttonHeight).toBeGreaterThanOrEqual(44)
    }
    if (width >= 800) {
      expect(bounds[0].y).toBe(bounds[1].y)
      expect(Math.abs(bounds[0].width - bounds[1].width)).toBeLessThan(1)
    } else {
      expect(bounds[1].y).toBeGreaterThan(bounds[0].y)
      expect(bounds[0].x).toBe(bounds[1].x)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  }
  await page.setViewportSize({ width: 320, height: 900 })
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  expect(await region.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true)
  await page.evaluate(() => { document.documentElement.style.fontSize = '' })
  await items.first().getByRole('link').focus()
  await page.keyboard.press('Tab')
  await expect(items.first().getByRole('button')).toBeFocused()
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('denied') } })
  await page.keyboard.press('Enter')
  await expect(page.getByText('复制失败，请通过链接菜单复制地址', { exact: true })).toBeVisible()
  await expect(items.first().getByRole('link')).toHaveAttribute('href', urls[0])
  await page.goto('http://demo.team.lostsky.work:5175/personal')
  await expect(region).toBeVisible()
  await expect(region.getByRole('link')).toHaveCount(3)
  hasTeam = false
  await page.reload()
  await expect(region).toHaveCount(0)
  expect(errors).toEqual([])
})
