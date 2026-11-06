import { expect, test } from './fixtures'

test('workspace headers adapt to five six and more applications without losing keyboard access', async ({ page }) => {
  // Synthetic harness documents use a trustworthy loopback origin for local module access.
  const origin = 'http://127.0.0.1:5175'
  const modulePath = `/@fs/${process.cwd().replaceAll('\\', '/')}/tests/workspace-header-harness.ts`
  await page.route(`${origin}/header-harness`, route => route.fulfill({ contentType: 'text/html', body: '<meta name="viewport" content="width=device-width, initial-scale=1"><div id="app"></div>' }))
  for (const kind of ['team', 'shared'] as const) for (const count of [5, 6, 9]) await test.step(`${kind}: ${count} application entries`, async () => {
    await page.goto(`${origin}/header-harness`)
    await page.evaluate(async ({ modulePath, kind, count }) => {
      const harness = await import(/* @vite-ignore */ modulePath)
      harness.mountHeader(kind, count)
    }, { modulePath, kind, count })
    const header = page.locator('.ls-workspace-header')
    const entries = header.locator('.ls-workspace-header__desktop a')
    await expect(entries).toHaveCount(count)
    for (const width of [1440, 768]) {
      await page.setViewportSize({ width, height: 900 })
      const geometry = await header.evaluate(element => {
        const track = element.querySelector<HTMLElement>('.ls-workspace-header__desktop')!
        const boxes = [...track.children].map(item => item.getBoundingClientRect())
        return { rightInset: element.getBoundingClientRect().right - track.getBoundingClientRect().right,
          widths: boxes.map(box => box.width), heights: boxes.map(box => box.height),
          gaps: boxes.slice(1).map((box, index) => box.left - boxes[index].right),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }
      })
      expect(geometry.widths).toEqual(Array(count).fill(88))
      expect(geometry.gaps).toEqual(Array(count - 1).fill(8))
      expect(geometry.heights.every(height => height >= 44)).toBe(true)
      expect(geometry.rightInset).toBe(24)
      expect(geometry.overflow).toBeLessThanOrEqual(1)
      await entries.first().focus()
      for (let index = 1; index < count; index++) await page.keyboard.press('Tab')
      await expect(entries.last()).toBeFocused()
      await expect(entries.last()).toBeInViewport()
    }
    await page.setViewportSize({ width: 375, height: 900 })
    await expect(entries.first()).toBeHidden()
    await header.getByRole('button', { name: '切换应用', exact: true }).click()
    const panel = page.getByRole(kind === 'team' ? 'dialog' : 'navigation', { name: '切换应用', exact: true })
    await expect(panel.getByRole('button', { name: /应用 \d/ })).toHaveCount(count)
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(header.getByRole('button', { name: '切换应用', exact: true })).toBeFocused()
  })
})
