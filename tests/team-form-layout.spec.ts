import { expect, test, type Page } from './fixtures'

const teamOrigin = process.env.TEAM_TEST_ORIGIN ?? 'http://demo.team.lostsky.work:5175'
const adminOrigin = process.env.ADMIN_TEST_ORIGIN ?? 'http://admin.lostsky.work:5180'
const longText = '用于核对长名称自然换行而不挤压控件的资料说明'.repeat(4)
const customFields = [
  { id: 1, name: '公开称号', value_type: 'string', can_edit: true, is_required: 1 },
  { id: 2, name: longText, value_type: 'text', input_type: 'textarea', can_edit: true },
  { id: 3, name: '接受预约', value_type: 'bool', can_edit: true, is_required: 1 },
  { id: 4, name: '接单年限', value_type: 'int', can_edit: true },
  { id: 5, name: '展示范围', value_type: 'select', input_type: 'select', options: ['公开', '团队'], can_edit: true },
  { id: 6, name: '只读资料', value_type: 'string', can_edit: false },
  { id: 7, name: '开始接单日期', value_type: 'date', can_edit: true },
  { id: 8, name: '下次可预约', value_type: 'datetime', can_edit: true },
  { id: 9, name: '可接单日期', value_type: 'multi_select', options: ['周末', '节假日'], can_edit: true },
  { id: 10, name: '单选展示范围', value_type: 'select', input_type: 'radio', options: ['公开', '团队'], can_edit: true },
  { id: 11, name: '擅长内容', value_type: 'string', input_type: 'checkbox', options: ['语音陪伴', '剧情互动'], can_edit: true },
  { id: 12, name: '作品附件', value_type: 'string', input_type: 'upload', can_edit: true },
]
const values = [{ field_id: 1, value_string: '晚风小栖' }, { field_id: 2, value_text: longText }, { field_id: 3, value_int: 1 }, { field_id: 4, value_int: 6 }, { field_id: 6, value_string: longText }]
const profile = { name: '测试人员', avatar: '', description: longText, intro_image: '', intro_video: '', introduction_markdown: '详细介绍保留完整编辑宽度。', document_tags: [] }

