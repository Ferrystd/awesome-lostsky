import { test, expect, type Page } from './fixtures'

const origin = process.env.CATEGORY_ORIGIN || 'http://demo.team.lostsky.work:5175'
const catalog = {
  groups: [
    { name: '团队能力', items: [{ key: 'team.ability.redeem', label: '兑换团队能力' }] },
    { name: '聊天', items: [{ key: 'chat.group.manage', label: '管理团队群聊' }, { key: 'chat.message.read', label: '查看聊天记录' }] },
    { name: '文档管理', items: [{ key: 'team.document.read', label: '查看全部文档' }] },
    { name: '人员管理', items: [] }, { name: '人员委托', items: [] },
  ],
  advanced_items: [{ key: 'team.ability', label: '覆盖 team.ability 下全部权限', covered_keys: ['team.ability.redeem'] }],
}
async function choose(page: Page, label: string) {
  const nav = page.getByRole('navigation', { name: '角色分类', exact: true })
  if (await nav.isVisible()) await nav.getByRole('button', { name: new RegExp(`^${label}`) }).click()
  else {
    const trigger = page.getByRole('combobox', { name: '角色分类', exact: true })
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('listbox', { name: '角色分类', exact: true })).toBeVisible()
    await page.getByRole('option', { name: new RegExp(`^${label}`) }).click()
  }
}
async function fixture(page: Page, mode = 'normal') {
  const state = { failSave: false, holdSave: false, releaseSave: () => {}, releaseRead: () => {}, payloads: [] as string[][], readRequests: 0 }
  const token = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamMember', id: 11 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  await page.route(`${origin}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = []
    let status = 200
    if (path.endsWith('/access')) data = { permissions: mode === 'restricted' ? [] : ['team.role.read', 'team.role.write'], abilities: {}, team: { id: 1, name: '青空团队', slug: 'demo' } }
    else if (path.endsWith('/role/get')) {
      state.readRequests++
      if (mode === 'loading') await new Promise<void>(resolve => { state.releaseRead = resolve })
      if (mode === 'error') status = 400
      data = mode === 'empty' ? null : { id: 1, name: '跨部门运营协作与服务管理角色', role_key: 'operations', description: '负责团队成员、文档与日常协作。', sort: 10, is_displayed: 0 }
      if (mode === 'revoked') {
        await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ code: 40300, message: 'denied', data: { kind: 'permission', required_any: ['team.role.read'] } }) })
        return
      }
    } else if (path.endsWith('/rolePermission/catalog')) data = catalog
    else if (path.endsWith('/rolePermission/index')) data = []
    else if (path.endsWith('/entity/options')) data = [{ type: 'teamVirtual', slug: 'helper', name: '协作助手' }]
    else if (path.endsWith('/rolePermission/save')) {
      state.payloads.push(route.request().postDataJSON().permission_keys)
      if (state.holdSave) await new Promise<void>(resolve => { state.releaseSave = resolve })
      if (state.failSave) status = 400
      data = null
    } else if (path.endsWith('/role/index')) data = [{ id: 1, name: '运营协作员', role_key: 'operations' }]
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ code: status === 200 ? 0 : 40000, message: status === 200 ? 'ok' : '保存失败，请稍后再试。', data }) })
  })
  return state
}

test('category pilot keeps all permission groups in one recoverable draft', async ({ page }) => {
  const state = await fixture(page)
  await page.goto(`${origin}/roles/1`)
  await expect(page.getByLabel('角色名称')).toBeVisible()
  await expect(page.locator('.team-scene')).toHaveCount(1)
  await page.getByLabel('角色名称').fill('未保存的新名称')
  await choose(page, '聊天')
  await page.getByRole('checkbox', { name: /管理团队群聊/ }).check()
  await choose(page, '人员委托')
  await page.getByLabel('选择权限目标').fill('helper')
  await page.getByRole('option', { name: /协作助手/ }).click()
  await page.getByRole('checkbox', { name: /领取指定人员身份/ }).check()
  await choose(page, '高级范围权限')
  await page.getByRole('checkbox', { name: /覆盖 team.ability/ }).check()
  await choose(page, '团队能力')
  await expect(page.getByRole('checkbox', { name: /兑换团队能力/ })).toBeDisabled()
  await choose(page, '角色资料')
  await expect(page.getByLabel('角色名称')).toHaveValue('未保存的新名称')
  await choose(page, '聊天')
  await expect(page.getByRole('checkbox', { name: /管理团队群聊/ })).toBeChecked()
  state.failSave = true
  await page.getByRole('button', { name: '保存权限', exact: true }).click()
  await page.getByRole('button', { name: '确认并保存', exact: true }).click()
  await expect.poll(() => state.payloads.length).toBe(1)
  expect(state.payloads[0].sort()).toEqual(['chat.group.manage', 'identity.virtual.helper.assume', 'team.ability'])
  await expect(page.locator('.advanced-confirm')).toBeVisible()
  await expect(page.getByRole('status', { name: '' }).filter({ hasText: '有未保存的权限修改' })).toBeVisible()
  await page.getByRole('button', { name: '返回检查', exact: true }).click()
  await choose(page, '人员委托')
  await expect(page.getByRole('checkbox', { name: /领取指定人员身份/ })).toBeChecked()
  state.failSave = false
  state.holdSave = true
  await page.getByRole('button', { name: '保存权限', exact: true }).click()
  await page.getByRole('button', { name: '确认并保存', exact: true }).click()
  await expect.poll(() => state.payloads.length).toBe(2)
  state.releaseSave()
  await expect(page.locator('.advanced-confirm')).not.toBeVisible()
  await choose(page, '聊天')
  await page.getByRole('checkbox', { name: /查看聊天记录/ }).check()
  await page.getByRole('button', { name: '保存权限', exact: true }).click()
  await expect.poll(() => state.payloads.length).toBe(3)
  await page.getByRole('checkbox', { name: /管理团队群聊/ }).uncheck()
  state.releaseSave()
  await expect(page.getByText('有未保存的权限修改', { exact: true })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: /管理团队群聊/ })).not.toBeChecked()
  await expect(page.getByRole('checkbox', { name: /查看聊天记录/ })).toBeChecked()
  page.once('dialog', dialog => dialog.dismiss())
  await page.getByRole('link', { name: '返回角色列表' }).click()
  await expect(page).toHaveURL(/\/roles\/1$/)
  await choose(page, '角色资料')
  await page.getByLabel('显示顺序').fill('')
  await expect(page.getByRole('button', { name: '保存资料' })).toHaveAttribute('aria-disabled', 'true')
})

