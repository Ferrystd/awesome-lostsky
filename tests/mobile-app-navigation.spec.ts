import { expect, test } from './fixtures'

const widths = [320, 375, 768, 1024, 1440]

test('account teams keeps creation with the shared heading at all widths and enlarged text', async ({ page }) => {
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/' }])
  await page.route('http://account.lostsky.work:5174/api/**', route => {
    const path = new URL(route.request().url()).pathname
    return route.fulfill({ json: { code: 0, message: 'ok', data: path.endsWith('/team/join-code') ? { code: '2CB8E11907E21E313B94', expires_at: 4102444800 } : [] } })
  })
  await page.goto('http://account.lostsky.work:5174/teams')
  await expect(page.getByText('还没有工作空间')).toBeVisible()
  for (const scale of [1, 2]) for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 })
    await page.evaluate(scale => { document.documentElement.style.fontSize = `${16 * scale}px` }, scale)
    const heading = page.getByRole('heading', { name: '我的团队', exact: true })
    const action = page.getByRole('button', { name: '新建团队', exact: true })
    const description = page.getByText('选择要进入的团队', { exact: true })
    const box = (await action.boundingBox())!
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(box.y).toBeLessThan((await page.locator('.join-code').boundingBox())!.y)
    if (width < 640 && scale === 1) expect(Math.abs(box.y - (await description.boundingBox())!.y)).toBeLessThan(2)
    expect((await heading.boundingBox())!.y).toBeLessThanOrEqual(box.y)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  }
  await page.getByRole('button', { name: '新建团队', exact: true }).click()
  await expect(page.getByRole('textbox', { name: '团队名称' })).toBeVisible()
})

test('workspace app picker exposes current app, icons, focus and navigation without overflow', async ({ page }) => {
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/' }])
  await page.route('http://demo.team.lostsky.work:5175/api/**', route => route.fulfill({ json: { code: 0, message: 'ok', data: { permissions: [], abilities: {} } } }))
  await page.goto('http://demo.team.lostsky.work:5175/entities')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const scale of [1, 2]) for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 })
    await page.evaluate(scale => { document.documentElement.style.fontSize = `${16 * scale}px` }, scale)
    if (width < 768) {
      const trigger = page.getByRole('button', { name: '切换应用', exact: true })
      await trigger.click()
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      const panel = page.getByRole('navigation', { name: '切换应用' })
      await expect(panel).toBeVisible()
      const entries = panel.getByRole('button')
      await expect(entries).toHaveCount(6)
      await expect(panel.locator('[aria-current=true]')).toContainText('团队')
      await expect(panel.locator('[aria-current=true]')).toBeFocused()
      for (const entry of await entries.all()) {
        expect((await entry.boundingBox())!.height).toBeGreaterThanOrEqual(44)
        expect(await entry.locator('svg').count()).toBeGreaterThanOrEqual(1)
      }
      const bounds = (await panel.boundingBox())!
      expect(bounds.x).toBeGreaterThanOrEqual(0)
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
      await page.keyboard.press('Escape')
      await expect(trigger).toBeFocused()
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  }
  await page.setViewportSize({ width: 375, height: 812 })
  await page.getByRole('button', { name: '切换应用' }).click()
  await page.getByRole('navigation', { name: '切换应用' }).getByRole('button', { name: '团队' }).click()
  await expect(page).toHaveURL('http://demo.team.lostsky.work:5175/')
})
