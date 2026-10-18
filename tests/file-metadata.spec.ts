import { expect, test } from './fixtures'

test('file list shows recorded provenance and handles missing metadata without overflow', async ({ page }) => {
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = {}
    if (path.endsWith('/access')) data = { permissions: ['file.read', 'file.upload', 'file.delete'], abilities: {} }
    if (path.endsWith('/file/usage')) data = { count: 3, total_size: 1024, size_limit: 134217728, available: true }
    if (path.endsWith('/file/index')) data = { total: 3, list: [
      { id: 1, source: 'markdown', name: 'hero-bg.png', mime_type: 'image/png', size: 1024, url: 'https://example.com/file.png', create_time: 1789228800, entity_id: 7, subject: { name: '很长的来源人员名称'.repeat(8), slug: 'source-member', entityable_type: 'teamMember' } },
      { id: 2, name: 'legacy.png', size: 0, subject: null, create_time: null },
      { id: 3, name: 'unavailable.png', size: 0, subject: null, entity_id: 99, create_time: 'invalid' },
    ] }
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
  await page.goto('http://demo.team.lostsky.work:5175/files')
  const rows = page.locator('.file-directory > li')
  const details = page.locator('#file-details')
  await expect(rows).toHaveCount(3)
  await expect(details).toContainText('Markdown 上传')
  await expect(details.locator('[title*="@source-member"]')).toBeVisible()
  await expect(details).toContainText('2026')
  await rows.nth(1).getByRole('link', { name: 'legacy.png', exact: true }).click()
  await expect(details).toContainText('未知来源')
  await expect(details.locator('dd')).toHaveText(['未知来源', '未记录', '未记录'])
  await rows.nth(2).getByRole('link', { name: 'unavailable.png', exact: true }).click()
  await expect(details).toContainText('人员 #99（资料不可用）')
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    const main = await page.locator('.team-resource-workspace__main').boundingBox()
    const context = await page.locator('.team-resource-workspace__context').boundingBox()
    if (width < 640) expect(context!.y).toBeGreaterThanOrEqual(main!.y + main!.height)
    else expect(context!.x).toBeGreaterThan(main!.x + main!.width)
    await expect(rows.nth(0).getByRole('link', { name: '打开', exact: true })).toBeVisible()
  }
})
