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
  const rows = page.getByRole('list', { name: '文件列表' }).getByRole('listitem')
  await expect(rows).toHaveCount(3)
  await expect(rows.nth(0)).toContainText('来源人员')
  await expect(rows.nth(0)).toContainText('Markdown 上传')
  await expect(rows.nth(1)).toContainText('未知来源')
  await expect(rows.nth(0).locator('[title*="@source-member"]')).toBeVisible()
  await expect(rows.nth(0)).toContainText('2026')
  await expect(rows.nth(1).locator('dd')).toHaveText(['未记录', '未记录'])
  await expect(rows.nth(2)).toContainText('人员 #99（资料不可用）')
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    const content = await rows.nth(0).locator('.ls-resource-row__main').boundingBox()
    const action = await rows.nth(0).getByRole('button', { name: '打开', exact: true }).boundingBox()
    expect(content).not.toBeNull()
    expect(action).not.toBeNull()
    expect(action!.y >= content!.y + content!.height || action!.x >= content!.x + content!.width).toBe(true)
    if (width >= 1024) {
      expect((await rows.nth(0).boundingBox())!.height).toBeLessThan(180)
      const metadata = rows.nth(0).locator('.file-metadata > div')
      const source = await metadata.nth(0).boundingBox()
      const time = await metadata.nth(1).boundingBox()
      expect(Math.abs(source!.y + source!.height / 2 - time!.y - time!.height / 2)).toBeLessThan(2)
    }
  }
})
