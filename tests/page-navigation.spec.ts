import path from 'node:path'
import { expect, test } from './fixtures'

test('次级页头导航在手机折叠且保留键盘和真实链接', async ({ page }) => {
  const origin = 'http://demo.team.lostsky.work:5175'
  const harness = path.resolve('tests/fixtures/mobile-layout-harness.ts').replaceAll('\\', '/')
  await page.route(`${origin}/page-navigation-harness*`, route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><div id="app"></div><script type="module" src="/@fs/${harness}"></script></body></html>` }))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${origin}/page-navigation-harness?navigation=1&long=1`)
  const trigger = page.getByRole('button', { name: 'More navigation', exact: true }).first()
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const size of ['100%', '200%']) {
      await page.evaluate(async value => { document.documentElement.style.fontSize = value; await document.fonts.ready; await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame) }, size)
      await expect(trigger).toBeVisible()
      const geometry = await trigger.evaluate(el => {
        const header = el.closest('header')!
        const title = header.querySelector('h1')!.getBoundingClientRect()
        const description = header.querySelector('p')!
        const box = el.getBoundingClientRect()
        return { width: box.width, height: box.height, gap: description.getBoundingClientRect().top - title.bottom, margin: parseFloat(getComputedStyle(description).marginTop), scroll: document.documentElement.scrollWidth }
      })
      expect(geometry.width).toBe(44)
      expect(geometry.height).toBe(44)
      expect(geometry.gap).toBeCloseTo(geometry.margin, 0)
      expect(geometry.scroll).toBeLessThanOrEqual(width)
      await trigger.focus()
      await page.keyboard.press('Enter')
      await expect(page.locator('.n-dropdown-menu a[href="/fields"]')).toBeVisible()
      await expect(page.locator('.n-dropdown-menu a[href="/virtuals"]')).toBeVisible()
      expect(await page.locator('.n-dropdown-menu').evaluate(el => el.getBoundingClientRect().right)).toBeLessThanOrEqual(width)
      await page.keyboard.press('Escape')
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await expect(trigger).toBeFocused()
    }
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = '100%' })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await expect(trigger).toBeHidden()
  await expect(page.locator('[data-template="0"] .ls-page-navigation__links a[href="/fields"]')).toBeVisible()
  await expect(page.locator('[data-primary] button')).toBeVisible()
})
