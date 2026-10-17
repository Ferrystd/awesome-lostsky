import { expect, test, type Page } from './fixtures'

const origin = 'http://demo.team.lostsky.work:5175'
async function fixture(page: Page, mode = 'full') {
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/' }])
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const requests: string[] = []
  await page.route(`${origin}/api/**`, async route => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/api', '')
    requests.push(path + url.search)
    let data: unknown
    if (path === '/access') data = { team: { id: 1, slug: 'demo', name: '团队' }, permissions: mode === 'restricted' ? [] : ['team'], abilities: {}, identity: { type: 'team', entity_id: 1 } }
    else if (path === '/entityField/index') data = [{ id: 1, name: '字段一', field_key: 'one', entity_type: 'entity', value_type: 'int', input_type: 'text' }, { id: 2, name: '字段二', field_key: 'two', entity_type: 'entity', value_type: 'int', input_type: 'text' }]
    else if (path === '/entityField/get') data = { id: Number(url.searchParams.get('id')), entity_type: 'entity', field_key: 'score', name: '字段', value_type: 'int', input_type: 'text', options: null, manager_scope: 1, visibility: 1, visibility_targets: [], is_required: 0, sort: 0 }
    else if (path === '/entityField/fieldValues') {
      if (mode === 'denied') { await route.fulfill({ status: 403, json: { code: 40302, message: 'forbidden', data: { kind: 'permission', required_any: ['team.entity.field.manage'] } } }); return }
      if (mode === 'error') { await route.fulfill({ status: 503, json: { code: 503, message: '读取失败' } }); return }
      const current = Number(url.searchParams.get('page'))
      data = { data: mode === 'empty' ? [] : [{ entity_id: current, slug: `person-${current}`, name: current === 1 ? '一位姓名很长的人员'.repeat(9) : '第二页人员', type: 'teamMember', value: current === 1 ? 0 : '完整长值'.repeat(90) }], total: mode === 'empty' ? 0 : 21, current_page: current, per_page: 20 }
    } else throw new Error(`未声明请求 ${path}`)
    await route.fulfill({ json: { code: 0, data } })
  })
  return requests
}

test('object field values show zero, paginate and fit desktop mobile and enlarged text', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const requests = await fixture(page)
  await page.goto(`${origin}/field-edit?id=1`)
  const values = page.getByRole('region', { name: '人员字段值', exact: true })
  await expect(values.locator('.field-value-text')).toHaveText('0')
  await expect(page.getByRole('heading', { name: '规则摘要' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '填写预览' })).toBeVisible()
  const pager = page.getByLabel('人员字段值分页')
  await pager.locator('.n-pagination-item--button').last().click()
  await expect(values).toContainText('第二页人员')
  expect(requests.some(path => path.includes('page=2'))).toBe(true)
  await expect(values.locator('.field-value-text')).toHaveText('完整长值'.repeat(90))
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    const aside = (await page.getByRole('complementary', { name: '字段预览与人员值' }).boundingBox())!
    const form = (await page.locator('form.field-form').boundingBox())!
    expect(aside.x >= form.x + form.width || aside.y >= form.y + form.height).toBe(true)
    expect(await values.locator('.field-value-text').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true)
  }
  await page.setViewportSize({ width: 320, height: 1000 })
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  expect(errors).toEqual([])
})

for (const mode of ['new', 'restricted', 'denied', 'empty', 'error']) {
  test(`object field values ${mode} state`, async ({ page }) => {
    const requests = await fixture(page, mode)
    await page.goto(`${origin}/${mode === 'new' ? 'field-new' : 'field-edit?id=1'}`)
    const values = page.getByRole('region', { name: '人员字段值', exact: true })
    if (mode === 'error') {
      await expect(values.locator('.ls-async-state[role=alert]')).toBeVisible()
      await expect(values.locator('.ls-empty-state')).toHaveCount(0)
    } else {
      await expect(values.locator('.ls-empty-state')).toBeVisible()
      await expect(values.locator('.ls-resource-list')).toHaveCount(0)
      if (mode === 'restricted' || mode === 'denied') await expect(values).toContainText('无法读取数据')
    }
    if (mode === 'new' || mode === 'restricted') expect(requests.some(path => path.startsWith('/entityField/fieldValues'))).toBe(false)
  })
}

test('object field values ignore late responses after changing the field', async ({ page }) => {
  await fixture(page)
  let release!: () => void
  const waiting = new Promise<void>(resolve => { release = resolve })
  let started = false
  await page.route(`${origin}/api/entityField/fieldValues?**`, async route => {
    if (new URL(route.request().url()).searchParams.get('id') !== '1') return route.fallback()
    started = true
    await waiting
    await route.fulfill({ json: { code: 0, data: { data: [{ entity_id: 999, name: '旧字段迟到值', slug: 'old', type: 'teamMember', value: 999 }], total: 1, current_page: 1, per_page: 20 } } })
  })
  await page.goto(`${origin}/field-edit?id=1`)
  await expect.poll(() => started).toBe(true)
  await page.getByRole('link', { name: '返回对象字段' }).click()
  await page.getByRole('link', { name: /字段二/ }).click()
  await expect(page).toHaveURL(/field-edit\?id=2/)
  await expect(page.locator('.field-value-text')).toHaveText('0')
  const completed = page.waitForResponse(response => response.url().includes('/entityField/fieldValues?id=1'))
  release()
  await completed
  await expect(page.getByText('旧字段迟到值')).toHaveCount(0)
  await expect(page.locator('.field-value-text')).toHaveText('0')
})
