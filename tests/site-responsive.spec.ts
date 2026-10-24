import { expect, test } from './fixtures'

test('官网首屏导航同行、标题无孤字且移动菜单可用', async ({ page, isMobile }, testInfo) => {
  await page.route('**/api/site-content', route => route.fulfill({ json: { code: 0, data: { icp: '', members: [], stats: [] } } }))
  const widths = isMobile ? [320, 375, 440, 443, 720] : [1280]
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('http://127.0.0.1:5173')
    await page.evaluate(() => document.fonts.ready)
    for (const scale of isMobile ? [1, 2] : [1]) {
      await page.evaluate(value => { document.documentElement.style.fontSize = `${16 * value}px` }, scale)
      const geometry = await page.evaluate(() => {
        const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect().toJSON()
        const heading = document.querySelector('#hero-title')!
        const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT)
        const lines = new Map<number, string>()
        while (walker.nextNode()) {
          const node = walker.currentNode
          for (let i = 0; i < (node.textContent?.length ?? 0); i++) {
            const range = document.createRange()
            range.setStart(node, i)
            range.setEnd(node, i + 1)
            const box = range.getBoundingClientRect()
            const key = Math.round(box.top)
            lines.set(key, (lines.get(key) ?? '') + node.textContent![i])
          }
        }
        return { logo: rect('.wordmark'), trial: rect('.contact-link'), menu: rect('.menu-button'), header: rect('.navbar'), heading: rect('#hero-title'), lines: [...lines.values()], overflow: document.documentElement.scrollWidth > innerWidth }
      })
      await testInfo.attach(`geometry-${width}-${scale}`, { body: JSON.stringify(geometry), contentType: 'application/json' })
      expect(geometry.overflow, `${width}px / ${scale}x`).toBe(false)
      expect(geometry.lines.every(line => line.trim().length > 1), JSON.stringify(geometry.lines)).toBe(true)
      expect(geometry.heading.top).toBeGreaterThanOrEqual(geometry.header.bottom)
      if (scale === 1) {
        if (isMobile) expect(geometry.lines).toEqual(['重塑陪玩生态', '数字化转型团队'])
        if (width === 443 || width === 1280) await testInfo.attach(`homepage-${width}`, { body: await page.screenshot(), contentType: 'image/png' })
        expect(Math.abs((geometry.logo.top + geometry.logo.height / 2) - (geometry.trial.top + geometry.trial.height / 2))).toBeLessThan(2)
        if (isMobile) {
          expect(Math.abs(geometry.menu.top - geometry.trial.top)).toBeLessThan(2)
          expect(geometry.logo.right).toBeLessThanOrEqual(geometry.trial.left)
          expect(geometry.trial.right).toBeLessThanOrEqual(geometry.menu.left)
        }
      }
      if (isMobile) {
        const toggle = page.getByRole('button', { name: '切换网站导航' })
        await toggle.click()
        await expect(toggle).toHaveAttribute('aria-expanded', 'true')
        const menu = page.locator('#site-navigation')
        await expect(menu).toBeVisible()
        await expect.poll(async () => (await menu.boundingBox())!.y).toBeGreaterThanOrEqual(geometry.header.bottom - 1)
        await menu.locator('a[href="#services"]').click()
        await expect(toggle).toHaveAttribute('aria-expanded', 'false')
        await page.evaluate(() => window.scrollTo(0, 0))
      }
    }
  }
})
