import { expect, test, type Page } from './fixtures'

const origin = 'http://demo.team.lostsky.work:5175'
async function mockTeam(page: Page) {
  const token = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'team', id: 1 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/' }])
  const writes: string[] = []
  await page.route(`${origin}/api/**`, async route => {
    const pathname = new URL(route.request().url()).pathname
    if (route.request().method() !== 'GET') writes.push(pathname)
    const data = pathname.endsWith('/access') ? { permissions: ['team'], abilities: {}, identity: { type: 'team' } }
      : pathname.endsWith('/role/get') ? { id: 7, name: '可读且足够长的团队协作角色名称', role_key: 'editor', sort: 1, description: '', is_displayed: 0 }
      : pathname.endsWith('/rolePermission/index') ? []
      : pathname.endsWith('/rolePermission/catalog') ? { groups: [{ name: '文档权限', items: [{ key: 'team.doc.read', label: '阅读文档' }] }], advanced_items: [] }
      : { list: [], total: 0 }
    await route.fulfill({ json: { code: 0, data } })
  })
  return writes
}

async function checkLayout(page: Page) {
  const layout = page.locator('.team-category-layout')
  const box = await layout.boundingBox()
  expect(box!.width).toBeLessThanOrEqual(1024)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  const toolbar = page.locator('.ls-list-toolbar')
  if (await toolbar.count()) {
    expect(await toolbar.evaluate(node => getComputedStyle(node).borderTopWidth)).toBe('0px')
    expect(await toolbar.evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgba(0, 0, 0, 0)')
  }
  await expect(page.getByRole('button', { name: /播放极光|暂停极光/ })).toHaveCount(0)
}

test('Unified review categories preserve keyboard routes, mobile combobox semantics and lightweight toolbar', async ({ page }) => {
  await mockTeam(page)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${origin}/join-review`)
  await expect(page.getByRole('heading', { name: '人事审核', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: '申请表配置', exact: true })).toHaveAttribute('href', '/join-fields')
  await checkLayout(page)
  const mobile = page.getByRole('combobox', { name: '审核分类', exact: true })
  if (await mobile.isVisible()) {
    await mobile.focus()
    await page.keyboard.press('Enter')
    await expect(mobile).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('listbox', { name: '审核分类' })).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await expect(mobile).toHaveAttribute('aria-activedescendant', /category-options-/)
    await page.keyboard.press('Enter')
  } else {
    const navigation = page.getByRole('navigation', { name: '审核分类' })
    await navigation.getByRole('link').first().focus()
    await page.keyboard.press('End')
    await expect(navigation.getByRole('link').last()).toBeFocused()
    expect((await navigation.getByRole('link').last().boundingBox())!.height).toBeGreaterThanOrEqual(44)
    await page.keyboard.press('Enter')
  }
  await expect(page).toHaveURL(/\/departure-review$/)
  await page.reload()
  await expect(page.getByRole('heading', { name: '人事审核', exact: true })).toBeVisible()
  await checkLayout(page)
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await checkLayout(page)
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  await page.setViewportSize({ width: 375, height: 900 })
  await checkLayout(page)
  expect(errors).toEqual([])
})

test('Unified role categories retain unsaved fields across command navigation without submitting', async ({ page }) => {
  const writes = await mockTeam(page)
  await page.goto(`${origin}/roles/7`)
  const name = page.getByRole('textbox', { name: '角色名称', exact: true })
  await name.fill('保留中的角色草稿')
  const mobile = page.getByRole('combobox', { name: '角色分类', exact: true })
  if (await mobile.isVisible()) {
    await mobile.click()
    await expect(page.getByRole('option', { name: '角色资料 · 未保存' })).toBeVisible()
    await page.getByRole('option', { name: '文档权限', exact: true }).click()
    await expect(page.getByRole('checkbox', { name: /阅读文档/ })).toBeVisible()
    await mobile.click()
    await page.getByRole('option', { name: '角色资料 · 未保存' }).click()
  } else {
    const navigation = page.getByRole('navigation', { name: '角色分类' })
    await expect(navigation.getByRole('button').first()).toContainText('未保存')
    await navigation.getByRole('button').first().focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('checkbox', { name: /阅读文档/ })).toBeVisible()
    await page.keyboard.press('Home')
  }
  await expect(name).toHaveValue('保留中的角色草稿')
  await expect(page.getByRole('link', { name: '返回角色列表' })).toHaveAttribute('href', '/roles')
  expect(writes).toEqual([])
  await checkLayout(page)
})
