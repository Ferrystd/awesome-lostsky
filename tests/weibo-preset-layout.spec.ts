import { expect, test } from './fixtures'

const origin = 'http://demo.weibo.lostsky.work:5181'

test('preset list keeps actions together and readable at narrow and wide widths', async ({ page }, testInfo) => {
  const payload = Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamMember', id: 11 } })).toString('base64url')
  await page.context().addCookies([{ name: 'lostsky_token', value: `x.${payload}.x`, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  let content = '小宝看看123'
  await page.route(`${origin}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/workspace/access')
      ? { permissions: ['weibo.personal.use'], abilities: { weibo: { enabled: true, label: '微博' } }, identity: { entity_id: 11, name: '青空成员', type: 'teamMember', belongs_to_team: true, is_external: false } }
      : path.endsWith('/comment-presets')
        ? [{ id: 1, content, scope: 'personal' }]
        : null
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })

  await page.goto(`${origin}/personal/interactions/comment-presets`)
  const column = page.locator('.comment-presets-page')
  const header = column.locator('.ls-page-header')
  const toolbar = column.locator('.ls-list-toolbar')
  const row = column.locator('.preset-row')
  await expect(row).toHaveCount(1)
  await expect(header.getByRole('link', { name: '添加预设' })).toBeVisible()
  await expect(header.getByRole('button', { name: '编辑预设' })).toHaveCount(0)
  await expect(toolbar.getByRole('button', { name: '编辑预设' })).toBeVisible()
  await expect(toolbar).toContainText('共 1 条')

  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const pageBox = await page.locator('#workspace').boundingBox()
    const columnBox = await column.boundingBox()
    const rowBox = await row.boundingBox()
    const textBox = await row.locator('p').boundingBox()
    const rem = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize))
    expect(columnBox!.width).toBeLessThanOrEqual(52 * rem + 1)
    expect(Math.abs(columnBox!.x + columnBox!.width / 2 - pageBox!.x - pageBox!.width / 2)).toBeLessThanOrEqual(2)
    expect(textBox!.x - rowBox!.x).toBeGreaterThanOrEqual(16)
    expect(textBox!.x + textBox!.width).toBeLessThanOrEqual(rowBox!.x + rowBox!.width - 16)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    if (width === 375 || width === 1440) await page.screenshot({ path: testInfo.outputPath(`preset-${width}.png`), fullPage: true })
  }

  await page.setViewportSize({ width: 320, height: 900 })
  const zoom = await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  await zoom.evaluate(element => element.remove())

  content = '完整预设评论，'.repeat(70)
  await page.reload()
  await expect(row.locator('p')).toHaveText(content)
  const rowBox = await row.boundingBox()
  const textBox = await row.locator('p').boundingBox()
  expect(rowBox!.height).toBeGreaterThan(textBox!.height)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
})
