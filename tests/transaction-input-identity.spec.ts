import { test, expect, type Page } from '@playwright/test'

const token = (id: number) => `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamMember', id } })).toString('base64url')}.x`
async function setupTransaction(page: Page) {
  await page.context().addCookies([{ name: 'lostsky_token', value: token(11), domain: '.lostsky.work', path: '/' }])
  const writes: Array<{ auth: string; body: Record<string, unknown> }> = []
  await page.route('http://demo.transaction.lostsky.work:5177/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    const entity = { id: 11, entity_id: 11, type: 'member', slug: 'actor-a', name: '人员A', entityable_type: 'teamMember', profile: { nickname: '人员A' } }
    let data: unknown = {}
    if (path.endsWith('/workspace/access')) data = { team: { id: 1, slug: 'demo', name: '测试团队' }, permissions: ['transaction.read', 'transaction.write'], abilities: { transaction: { enabled: true, label: '记账', reason: null } }, identity: { entity_id: 11, type: 'teamMember', name: '人员A', belongs_to_team: true, is_external: false } }
    else if (path.endsWith('/transaction/options')) data = { entities: [entity], customers: [] }
    else if (path.endsWith('/transaction/21')) {
      if (route.request().method() === 'POST') {
        writes.push({ auth: route.request().headers().authorization, body: route.request().postDataJSON() })
        return route.fulfill({ status: 422, json: { code: 422, message: '审计拦截，不写入', data: null } })
      }
      data = { id: 21, handler_entity_id: 11, sender_entity_id: null, cs_entity_id: null, customer_id: null, type: '记账登记', total_price: '100.00', cash: '100.00', prepaid: '0.00', cost: '0.00', handler_cut: '100.00', sender_cut: '0.00', cs_cut: '0.00', team_cut: '0.00', trans_at: 1784563200, memo: '初始备注' }
    }
    await route.fulfill({ json: { code: 0, data } })
  })
  await page.goto('http://demo.transaction.lostsky.work:5177/edit?id=21')
  await expect(page.locator('#transaction-total input')).toHaveValue('100.00')
  return writes
}

test('cleared amounts are blocked until explicitly filled, while zero remains valid', async ({ page }) => {
  const writes = await setupTransaction(page)
  for (const field of ['total', 'cash', 'handler-cut']) {
    await page.locator(`#transaction-${field} input`).fill('')
    await page.locator(`#transaction-${field} input`).blur()
  }
  const save = page.getByRole('button', { name: '保存流水', exact: true })
  await expect(save).toHaveAttribute('aria-disabled', 'true')
  await save.click({ force: true })
  await expect(page.getByText('请完整填写金额，金额须为大于或等于 0 的数字', { exact: true })).toBeVisible()
  expect(writes).toHaveLength(0)
  for (const field of ['total', 'cash', 'handler-cut']) {
    await page.locator(`#transaction-${field} input`).fill('0')
    await page.locator(`#transaction-${field} input`).blur()
  }
  await save.click()
  await expect.poll(() => writes.length).toBe(1)
  expect(writes[0].body).toMatchObject({ total_price: 0, cash: 0, handler_cut: 0, expected_entity_id: 11 })
})

test('a draft loaded under the previous identity cannot submit through a changed cookie', async ({ page }) => {
  const writes = await setupTransaction(page)
  await page.locator('#transaction-memo textarea').fill('人员A填写的草稿')
  await page.context().addCookies([{ name: 'lostsky_token', value: token(22), domain: '.lostsky.work', path: '/' }])
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(page.locator('#transaction-memo textarea')).toHaveValue('人员A填写的草稿')
  await page.getByRole('button', { name: '保存流水', exact: true }).click()
  await expect(page.getByText('当前登录身份已在其他页面改变，请刷新页面后重新操作。', { exact: true })).toBeVisible()
  expect(writes).toHaveLength(0)
})

test('real enum labels retain manual transaction edit and delete actions', async ({ page }) => {
  await setupTransaction(page)
  await page.goto('http://demo.transaction.lostsky.work:5177/detail?id=21')
  await expect(page.getByText('记账登记', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: '编辑', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '删除', exact: true })).toBeVisible()
})
