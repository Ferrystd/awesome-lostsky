import { expect, test } from '@playwright/test'

test('shop customer can split an entitlement between a named handler and open dispatch', async ({ page }) => {
  const customerToken = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamCustomer', id: 31 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: customerToken, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  let available = 3
  const startPayloads: Record<string, unknown>[] = []
  const offerPayloads: Record<string, unknown>[] = []
  const offers: Array<Record<string, unknown>> = []
  const instances: Array<Record<string, unknown>> = []
  const customer = { id: 31, team_id: 1, is_blocked: 0, profile: { name: '晚风顾客' }, identity: { slug: 'evening-sky' } }
  const entitlement = () => ({
    id: 101, granted_quantity: '3.0000', available_quantity: available.toFixed(4),
    reserved_quantity: (3 - available).toFixed(4), consumed_quantity: '0.0000',
    unit_name: '小时', quantity_step: '0.5000',
    expire_time: 1_900_000_000, is_expired: false, is_exhausted: available === 0,
    allow_open_dispatch: true, dispatch_available: true,
    service: { id: 7, name: '三小时陪玩', description: '可按半小时切分给不同陪玩' },
    instances, assignment_offers: offers,
    redemption_fields: [
      { id: 5, name: '预约说明', value_type: 'string', input_type: 'text', fill_stage: 'customer', is_required: 1 },
    ],
  })
  await page.route('http://demo.shop.lostsky.work:5179/api/**', async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    let data: unknown = null
    if (path.endsWith('/storefront')) data = { slug: 'demo', type: 'team', product_count: 0, profile: { name: '青空服务' } }
    else if (path.endsWith('/customer/me')) data = customer
    else if (path.endsWith('/customer/services/101/handlers')) data = [{ entity_id: 11, subject: { id: 11, type: 'teamMember', slug: 'qingkong-handler', name: '青空接单人' } }]
    else if (path.endsWith('/customer/services/101/offers')) {
      const payload = request.postDataJSON() as Record<string, unknown>
      offerPayloads.push(payload)
      available -= Number(payload.quantity)
      const offerId = 301 + offers.length
      offers.push({ id: offerId, status: 1, quantity: payload.quantity, target_handler: { id: 11, name: '青空接单人' } })
      data = { id: offerId }
    }
    else if (/\/customer\/service-offers\/\d+\/withdraw$/.test(path)) {
      const offerId = Number(path.split('/').at(-2))
      const offer = offers.find(item => Number(item.id) === offerId)
      if (offer) {
        available += Number(offer.quantity)
        offer.status = 4
      }
    }
    else if (path.endsWith('/customer/services/101/start')) {
      const payload = request.postDataJSON() as Record<string, unknown>
      startPayloads.push(payload)
      const instanceId = 201 + instances.length
      const sliceQuantity = Number(payload.quantity)
      available -= sliceQuantity
      instances.push({
        id: instanceId, status: 2, quantity: sliceQuantity.toFixed(4), create_time: 1_785_000_000,
        handler: null,
        cancel_requests: [], adjustments: [],
      })
      data = { id: instanceId }
    }
    else if (/\/customer\/service-redemptions\/\d+\/cancel$/.test(path)) {
      const instanceId = Number(path.split('/').at(-2))
      const instance = instances.find(item => Number(item.id) === instanceId)
      if (instance) instance.cancel_requests = [{ id: 8, status: 1, reason: '时间冲突' }]
    }
    else if (path.endsWith('/customer/services/101')) data = entitlement()
    else if (path.endsWith('/customer/services')) data = { total: 1, page: 1, limit: 20, list: [entitlement()] }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('http://demo.shop.lostsky.work:5179/services')
  await expect(page.getByRole('heading', { name: '我的服务权益', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: /三小时陪玩/ }).click()
  await expect(page.getByText('可用额度').locator('..')).toContainText('3.0 小时')
  await page.locator('.n-select').nth(1).click()
  const handlerOption = page.locator('.ls-entity-select-menu:visible .n-base-select-option').first()
  const handlerOptionBox = await handlerOption.boundingBox()
  const handlerIconBox = await handlerOption.locator('.ls-entity-select-option__icon').boundingBox()
  expect(handlerOptionBox?.height).toBeLessThanOrEqual(66)
  expect(handlerIconBox?.height).toBeLessThan(handlerOptionBox?.height ?? 0)
  await expect(handlerOption).toContainText('成员')
  await expect(handlerOption).toContainText('@qingkong-handler')
  await page.getByText('青空接单人', { exact: true }).last().click()
  await page.locator('.resource-fields input').first().fill('明天下午')
  await page.getByRole('button', { name: '发送接单邀请' }).click()
  await expect.poll(() => offerPayloads.length).toBe(1)
  expect(offerPayloads[0]).toMatchObject({ quantity: '0.5', handler_entity_id: 11 })
  await expect(page.getByRole('heading', { name: '指定接单邀请' })).toBeVisible()
  await expect(page.getByText('待确认邀请不会自动过期；对方处理前，你可以随时取消。')).toBeVisible()
  await expect(page.getByText(/有效至/)).toHaveCount(0)
  await page.getByRole('button', { name: '取消邀请' }).click()
  await expect(page.getByText(/#301 · 已取消/)).toBeVisible()
  await expect(page.getByRole('button', { name: '取消邀请' })).toHaveCount(0)
  await expect(page.getByText('可用额度').locator('..')).toContainText('3.0 小时')

  await page.locator('.n-select').first().click()
  await page.getByText('公开召唤（立即进入核销中）', { exact: true }).last().click()
  await page.locator('.resource-fields input').first().fill('今晚十二点')
  await page.getByRole('button', { name: '发布公开任务' }).click()
  await expect.poll(() => startPayloads.length).toBe(1)
  expect(startPayloads[0]).toMatchObject({ quantity: '0.5', handler_entity_id: 0 })
  await expect(page.getByText(/未分配接单人/)).toBeVisible()

  await page.getByPlaceholder('例如：未通过、临时无法履约').first().fill('时间冲突')
  await page.getByRole('button', { name: '申请取消' }).first().click()
  await expect(page.getByText('取消申请正在等待处理')).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('http://demo.shop.lostsky.work:5179/services')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  await expect(page.getByRole('link', { name: '我的服务' })).toBeVisible()
})

test('transaction service redemption supports management and fixed 390px navigation', async ({ page }) => {
  const pageErrors: string[] = []
  const consoleErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  const actorToken = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamMember', id: 11 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: actorToken, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  let completed = false
  let rejected = false
  let completePayload: Record<string, unknown> | null = null
  let rejectPayload: Record<string, unknown> | null = null
  let adjustmentPayload: Record<string, unknown> | null = null
  const entity = { id: 11, entityable_type: 'teamMember', entityable_id: 1, type: 'member', slug: 'handler', name: '青空接单人', profile: { name: '青空接单人' } }
  const customer = { id: 31, profile: { name: '晚风顾客' } }
  const resources = [1, 2, 3].map(index => ({
    index,
    quantity: '1.0000',
    redemption_fields: [
      { id: 5, name: '需求说明', value_type: 'text', input_type: 'textarea', fill_stage: 'customer', is_required: 1, value: { value_text: `第${index}份需求` } },
      { id: 6, name: '服务结果', value_type: 'text', input_type: 'textarea', fill_stage: 'manager', is_required: 1, value: null },
    ],
  }))
  const service = () => ({
    id: 101, status: rejected ? 1 : completed ? 3 : 2, status_code: rejected ? 1 : completed ? 3 : 2, status_label: rejected ? '未核销' : completed ? '已核销' : '核销中', expire_time: 1_900_000_000, started_at: 1_785_000_000,
    completed_at: completed ? 1_785_003_600 : null, quantity: '3.0000', memo: '三份资料分别交付',
    entitlement: { id: 91, unit_name: '份', quantity_step: '1.0000' },
    service: { name: '三份独立方案' }, customer,
    handler_entity_id: 11, handler: entity, cancel_requests: [],
    adjustments: [], capabilities: { manage: true, approve_cancel: true },
    redemption_fields: resources[0].redemption_fields,
    redemption_resources: resources,
  })
  await page.route('http://demo.transaction.lostsky.work:5177/api/**', async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    let data: unknown = null
    if (path.endsWith('/workspace/access')) data = {
      team: { id: 1, slug: 'demo', name: '青空团队' },
      permissions: ['transaction.read', 'transaction.write', 'transaction.report.read', 'service.redemption.manage'],
      abilities: { transaction: { enabled: true, level: 1, expire_time: 0, reason: null, label: '记账' } },
      identity: { type: 'teamMember', entity_id: 11, name: '青空接单人', slug: 'handler', avatar: '' },
    }
    else if (path.endsWith('/service/101/handlers')) data = [{ entity_id: 11, subject: entity }]
    else if (path.endsWith('/service/101/adjustments')) adjustmentPayload = request.postDataJSON()
    else if (path.endsWith('/service/101/complete')) { completePayload = request.postDataJSON(); completed = true }
    else if (path.endsWith('/service/101/reject')) { rejectPayload = request.postDataJSON(); rejected = true }
    else if (path.endsWith('/service/101')) data = service()
    else if (path.endsWith('/service')) data = { total: 1, page: 1, limit: 20, list: [service()] }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('http://demo.transaction.lostsky.work:5177/services')
  await expect(page.locator('#workspace').getByRole('heading', { name: '权益核销', level: 1 }).last()).toBeVisible()
  await expect(page.locator('.service-meta')).toContainText('核销中')
  await page.getByRole('link', { name: /三份独立方案/ }).click()
  const backToServices = page.getByRole('link', { name: '返回核销' })
  await expect(backToServices.or(page.getByText('页面暂时无法显示'))).toBeVisible()
  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
  await expect(backToServices).toHaveAttribute('href', '/services')
  await expect(page.getByRole('heading', { name: /第 1 份/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: /第 2 份/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: /第 3 份/ })).toBeVisible()
  await expect(page.getByText('第1份需求')).toBeVisible()
  await expect(page.getByText('第2份需求')).toBeVisible()
  await expect(page.getByText('第3份需求')).toBeVisible()
  await page.locator('#fee-name input').fill('额外时段')
  const feePrice = page.locator('#fee-price input')
  await feePrice.fill('')
  await feePrice.press('Tab')
  await expect(page.getByRole('button', { name: '提交顾客确认' })).toBeDisabled()
  await page.locator('#fee-quantity input').fill('2')
  await feePrice.fill('30')
  const feeCost = page.locator('#fee-cost input')
  await feeCost.fill('10')
  await feeCost.press('Tab')
  await expect(page.getByText('¥60.00', { exact: true })).toBeVisible()
  await expect(page.getByText('¥50.00', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '提交顾客确认' }).click()
  await expect(page.getByText(/顾客需要另行确认并支付 ¥60\.00；内部成本 ¥10\.00，预计可分成 ¥50\.00/)).toBeVisible()
  await page.getByRole('button', { name: '提交顾客确认', exact: true }).last().click()
  await expect.poll(() => adjustmentPayload).toMatchObject({ name: '额外时段', quantity: 2, unit_price: '30.00', cost: '10.00' })
  await page.getByPlaceholder('说明需要顾客修改或重新发起的原因').fill('三份交付资料需要分别修正')
  await page.getByRole('button', { name: '驳回核销', exact: true }).click()
  await page.getByRole('button', { name: '确认驳回', exact: true }).click()
  await expect.poll(() => rejectPayload).toMatchObject({ reason: '三份交付资料需要分别修正' })

  rejected = false
  await page.reload()
  const resultFields = page.getByRole('textbox', { name: /服务结果/ })
  await expect(resultFields).toHaveCount(3)
  await resultFields.nth(0).fill('第一份已完成')
  await resultFields.nth(1).fill('第二份已完成')
  await resultFields.nth(2).fill('第三份已完成')
  await page.getByRole('button', { name: '通过核销', exact: true }).click()
  await page.getByRole('button', { name: '通过核销', exact: true }).last().click()
  await expect.poll(() => completePayload).toMatchObject({ field_values: [{ 6: '第一份已完成' }, { 6: '第二份已完成' }, { 6: '第三份已完成' }] })
  await expect(page.getByText(/已核销/).first()).toBeVisible()
  expect(pageErrors).toEqual([])

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('http://demo.transaction.lostsky.work:5177/services')
  const mobileNav = page.getByRole('navigation', { name: '移动端导航' })
  await expect(mobileNav.getByText('概览', { exact: true })).toBeVisible()
  await expect(mobileNav.getByText('团队流水', { exact: true })).toBeVisible()
  await expect(mobileNav.getByText('经营统计', { exact: true })).toBeVisible()
  await expect(mobileNav.getByText('更多', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
})

test('personal handler workspace confirms invitations, claims, completes and returns own work', async ({ page }) => {
  const actorToken = `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type: 'teamMember', id: 11 } })).toString('base64url')}.x`
  await page.context().addCookies([{ name: 'lostsky_token', value: actorToken, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
  const customer = { id: 31, profile: { name: '晚风顾客' } }
  const entitlement = { id: 91, unit_name: '小时', quantity_step: '0.5000' }
  const fields = [
    { id: 5, name: '微信号', value_type: 'string', input_type: 'text', fill_stage: 'customer', is_required: 1, value: 'wx-candidate' },
    { id: 6, name: '服务结果', value_type: 'text', input_type: 'textarea', fill_stage: 'manager', is_required: 1, value: null },
  ]
  let acceptPayload: Record<string, unknown> | null = null
  let claimPayload: Record<string, unknown> | null = null
  let personalCompletePayload: Record<string, unknown> | null = null
  const offers: Array<Record<string, unknown>> = [
    { id: 71, status: 1, quantity: '0.5', create_time: 1_785_000_000, handler_cut: '40.00', total_price: '50.00', service: { name: '候选人面试与岗位匹配沟通服务' }, customer, entitlement, redemption_fields: fields },
    { id: 72, status: 1, quantity: '1.0', create_time: 1_785_000_000, handler_cut: '80.00', total_price: '100.00', service: { name: '候选人面试' }, customer, entitlement, redemption_fields: fields },
  ]
  const available: Array<Record<string, unknown>> = [
    { id: 81, status: 2, quantity: '1.0', expire_time: 1_900_000_000, handler_cut: '80.00', service: { name: '公开陪玩' }, customer, entitlement, redemption_fields: fields },
  ]
  const assigned: Array<Record<string, unknown>> = [
    { id: 91, status: 2, status_label: '核销中', quantity: '0.5', expire_time: 1_900_000_000, handler_cut: '40.00', service: { name: '我的陪玩任务' }, customer, entitlement },
  ]
  await page.route('http://demo.transaction.lostsky.work:5177/api/**', async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    let data: unknown = null
    if (path.endsWith('/workspace/access')) data = {
      team: { id: 1, slug: 'demo', name: '青空团队' }, permissions: [],
      abilities: { transaction: { enabled: true, level: 1, expire_time: 0, reason: null, label: '记账' } },
      identity: { type: 'teamMember', entity_id: 11, name: '青空接单人', slug: 'handler', avatar: '' },
    }
    else if (/\/personal\/service-offers\/\d+\/accept$/.test(path)) {
      acceptPayload = request.postDataJSON()
      const offerId = Number(path.split('/').at(-2)); const index = offers.findIndex(item => item.id === offerId)
      const offer = offers.splice(index, 1)[0]
      const values = ((acceptPayload.field_values ?? []) as Array<Record<string, unknown>>)[0] ?? {}
      assigned.push({ ...offer, id: 100 + offerId, status: 2, status_label: '核销中', redemption_fields: fields.map(field => field.id === 6 ? { ...field, value: values[6] } : field) })
      data = { id: 100 + offerId }
    }
    else if (/\/personal\/service-offers\/\d+\/reject$/.test(path)) {
      const offerId = Number(path.split('/').at(-2)); offers.splice(offers.findIndex(item => item.id === offerId), 1)
    }
    else if (/\/personal\/services\/\d+\/claim$/.test(path)) {
      claimPayload = request.postDataJSON()
      const taskId = Number(path.split('/').at(-2)); const task = available.splice(available.findIndex(item => item.id === taskId), 1)[0]
      const claimedQuantity = Number(claimPayload.quantity)
      const remainder = Number(task.quantity) - claimedQuantity
      const values = ((claimPayload.field_values ?? []) as Array<Record<string, unknown>>)[0] ?? {}
      assigned.push({ ...task, quantity: claimedQuantity.toFixed(1), status_label: '核销中', redemption_fields: fields.map(field => field.id === 6 ? { ...field, value: values[6] } : field) })
      if (remainder > 0) available.push({ ...task, id: 82, quantity: remainder.toFixed(1) })
      data = { id: taskId }
    }
    else if (/\/personal\/services\/\d+\/return$/.test(path)) {
      const taskId = Number(path.split('/').at(-2)); const task = assigned.splice(assigned.findIndex(item => item.id === taskId), 1)[0]
      available.push(task)
    }
    else if (/\/personal\/services\/\d+\/complete$/.test(path)) {
      personalCompletePayload = request.postDataJSON()
      const taskId = Number(path.split('/').at(-2)); const task = assigned.find(item => item.id === taskId)
      if (task) { task.completion_requested_at = 1_785_100_000; task.completion_due_at = 1_785_103_600 }
    }
    else if (/\/personal\/service-offers\/\d+$/.test(path)) data = offers.find(item => item.id === Number(path.split('/').at(-1)))
    else if (/\/personal\/services\/available\/\d+$/.test(path)) data = available.find(item => item.id === Number(path.split('/').at(-1)))
    else if (/\/personal\/services\/\d+$/.test(path)) data = assigned.find(item => item.id === Number(path.split('/').at(-1)))
    else if (path.endsWith('/personal/services')) data = { total: assigned.length, page: 1, limit: 20, list: assigned, available, offers }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
  })

  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto('http://demo.transaction.lostsky.work:5177/personal/services')
  await expect(page.getByRole('heading', { name: '待我确认' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '我可以接' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '我的接单', level: 2 })).toBeVisible()
  const taskPanels = page.locator('.personal-service-lists > .ls-panel')
  await expect(taskPanels).toHaveCount(3)
  const panelGeometry = await taskPanels.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return { width: Math.round(box.width), borderWidth: style.borderTopWidth, borderStyle: style.borderTopStyle }
  }))
  expect(new Set(panelGeometry.map(panel => panel.width)).size).toBe(1)
  expect(panelGeometry.every(panel => panel.borderWidth === '1px' && panel.borderStyle === 'solid')).toBe(true)
  const firstTask = taskPanels.first().locator('.task-row').first()
  const desktopTaskLayout = await firstTask.evaluate(element => {
    const style = getComputedStyle(element)
    return { columns: style.gridTemplateColumns.split(' ').length, areas: style.gridTemplateAreas }
  })
  expect(desktopTaskLayout.columns).toBe(3)
  expect(desktopTaskLayout.areas).toContain('summary customer actions')
  const desktopColumnGeometry = await taskPanels.evaluateAll(panels => panels.map(panel => {
    const task = panel.querySelector('.task-row')
    const customer = task?.querySelector('.task-customer')
    const actions = task?.querySelector('.task-actions')
    if (!(customer instanceof HTMLElement) || !(actions instanceof HTMLElement)) return null
    return {
      customerLeft: Math.round(customer.getBoundingClientRect().left),
      actionsRight: Math.round(actions.getBoundingClientRect().right),
    }
  }))
  expect(desktopColumnGeometry.every(Boolean)).toBe(true)
  expect(new Set(desktopColumnGeometry.map(item => item?.customerLeft)).size).toBe(1)
  expect(new Set(desktopColumnGeometry.map(item => item?.actionsRight)).size).toBe(1)
  const desktopCustomer = firstTask.locator('.task-customer')
  expect(await desktopCustomer.evaluate(element => getComputedStyle(element).borderLeftWidth)).toBe('1px')
  expect(await firstTask.locator('.task-field-section').evaluate(element => getComputedStyle(element).gridArea)).toBe('fields')
  await expect(page.getByText('wx-candidate').first()).toBeVisible()

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  await page.evaluate(() => { document.documentElement.style.removeProperty('font-size') })
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await firstTask.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(1)
  await expect(firstTask.locator('.task-actions').getByRole('link', { name: '查看详情' })).toHaveCount(1)
  await expect(firstTask.getByRole('button')).toHaveCount(0)
  for (const panel of await taskPanels.all()) {
    expect(await panel.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(false)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('http://demo.transaction.lostsky.work:5177/personal/service-offers/71')
  const acceptButton = page.getByRole('button', { name: '填写并接受邀请' })
  await expect(acceptButton).toBeDisabled()
  await page.getByRole('textbox', { name: '服务结果' }).fill('邀请接单资料')
  await acceptButton.click()
  await expect.poll(() => acceptPayload).toMatchObject({ field_values: [{ 6: '邀请接单资料' }] })

  await page.goto('http://demo.transaction.lostsky.work:5177/personal/service-offers/72')
  await page.getByRole('button', { name: '拒绝邀请' }).click()

  await page.goto('http://demo.transaction.lostsky.work:5177/personal/services/available/81')
  await expect(page.getByText('待接单', { exact: true })).toBeVisible()
  await expect(page.getByText('未结单', { exact: true })).toBeVisible()
  await expect(page.getByText('任务编号', { exact: true })).toBeVisible()
  await expect(page.locator('.summary-strip > div')).toHaveCount(5)
  const detailLayout = await page.locator('.field-columns').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)
  expect(detailLayout).toBe(2)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.locator('.field-columns').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  await page.setViewportSize({ width: 1280, height: 900 })
  await expect(page.locator('#claim-quantity input')).toHaveValue('0.5')
  const claimButton = page.getByRole('button', { name: '填写并进行接单' })
  await expect(claimButton).toBeDisabled()
  await page.getByRole('textbox', { name: '服务结果' }).fill('部分接单资料')
  await claimButton.click()
  await expect.poll(() => claimPayload).toMatchObject({ quantity: 0.5, field_values: [{ 6: '部分接单资料' }] })

  await page.goto('http://demo.transaction.lostsky.work:5177/personal/services')
  await expect(page.getByText('0.5 小时').first()).toBeVisible()
  await page.getByRole('button', { name: '退回任务' }).first().click()
  const returnReason = page.getByLabel('退回原因').first()
  await expect(returnReason).toBeVisible()
  await expect(page.getByRole('button', { name: '确认退回' }).first()).toBeDisabled()
  await returnReason.fill('临时无法继续')
  await page.getByRole('button', { name: '确认退回' }).first().click()

  await page.goto('http://demo.transaction.lostsky.work:5177/personal/services/81')
  await expect(page.getByText('已接单', { exact: true })).toBeVisible()
  await expect(page.getByText('未结单', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '接单字段' })).toBeVisible()
  await expect(page.getByText('部分接单资料')).toBeVisible()
  await page.getByRole('button', { name: '请求结单', exact: true }).click()
  await expect.poll(() => personalCompletePayload).toEqual({})
  await page.goto('http://demo.transaction.lostsky.work:5177/personal/services/81')
  await expect(page.getByText('待顾客确认', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '请求结单', exact: true })).toHaveAttribute('aria-disabled', 'true')
  await expect(page.getByText('顾客确认截止：', { exact: false })).toBeVisible()
  await expect(page.getByRole('heading', { name: '顾客字段' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '接单字段' })).toBeVisible()
  await expect(page.getByText('部分接单资料')).toBeVisible()
  await expect(page.getByRole('button', { name: '退回公开接单池' })).toHaveCount(0)
})
