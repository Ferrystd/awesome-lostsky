import { siteOrigin } from './site-origin'
// Logical Site origin for grouped discovery: http://127.0.0.1:5173
import { expect, test, type Locator, type Page } from './fixtures'

const initial = {
  icp: '粤ICP备12345678号-1',
  members: [{ name: '测试人员', role: '运营负责人', description: '负责团队运营和交付。', tags: ['运营'], initials: 'LS', avatar: '', visible: true }],
  stats: [{ value: '42+', label: '合作团队', visible: true }],
}

async function mock(page: Page, options: { write?: boolean; failed?: boolean; delayed?: boolean; full?: boolean } = {}) {
  let content = structuredClone(initial)
  if (options.full) {
    content.members = Array.from({ length: 20 }, (_, index) => ({ ...structuredClone(initial.members[0]), name: `人员 ${index + 1}` }))
    content.stats = Array.from({ length: 12 }, (_, index) => ({ ...initial.stats[0], label: `指标 ${index + 1}` }))
  }
  let failed = options.failed ?? false
  let release: (() => void) | undefined
  let puts = 0
  await page.addInitScript(() => localStorage.setItem('lostsky_token', 'site-editor-test'))
  await page.route(url => [siteOrigin, 'http://127.0.0.1:5180'].includes(url.origin) && /^\/api\/(?:session|site-content)$/.test(url.pathname), async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    let data: unknown = null
    if (path === '/api/session') data = { user: { id: 1, username: 'editor' }, roles: [], permissions: ['admin.site.read', ...(options.write === false ? [] : ['admin.site.write'])], is_super_admin: false }
    if (path === '/api/site-content') {
      if (request.method() === 'PUT') {
        puts++
        content = request.postDataJSON()
        if (options.delayed) await new Promise<void>(resolve => { release = resolve })
      } else if (failed) { await route.fulfill({ status: 503, json: { code: 503, message: '暂时不可用', data: null } }); return }
      data = content
    }
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
  return { content: () => content, puts: () => puts, recover: () => { failed = false }, release: () => release?.() }
}

async function expectDisabledFeedback(page: Page, button: Locator, message: string) {
  await expect(button).toHaveAttribute('aria-disabled', 'true')
  await button.focus()
  await button.press('Enter')
  await expect(page.getByText(message, { exact: true })).toBeVisible()
  await expect(page.getByText(message, { exact: true })).toBeHidden()
  await button.click({ force: true })
  await expect(page.getByText(message, { exact: true })).toBeVisible()
  await expect(page.getByText(message, { exact: true })).toHaveCount(1)
}

test('官网内容整组保存、排序隐藏与保存期间草稿保护', async ({ page, isMobile }) => {
  const state = await mock(page, { delayed: true })
  await page.goto('http://127.0.0.1:5180/site-content')
  await expect(page.locator('#site-icp')).toHaveValue(initial.icp)
  await expectDisabledFeedback(page, page.getByRole('button', { name: '保存官网内容', exact: true }), '尚未修改任何内容')
  expect(state.puts()).toBe(0)
  await page.locator('#site-icp').fill('京ICP备87654321号-2')
  await page.getByRole('button', { name: '添加人员', exact: true }).click()
  await page.locator('#member-name-1').fill('第二位人员')
  await page.locator('#member-role-1').fill('技术负责人')
  await page.locator('#member-description-1').fill('维护技术系统')
  await page.locator('#member-initials-1').fill('JS')
  await page.getByRole('region', { name: '核心人员 2', exact: true }).getByRole('button', { name: '上移', exact: true }).click()
  await expect(page.locator('#member-name-0')).toHaveValue('第二位人员')
  await page.getByRole('switch', { name: '显示人员 2' }).click()
  await page.locator('#stat-value-0').fill('88+')
  await page.getByRole('button', { name: '保存官网内容', exact: true }).click()
  await expect.poll(state.puts).toBe(1)
  await expectDisabledFeedback(page, page.getByRole('button', { name: '正在保存…', exact: true }), '正在保存，请稍候')
  expect(state.puts()).toBe(1)
  await page.locator('#site-icp').fill('京ICP备87654321号-3')
  state.release()
  await expect(page.getByText('官网内容已保存，刷新官网即可查看')).toBeVisible()
  await expect(page.locator('#site-icp')).toHaveValue('京ICP备87654321号-3')
  await expect(page.getByRole('button', { name: '保存官网内容', exact: true })).toBeEnabled()
  expect(state.content().icp).toBe('京ICP备87654321号-2')
  expect(state.content().members[1].visible).toBe(false)
  expect(state.content().stats[0].value).toBe('88+')
  if (isMobile) await page.getByRole('button', { name: '打开导航', exact: true }).click()
  page.once('dialog', dialog => dialog.dismiss())
  await page.getByRole('link', { name: '系统状态', exact: true }).click()
  await expect(page).toHaveURL(/\/site-content$/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('官网排序边界说明原因且不提交', async ({ page }) => {
  const state = await mock(page, { full: true })
  await page.goto('http://127.0.0.1:5180/site-content')
  await expect(page.locator('#site-icp')).toHaveValue(initial.icp)
  for (const [region, direction, reason] of [
    ['核心人员 1', '上移', '已经是第一项，无法上移'],
    ['核心人员 20', '下移', '已经是最后一项，无法下移'],
    ['优势指标 1', '上移', '已经是第一项，无法上移'],
    ['优势指标 12', '下移', '已经是最后一项，无法下移'],
  ]) {
    await expectDisabledFeedback(page, page.getByRole('region', { name: region, exact: true }).getByRole('button', { name: direction, exact: true }), reason)
  }
  expect(state.puts()).toBe(0)
})

test('官网数量上限说明原因且移除后恢复添加', async ({ page }) => {
  const state = await mock(page, { full: true })
  await page.goto('http://127.0.0.1:5180/site-content')
  await expect(page.locator('#site-icp')).toHaveValue(initial.icp)
  await expectDisabledFeedback(page, page.getByRole('button', { name: '添加人员', exact: true }), '最多添加 20 位核心人员，请先移除其他人员')
  await expectDisabledFeedback(page, page.getByRole('button', { name: '添加指标', exact: true }), '最多添加 12 项优势指标，请先移除其他指标')
  await expect(page.locator('[aria-label^="核心人员 "]')).toHaveCount(20)
  await expect(page.locator('[aria-label^="优势指标 "]')).toHaveCount(12)
  expect(state.puts()).toBe(0)
  await page.getByRole('region', { name: '核心人员 20', exact: true }).getByRole('button', { name: '移除人员', exact: true }).click()
  await page.getByRole('button', { name: '添加人员', exact: true }).click()
  await expect(page.locator('#member-name-19')).toHaveValue('')
  await page.getByRole('region', { name: '优势指标 12', exact: true }).getByRole('button', { name: '移除指标', exact: true }).click()
  await page.getByRole('button', { name: '添加指标', exact: true }).click()
  await expect(page.locator('#stat-label-11')).toHaveValue('')
  expect(state.puts()).toBe(0)
})

test('官网编辑读取失败可恢复，只有读取权限不能保存', async ({ page }) => {
  const state = await mock(page, { write: false, failed: true })
  await page.goto('http://127.0.0.1:5180/site-content')
  await expect(page.getByText('暂时无法读取官网内容')).toBeVisible()
  state.recover()
  await page.getByRole('button', { name: '重新加载', exact: true }).click()
  await expect(page.locator('#site-icp')).toHaveValue(initial.icp)
  await expect(page.locator('#site-icp')).toBeDisabled()
  await page.getByRole('button', { name: '保存官网内容', exact: true }).focus()
  await page.getByRole('button', { name: '保存官网内容', exact: true }).press('Enter')
  expect(state.puts()).toBe(0)
})

test('官网匿名读取配置，保留原有区块和样式；失败回退原内容', async ({ page }) => {
  const state = await mock(page)
  await page.goto(siteOrigin)
  await expect(page.locator('#team h3')).toHaveText('测试人员')
  await expect(page.locator('.stat-list strong')).toHaveText('42+')
  await expect(page.getByRole('link', { name: initial.icp })).toHaveAttribute('href', 'https://beian.miit.gov.cn/')
  expect(await page.locator('main > section').evaluateAll(nodes => nodes.map(node => node.id))).toEqual(['home', 'team', 'services', 'advantages', 'contact'])
  await expect(page.getByRole('complementary', { name: '失落青空服务方法' })).toBeVisible()
  await expect(page.locator('.avatar-frame')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(state.puts()).toBe(0)
  await page.route(/\/api\/site-content$/, route => route.fulfill({ status: 503, json: { code: 503, data: null } }))
  await page.reload()
  await expect(page.locator('#team h3').first()).toHaveText('Alex Chen')
  await expect(page.locator('.stat-list article')).toHaveCount(4)
})
