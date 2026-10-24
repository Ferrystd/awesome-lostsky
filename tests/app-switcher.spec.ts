import path from 'node:path'
import { expect, test } from './fixtures'

test('手机应用面板保留应用语义、焦点和自适应布局，桌面导航不变', async ({ page }) => {
  const origin = process.env.APP_SWITCHER_ORIGIN || 'http://demo.team.lostsky.work:5175'
  const harness = path.resolve('tests/fixtures/app-switcher-harness.ts').replaceAll('\\', '/')
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route(`${origin}/app-switcher-harness*`, route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><div id="app"></div><script type="module" src="/@fs/${harness}"></script></body></html>` }))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const scope of ['team']) {
    await page.goto(`${origin}/app-switcher-harness?scope=${scope}`)
    const trigger = page.getByRole('button', { name: '切换应用', exact: true })
    const panel = page.getByRole('dialog', { name: '切换应用', exact: true })
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 })
      for (const fontSize of ['100%', '200%']) {
        await page.evaluate(value => { document.documentElement.style.fontSize = value }, fontSize)
        await expect(trigger).toBeVisible()
        expect(await trigger.innerText()).toBe('')
        const triggerBox = await trigger.boundingBox()
        expect(triggerBox?.width).toBe(44)
        expect(triggerBox?.height).toBe(44)
        await trigger.focus()
        await page.keyboard.press('Enter')
        await expect(panel).toBeVisible()
        await expect(panel.locator('[aria-current="true"]')).toBeFocused()
        await expect(panel.locator('.ls-workspace-apps__item')).toHaveText(['团队', '商品', '记账', '聊天', '微博'])
        const geometry = await panel.evaluate(el => {
          const grid = el.querySelector('nav')!
          const sheet = el.querySelector('.ls-workspace-apps')!
          const r = el.getBoundingClientRect()
          return { columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length, top: r.top, bottom: r.bottom, overflow: sheet.scrollWidth > sheet.clientWidth, scroll: document.documentElement.scrollWidth, items: [...grid.querySelectorAll('button')].map(button => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height, overflow: button.scrollWidth > button.clientWidth })) }
        })
        expect(geometry.columns).toBe(fontSize === '200%' ? 1 : width === 390 ? 3 : 2)
        expect(geometry.top).toBeGreaterThan(0)
        expect(geometry.bottom).toBe(844)
        expect(geometry.overflow).toBe(false)
        expect(geometry.scroll).toBeLessThanOrEqual(width)
        for (const item of geometry.items) {
          expect(item.width).toBeGreaterThanOrEqual(44)
          expect(item.height).toBeGreaterThanOrEqual(44)
          expect(item.overflow).toBe(false)
        }
        await panel.getByRole('button', { name: '微博', exact: true }).focus()
        await page.keyboard.press('Tab')
        await expect(panel.getByRole('button', { name: '关闭应用切换' })).toBeFocused()
        await page.keyboard.press('Escape')
        await expect(panel).toBeHidden()
        await expect(trigger).toBeFocused()
      }
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = '100%' })
    await trigger.click()
    await panel.getByRole('button', { name: '记账', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByText('当前人员暂不可用', { exact: true })).toBeVisible()
    await expect(panel).toBeVisible()
    await expect(page.locator('[data-selected]')).toBeEmpty()
    await panel.getByRole('button', { name: '商品', exact: true }).click()
    await expect(panel).toBeHidden()
    await expect(page.locator('[data-selected]')).toHaveText('shop')
    await expect(trigger).toBeFocused()
    await trigger.click()
    await page.locator('.n-drawer-mask').click({ position: { x: 10, y: 10 } })
    await expect(panel).toBeHidden()
    await expect(trigger).toBeFocused()
    await trigger.click()
    await panel.getByRole('button', { name: '关闭应用切换' }).click()
    await expect(panel).toBeHidden()
    await expect(trigger).toBeFocused()
    await page.setViewportSize({ width: 1440, height: 1000 })
    await expect(trigger).toBeHidden()
    const links = page.locator('.ls-workspace-header__desktop a')
    await expect(links).toHaveText(['团队', '商品', '记账', '聊天', '微博'])
    expect(await links.evaluateAll(elements => elements.map(el => el.getAttribute('href')))).toEqual(['/team', '/shop', '/transaction', '/chat', '/weibo'])
    for (const link of await links.all()) {
      await expect(link).toBeVisible()
      expect((await link.boundingBox())?.width).toBe(88)
    }
  }
  expect(errors).toEqual([])
})