async function setup(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.context().addCookies([{ name: 'lostsky_token', value: `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: 'team', id: 1 } })).toString('base64url')}.x`, domain: '.lostsky.work', path: '/' }])
  const access = { team: { id: 1, slug: 'demo', name: '测试团队' }, identity: { type: 'team', entity_id: 1 }, permissions: ['team', 'community.team.read', 'community.team.manage', 'file.upload'], abilities: { doc: { enabled: true, level: 1 } } }
  const fixtures: Record<string, unknown> = {
    '/access': access,
    '/session': { user: { id: 1, username: 'admin' }, roles: [], permissions: ['admin.community.read', 'admin.community.write'], is_super_admin: true },
    '/entity/options': [{ entity_id: 1, type: 'team', name: '测试团队', slug: 'demo' }],
    '/entity/get': { id: 1, slug: 'member', entityable_type: 'teamMember', is_displayed: 1, is_internal_visible: 1, capabilities: { read_all: true, manage_profile: true }, profile },
    '/personal': { identity: { entity_id: 1, type: 'team', slug: 'demo', name: '测试团队', team: { name: '测试团队' } }, profile, custom_fields: customFields, custom_field_values: values, role_assignments: [], effective_permissions: [] },
    '/member/get': { id: 1, entity_id: 1, nickname: '测试成员', slug: 'member', status_code: 'active', fieldValues: values.map(value => ({ ...value, field: customFields.find(field => field.id === value.field_id) })), capabilities: { field_manage: true, role_read: true, role_write: true, member_search: true } },
    '/ability': [],
    '/role/get': { id: 1, name: '服务成员', role_key: 'service_member', description: longText, sort: 1 },
    '/rolePermission/index': [],
    '/chatVirtual/get': { id: 1, slug: 'bot', name: '服务助手', integrations: [] },
    '/member/joinForm': { fields: [{ id: 1, field_key: 'name', name: '入职称呼', input_type: 'text', is_apply_required: true }], file_upload: { available: false } },
    '/entityField/index': customFields,
    '/entityField/values': values,
    '/role/index': [],
    '/entityRole/index': [],
    '/rolePermission/catalog': { groups: [], advanced_items: [] },
    '/joinField/index': [],
    '/joinField/transferOptions': [],
    '/join/form': { purpose_code: 'join', purpose_label: '加入', refill_required: true, fields: [{ id: 1, field_key: 'name', name: '入职称呼', input_type: 'text', is_apply_required: true }, { id: 2, field_key: 'intro', name: '入职介绍', input_type: 'textarea' }], file_upload: { available: false, reason: '未开放上传' } },
    '/join/mine': [],
    '/customer/1': { id: 1, slug: 'customer', name: '测试顾客', avatar: '', description: longText, is_blocked: false, create_time: 1, balance: { balance: '0', recharged: '0', spent: '0' }, senders: [], assignee: null, summary: { transaction_count: 0, transaction_total: '0', order_count: 0, order_total: '0' }, can_manage: true },
    '/customer/assignees': [],
    '/communities/1': { id: 1, name: '测试社区', slug: 'sky', description: longText, status: 'Active', is_official: false },
    '/communities/1/administrators': { list: [], total: 0 },
    '/setting/schema': { apps: [{ app_name: 'entity', label: '人员', description: '人员规则', settings: [
      { key: 'name', label: '显示名称', description: longText, control: 'input', value: '青空', default: '' },
      { key: 'limit', label: '人数限制', description: '人数上限', control: 'number', value: 10, default: 10 },
      { key: 'choice', label: '选择范围', description: '适用范围', control: 'select', value: 'team', default: 'team', options: [{ label: '团队', value: 'team' }] },
      { key: 'open', label: '开放查找', description: '允许其他人员查找', control: 'switch', value: false, default: false },
      { key: 'policy', label: '优先策略', description: '选择处理策略', control: 'radio', value: 'team', default: 'team', options: [{ label: '团队优先', value: 'team', description: longText }, { label: '成员优先', value: 'member', description: '采用成员设置' }] },
    ] }] },
  }
  for (const origin of [teamOrigin, adminOrigin]) await page.route(`${origin}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '')
    if (!(path in fixtures)) throw new Error(`未声明表单布局请求: ${route.request().method()} ${path}`)
    await route.fulfill({ json: { code: 0, message: 'ok', data: fixtures[path] } })
  })
}

async function assertGeometry(page: Page, width: number, fontSize: number) {
  await page.setViewportSize({ width, height: 1200 })
  await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px` }, fontSize)
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  const rows = await page.locator('.ls-form-field-layout').evaluateAll(elements => elements.map(element => {
    const label = element.querySelector('.ls-form-field-layout__label')!.getBoundingClientRect()
    const control = element.querySelector('.ls-form-field-layout__control')!.getBoundingClientRect()
    const feedback = element.querySelector('.ls-form-field-layout__feedback')?.getBoundingClientRect()
    const box = element.getBoundingClientRect()
    const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
    const toggle = element.querySelector('[role="switch"]')?.getBoundingClientRect()
    const actual = element.querySelector('.n-input-number, .n-select, .n-date-picker, .n-input, .ls-media-upload-field')?.getBoundingClientRect()
    return { label: label.toJSON(), control: control.toJSON(), feedback: feedback?.toJSON(), box: box.toJSON(), horizontal: box.width >= 36 * rootSize, toggle: toggle?.toJSON(), actual: actual?.toJSON() }
  }))
  expect(rows.length).toBeGreaterThan(0)
  for (const row of rows) {
    expect(row.control.right, `${width}/${fontSize}: control boundary`).toBeLessThanOrEqual(row.box.right + 1)
    if (row.horizontal) expect(row.control.x).toBeGreaterThan(row.label.x)
    else expect(row.control.y).toBeGreaterThanOrEqual(row.label.bottom - 1)
    if (row.feedback) { expect(row.feedback.x).toBeCloseTo(row.control.x, 0); expect(row.feedback.y).toBeGreaterThanOrEqual(row.control.bottom - 1) }
    if (row.toggle) expect(row.toggle.x).toBeCloseTo(row.control.x, 0)
    if (row.actual) { expect(row.actual.x).toBeCloseTo(row.control.x, 0); expect(row.actual.right).toBeLessThanOrEqual(row.control.right + 1); expect(row.actual.width).toBeGreaterThan(40) }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${width}/${fontSize}: page overflow`).toBe(true)
}

test('Team form rows adapt to actual containers across standard, dynamic, settings and community routes', async ({ page }) => {
  test.setTimeout(180_000)
  await setup(page)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  for (const path of ['/chat-virtual-new', '/roles/new', '/customers/1', '/field-new', '/join-fields/new', '/member-edit?id=1', '/member-detail?id=1', '/personal/fields', '/settings', '/communities/new', '/communities/1/administrators', '/join']) {
    await page.goto(`${teamOrigin}${path}`)
    await expect(page.locator('.ls-form-field-layout').first(), path).toBeVisible()
    for (const fontSize of [16, 32]) for (const width of [320, 375, 768, 1024, 1440, 1920]) await assertGeometry(page, width, fontSize)
    if (path === '/personal/fields') await expect(page.locator('.readonly-value')).toContainText(longText)
    if (path === '/settings') {
      await expect(page.locator('.ls-form-content .ls-radio-group-field')).toHaveCount(1)
      await expect(page.getByRole('textbox', { name: '显示名称' })).toHaveAccessibleDescription(longText)
    }
    if (path === '/member-edit?id=1') {
      const boolField = page.locator('.ls-field').filter({ has: page.getByRole('switch', { name: '接受预约' }) })
      await expect(boolField.locator('.ls-field__label span')).toBeVisible()
      await expect(boolField.locator('.ls-field__description')).toContainText('是/否')
    }
  }
  expect(errors).toEqual([])
})

test('Team distinct task groups keep metadata aligned and complex content full width', async ({ page }) => {
  test.setTimeout(120_000)
  await setup(page)
  for (const path of ['/doc-create', '/notices/send', '/chat-integration-new?slug=bot', '/chat-groups/new', '/roles/1', '/abilities', '/member-add']) {
    await page.goto(`${teamOrigin}${path}`)
    await expect(page.locator('.ls-form-field-layout').first(), path).toBeVisible()
    if (path === '/member-add') { await page.getByRole('switch', { name: '代填入职表单' }).click(); await expect(page.getByRole('textbox', { name: '入职称呼' })).toBeVisible() }
    for (const width of [320, 1440]) for (const font of [16, 32]) await assertGeometry(page, width, font)
    await expect(page.locator('.ls-form-content .ls-form-field-layout')).toHaveCount(0)
    if (path === '/chat-integration-new?slug=bot') await expect(page.locator('.ls-form-content .ls-checkbox-group-field')).toBeVisible()
  }
})

test('Team feedback stays associated with actual input through errors, disabled state and reinstatement', async ({ page }) => {
  await setup(page)
  await page.goto(`${teamOrigin}/join-fields/new`)
  await page.getByRole('textbox', { name: '字段标识', exact: true }).fill('invalid key!')
  await page.getByRole('button', { name: '保存字段', exact: true }).click()
  const key = page.getByRole('textbox', { name: '字段标识', exact: true })
  await expect(page.locator('#join-field-key-feedback')).toHaveAttribute('role', 'alert')
  await expect(key).toHaveAttribute('aria-describedby', 'join-field-key-feedback')
  for (const width of [320, 1440]) for (const font of [16, 32]) await assertGeometry(page, width, font)
  await page.route(`${teamOrigin}/api/access`, route => route.fulfill({ json: { code: 0, message: 'ok', data: { permissions: ['team.join_field.read'], abilities: {}, identity: { type: 'team' } } } }))
  await page.goto(`${teamOrigin}/join-fields/new`)
  await expect(page.getByRole('textbox', { name: '字段名称', exact: true })).toBeDisabled()
  for (const width of [320, 1440]) await assertGeometry(page, width, 32)
  await page.route(`${teamOrigin}/api/join/form`, route => route.fulfill({ json: { code: 0, message: 'ok', data: { purpose_code: 'reinstate', purpose_label: '复职', refill_required: true, fields: [{ id: 1, field_key: 'name', name: '复职称呼', input_type: 'text', is_apply_required: 1 }], file_upload: { available: false } } } }))
  await page.goto(`${teamOrigin}/join`)
  await expect(page.getByRole('textbox', { name: '复职称呼' })).toBeVisible()
  for (const width of [320, 1440]) await assertGeometry(page, width, 32)
})

test('Team first identity fields follow the same container rules', async ({ page }) => {
  await setup(page)
  await page.route(`${teamOrigin}/api/member/get?**`, route => route.fulfill({ json: { code: 0, message: 'ok', data: { id: 1, entity_id: 1, nickname: '测试成员', slug: '', status_code: 'active', capabilities: { member_slug: true } } } }))
  await page.goto(`${teamOrigin}/member-edit?id=1`)
  await expect(page.getByRole('textbox', { name: '补全对象标识' })).toBeVisible()
  for (const width of [320, 1440]) for (const font of [16, 32]) await assertGeometry(page, width, font)
  await page.route(`${teamOrigin}/api/personal`, route => route.fulfill({ json: { code: 0, message: 'ok', data: { identity: { entity_id: 1, type: 'team', slug: '', name: '测试成员', team: { name: '测试团队' } }, profile, custom_fields: [], custom_field_values: [] } } }))
  await page.goto(`${teamOrigin}/personal/profile`)
  await expect(page.getByRole('textbox', { name: '对象标识', exact: true })).toBeVisible()
  for (const width of [320, 1440]) for (const font of [16, 32]) await assertGeometry(page, width, font)
})

test('Team profile keeps rich content full width while field hints and switches share control alignment', async ({ page }) => {
  await setup(page)
  for (const path of ['/personal/profile', '/entity?id=1']) {
    await page.goto(`${teamOrigin}${path}`)
    await expect(page.locator('.entity-profile-fields .ls-form-field-layout').first()).toBeVisible()
    await expect(page.locator('.entity-profile-fields .ls-form-content .ls-form-field-layout')).toHaveCount(0)
    for (const width of [320, 768, 1440]) for (const font of [16, 32]) await assertGeometry(page, width, font)
  }
})

test('Shared community fields stay vertical for Admin outside Team form context', async ({ page }) => {
  await setup(page)
  await page.goto(`${adminOrigin}/communities/new`)
  await expect(page.getByRole('textbox', { name: '社区名称', exact: true })).toBeVisible()
  await expect(page.locator('.ls-form-field-layout')).toHaveCount(0)
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    const bounds = await page.locator('.ls-field').first().evaluate(element => ({ label: element.querySelector('label')!.getBoundingClientRect().toJSON(), control: element.querySelector('.ls-field__control')!.getBoundingClientRect().toJSON() }))
    expect(bounds.control.y).toBeGreaterThanOrEqual(bounds.label.bottom)
  }
})
