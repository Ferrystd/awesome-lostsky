import { expect, test } from './fixtures'

for (const scenario of ['review', 'auto', 'error', 'virtual']) {
  test(`Personal member departure: ${scenario}`, async ({ page }) => {
    const type = scenario === 'virtual' ? 'teamVirtual' : 'teamMember'
    const token = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type, id: 7 } })).toString('base64url')}.x`
    await page.context().addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/' }])
    let pending = false
    let failed = scenario === 'error'
    let reads = 0
    const writes: string[] = []
    await page.route('**/identity', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<h1>选择身份</h1>' }))
    await page.route('http://demo.team.lostsky.work:5175/api/**', async route => {
      const path = new URL(route.request().url()).pathname
      let data: unknown = {}
      if (path.endsWith('/access')) data = { permissions: [], abilities: {}, identity: { type } }
      if (path.endsWith('/personal')) data = { identity: { entity_id: 17, type, slug: 'member-seven', name: '成员七', team: { name: '测试团队' } }, profile: { name: '成员七' }, custom_fields: [], custom_field_values: [], role_assignments: [], effective_permissions: [] }
      if (path.endsWith('/memberDeparture/mine')) {
        reads++
        if (failed) return route.fulfill({ status: 500, json: { code: 1, message: '读取失败' } })
        data = pending ? [{ id: 31, status_code: 'applied' }] : []
      }
      if (path.endsWith('/memberDeparture/apply')) {
        writes.push('apply')
        pending = true
        data = { id: 31, status_code: scenario === 'auto' ? 'approved' : 'applied' }
      }
      if (path.endsWith('/memberDeparture/cancel')) {
        expect(route.request().postDataJSON()).toEqual({ id: 31 })
        writes.push('cancel')
        pending = false
      }
      await route.fulfill({ json: { code: 0, message: 'ok', data } })
    })
    await page.goto('http://demo.team.lostsky.work:5175/personal/profile')
    const panel = page.locator('.personal-view header').filter({ has: page.getByRole('heading', { name: '资料', exact: true }) })
    if (scenario === 'virtual') {
      await expect(page.getByRole('button', { name: '保存资料' })).toBeVisible()
      await expect(panel.getByRole('button', { name: '申请离职' })).toHaveCount(0)
      expect(reads).toBe(0)
      return
    }
    await expect(panel).toBeVisible()
    if (scenario === 'error') {
      await expect(panel.getByRole('button', { name: '重试读取申请' })).toBeVisible()
      await expect(panel.getByRole('button', { name: '申请离职' })).toHaveCount(0)
      failed = false
      await panel.getByRole('button', { name: '重试读取申请' }).click()
    }
    const apply = panel.getByRole('button', { name: '申请离职', exact: true })
    await expect(apply).toBeEnabled()
    expect((await apply.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    const buttonBox = (await apply.boundingBox())!
    const titleGroupBox = (await panel.locator('.ls-page-header__copy').boundingBox())!
    const panelBox = (await panel.boundingBox())!
    const formBox = (await page.locator('form.profile-form').boundingBox())!
    // Narrow headers may wrap actions below the complete title/description group.
    expect(buttonBox.x >= titleGroupBox.x + titleGroupBox.width
      || buttonBox.y >= titleGroupBox.y + titleGroupBox.height).toBe(true)
    expect(buttonBox.x + buttonBox.width).toBeCloseTo(panelBox.x + panelBox.width, 0)
    expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(formBox.y)
    await expect(page.getByRole('heading', { name: '离职申请', exact: true })).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    await apply.click()
    await page.getByRole('button', { name: '返回', exact: true }).click()
    expect(writes).toEqual([])
    const before = reads
    await apply.click()
    await page.getByRole('button', { name: '确认申请', exact: true }).click()
    if (scenario === 'auto') {
      await expect(page).toHaveURL(/account\.lostsky\.work(?::\d+)?\/identity$/)
      await expect(page.getByRole('heading', { name: '选择身份' })).toBeVisible()
      expect(reads).toBe(before)
    } else {
      await expect(panel.getByRole('button', { name: '取消离职申请' })).toBeVisible()
      await panel.getByRole('button', { name: '取消离职申请' }).click()
      await expect(apply).toBeEnabled()
      expect(writes).toEqual(['apply', 'cancel'])
    }
  })
}