test('category pilot owns responsive geometry and keeps adjacent routes unchanged', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('requestfailed', request => errors.push(`${request.method()} ${new URL(request.url()).pathname}`))
  await fixture(page)
  await page.goto(`${origin}/roles/1`)
  await expect(page.getByLabel('角色名称')).toBeVisible()
  for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    const box = await page.locator('.ls-category-page__body').evaluate(el => {
      const style = getComputedStyle(el)
      const grid = getComputedStyle(el.firstElementChild!)
      return { padding: parseFloat(style.paddingLeft), width: el.clientWidth - parseFloat(style.paddingLeft) * 2, columns: grid.gridTemplateColumns.split(' ').map(parseFloat), gap: parseFloat(grid.columnGap) }
    })
    expect(box.padding).toBe(width < 640 ? 12 : 20)
    expect(box.gap).toBe(24)
    if (box.width >= 768) {
      expect(box.columns[0]).toBe(184)
      await expect(page.getByRole('navigation', { name: '角色分类', exact: true })).toBeVisible()
      for (const item of await page.getByRole('navigation', { name: '角色分类', exact: true }).getByRole('button').all()) expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    } else await expect(page.getByRole('combobox', { name: '角色分类', exact: true })).toBeVisible()
    if (width === 375 || width === 1440) await page.screenshot({ path: testInfo.outputPath(`category-${width}.png`), fullPage: true })
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  const nav = page.getByRole('navigation', { name: '角色分类', exact: true })
  await nav.getByRole('button').first().focus()
  await page.keyboard.press('End')
  await expect(nav.getByRole('button').last()).toBeFocused()
  await expect(page.getByLabel('搜索高级范围权限')).toBeVisible()
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
  await expect(page.getByRole('combobox', { name: '角色分类', exact: true })).toBeVisible()
  await page.getByRole('combobox', { name: '角色分类', exact: true }).focus()
  await expect(page.getByRole('combobox', { name: '角色分类', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('listbox', { name: '角色分类', exact: true })).toBeVisible()
  await page.keyboard.press('ArrowUp')
  const mobileTrigger = page.getByRole('combobox', { name: '角色分类', exact: true })
  await expect.poll(() => mobileTrigger.getAttribute('aria-activedescendant')).toBeTruthy()
  const activeId = await mobileTrigger.getAttribute('aria-activedescendant')
  await expect(page.locator(`[id="${activeId}"]`)).toHaveAttribute('role', 'option')
  await expect(page.getByRole('option', { selected: true })).toContainText('高级范围权限')
  await page.keyboard.press('Escape')
  for (const width of [320, 768, 1920]) {
    await page.setViewportSize({ width, height: 1200 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.getByRole('button', { name: /暂停极光|播放极光/ })).not.toBeVisible()
  await page.goto(`${origin}/roles`)
  await expect(page.getByRole('list', { name: '角色列表' })).toBeVisible()
  await expect(page.locator('.ls-category-page')).toHaveCount(0)
  await expect(page.locator('.ls-theme-aurora')).toHaveCount(1)
  await page.goto(`${origin}/roles/new`)
  await expect(page.locator('.ls-theme-aurora')).toHaveCount(1)
  expect(errors).toEqual([])
})

for (const mode of ['loading', 'error', 'empty', 'restricted', 'revoked']) {
  test(`category pilot preserves navigation during ${mode}`, async ({ page }) => {
    const state = await fixture(page, mode)
    await page.goto(`${origin}/roles/1`)
    await expect(page.locator('.ls-category-page')).toBeVisible()
    if (mode === 'loading') await expect(page.locator('.ls-async-state')).toBeVisible()
    if (mode === 'error') await expect(page.locator('.ls-async-state[role="alert"]')).toContainText('暂时无法读取角色')
    if (mode === 'empty') await expect(page.locator('.ls-empty-state')).toBeVisible()
    if (mode === 'restricted') expect(state.readRequests).toBe(0)
    if (mode === 'restricted' || mode === 'revoked') {
      await expect(page.getByLabel('角色名称')).toHaveValue('-')
      await expect(page.getByRole('button', { name: '保存资料' })).toHaveAttribute('aria-disabled', 'true')
    }
    await choose(page, '人员管理')
    if (mode === 'restricted' || mode === 'revoked') {
      await expect(page.locator('.ls-empty-state')).toContainText('team.role.read')
      await expect(page.getByRole('button', { name: '保存权限', exact: true })).toHaveAttribute('aria-disabled', 'true')
      await page.getByRole('button', { name: '保存权限', exact: true }).focus()
      await page.keyboard.press('Enter')
      expect(state.payloads).toEqual([])
    } else await expect(page.getByRole('button', { name: '保存权限', exact: true })).toHaveCount(0)
    state.releaseRead()
  })
}
