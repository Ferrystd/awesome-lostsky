import { expect, test, type Page } from '@playwright/test'

const identityToken = (type: string, id: number) =>
  `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type, id } })).toString('base64url')}.x`

async function setToken(page: Page, type = 'teamMember', id = 11) {
  await page.context().addCookies([{
    name: 'lostsky_token', value: identityToken(type, id), domain: '.lostsky.work', path: '/', sameSite: 'Lax',
  }])
}

function currentResult(entityId = 101, type = 'teamMember') {
  return {
    identity: {
      entity_id: entityId,
      type,
      id: type === 'teamVirtual' ? 9 : 11,
      slug: type === 'teamVirtual' ? 'sky-bot' : 'sky-member',
      name: type === 'teamVirtual' ? '青空助手' : '青空成员',
      avatar: null,
      status_code: type === 'teamMember' ? 'active' : null,
      status_label: type === 'teamMember' ? '正常' : null,
      team: { id: 1, slug: 'demo', name: '青空协作组' },
    },
    supported: true,
    profile: {
      name: type === 'teamVirtual' ? '青空助手' : '青空成员',
      avatar: null,
      description: '当前实体简介',
      intro_image: null,
      intro_video: null,
      introduction_markdown: '## 自我介绍\n\n保持清晰。',
    },
    custom_fields: [{
      id: 7, name: '偏好称呼', field_key: 'preferred_name', value_type: 'string', input_type: 'text',
      is_required: 0, is_editable: 1, can_edit: true,
    }, {
      id: 8, name: '只读编号', field_key: 'readonly_code', value_type: 'string', input_type: 'text',
      is_required: 0, is_editable: 0, can_edit: false,
    }],
    custom_field_values: [{ field_id: 7, value_string: '小青' }, { field_id: 8, value_string: 'LS-101' }],
    role_assignments: [{ role_id: 3, role: { id: 3, name: '内容协作', role_key: 'content', description: '维护资料' } }],
    effective_permissions: [{ key: 'file.upload', label: '上传文件', group: '文件' }],
    upload: { enabled: false, reason: '当前实体没有 file.upload 权限' },
  }
}

test('Account current entity center covers task routes, stale identity and responsive widths', async ({ page }) => {
  await setToken(page)
  let current = currentResult()
  const writes: Array<{ path: string; body: Record<string, unknown> }> = []
  await page.route('http://account.lostsky.work:5174/api/**', async route => {
    const url = new URL(route.request().url())
    if (route.request().method() === 'GET' && url.pathname.endsWith('/identity/current')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: current }) })
      return
    }
    if (route.request().method() === 'GET' && url.pathname.endsWith('/identity/current/customer-assignees')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: [] }) })
      return
    }
    writes.push({ path: url.pathname, body: route.request().postDataJSON() as Record<string, unknown> })
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'saved', data: null }) })
  })

  await page.goto('http://account.lostsky.work:5174/identity/current/profile?redirect=%2Fteams')
  await expect(page.getByRole('heading', { name: '资料', level: 1 })).toBeVisible()
  await expect(page.getByText('青空协作组', { exact: true })).toBeVisible()
  await expect(page.getByLabel('名称')).toHaveValue('青空成员')
  await expect(page.getByText('服务归属', { exact: true })).toHaveCount(0)

  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `current entity overflows at ${width}px`).toBe(false)
  }

  const fieldsLink = page.getByRole('link', { name: '对象字段' })
  await fieldsLink.focus()
  await fieldsLink.press('Enter')
  await expect(page.getByRole('heading', { name: '对象字段', level: 1 })).toBeVisible()
  await page.getByLabel('偏好称呼').fill('新称呼')
  await expect(page.getByText('LS-101', { exact: true })).toBeVisible()
  await expect(page.getByRole('textbox', { name: '只读编号' })).toHaveCount(0)
  await page.getByRole('button', { name: '保存字段' }).click()
  await expect.poll(() => writes.at(-1)?.body.expected_entity_id).toBe(101)
  expect(writes.at(-1)?.body.values).toEqual({ 7: '新称呼' })

  await page.getByRole('link', { name: '角色权限' }).click()
  await expect(page.getByRole('heading', { name: '角色权限', level: 1 })).toBeVisible()
  await expect(page.getByText('内容协作')).toBeVisible()
  await page.getByText('文件', { exact: true }).click()
  await expect(page.getByText('file.upload')).toBeVisible()

  await page.getByRole('link', { name: '资料' }).click()
  await page.getByLabel('名称').fill('尚未保存的成员名称')
  current = currentResult(202, 'teamVirtual')
  const other = await page.context().newPage()
  await other.goto('about:blank')
  await other.bringToFront()
  await page.bringToFront()
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await other.close()
  await expect(page.getByText('身份已切换，未保存内容没有提交', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '保存资料' })).toBeDisabled()
})

test('legacy Team and Shop profile routes move to Account with a safe return target', async ({ page }) => {
  await page.route('http://demo.team.lostsky.work:5175/api/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code: 0, message: 'ok', data: { permissions: [], abilities: {} } }),
  }))
  await page.route('http://demo.shop.lostsky.work:5179/api/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code: 0, message: 'ok', data: null }),
  }))
  await setToken(page, 'teamMember', 11)
  await page.goto('http://demo.team.lostsky.work:5175/me')
  await expect(page).toHaveURL(url => url.origin === 'http://account.lostsky.work:5174'
    && url.pathname === '/identity/current/profile'
    && url.searchParams.get('redirect') === 'http://demo.team.lostsky.work:5175/')

  await setToken(page, 'teamCustomer', 31)
  await page.goto('http://demo.shop.lostsky.work:5179/customer/profile')
  await expect(page).toHaveURL(url => url.origin === 'http://account.lostsky.work:5174'
    && url.pathname === '/identity/current/profile'
    && url.searchParams.get('redirect') === 'http://demo.shop.lostsky.work:5179/')
})
