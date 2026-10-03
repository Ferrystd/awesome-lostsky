import { expect, test, type Page } from '@playwright/test'

const accountOrigin = 'http://account.lostsky.work:5174'
const teamOrigin = 'http://demo.team.lostsky.work:5175'

function token(type: 'team' | 'teamMember' = 'team') {
  return `x.${Buffer.from(JSON.stringify({ sub: 21, act: { type, id: 1 } })).toString('base64url')}.x`
}

async function setAuth(page: Page, value = token()) {
  await page.context().addCookies([{ name: 'lostsky_token', value, domain: '.lostsky.work', path: '/' }])
}

test.describe('个人入队码', () => {
  test('团队列表为空或加载失败时仍显示入队码，并支持键盘复制、失败后原处再生成', async ({ page }) => {
    await setAuth(page)
    let joinCodeCalls = 0
    let listMode: 'empty' | 'error' = 'empty'
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => undefined } })
    })
    await page.route(`${accountOrigin}/api/**`, async route => {
      const url = new URL(route.request().url())
      if (url.pathname.endsWith('/team/index')) {
        if (listMode === 'error') {
          await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ code: 503, message: '团队列表暂时不可用', data: null }) })
        } else {
          await route.fulfill({ json: { code: 0, message: 'ok', data: [] } })
        }
        return
      }
      if (url.pathname.endsWith('/team/join-code')) {
        joinCodeCalls += 1
        if (joinCodeCalls === 1) {
          await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ code: 503, message: '入队码暂时不可用', data: null }) })
        } else {
          await route.fulfill({ json: { code: 0, message: 'ok', data: { code: 'ABCDEF0123456789ABCD', expires_at: Math.floor(Date.now() / 1000) + 1800 } } })
        }
        return
      }
      await route.fulfill({ json: { code: 0, message: 'ok', data: {} } })
    })

    await page.goto(`${accountOrigin}/teams`)
    const joinButton = page.locator('.join-code button')
    await expect(joinButton).toBeVisible()
    await expect(page.getByText('还没有工作空间')).toBeVisible()
    await expect(page.getByText('暂不可用，点击生成')).toBeVisible()
    await expect(joinButton).toHaveCSS('min-height', '44px')
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)

    await joinButton.focus()
    await page.keyboard.press('Enter')
    const copyButton = page.getByRole('button', { name: '复制入队码' })
    await expect(copyButton).toBeVisible()
    await expect(page.locator('.join-code-value')).toHaveText('ABCDEF0123456789ABCD')
    await expect.poll(() => joinCodeCalls).toBe(2)
    await expect(copyButton).toHaveCSS('min-height', '44px')

    listMode = 'error'
    await page.reload()
    await expect(page.getByRole('alert')).toContainText('服务暂时不可用')
    await expect(page.locator('.join-code-value')).toHaveText('ABCDEF0123456789ABCD')
    await page.setViewportSize({ width: 320, height: 640 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  })
})

test.describe('成员个人入队码表单', () => {
  test('有邀请权限时只提交 trim 后的大写入队码并跳转成员列表', async ({ page }) => {
    await setAuth(page)
    let payload: Record<string, unknown> | null = null
    await page.route(`${teamOrigin}/api/**`, async route => {
      const url = new URL(route.request().url())
      if (url.pathname.endsWith('/access')) {
        await route.fulfill({ json: { code: 0, message: 'ok', data: { permissions: ['team.member.invite'], abilities: {}, identity: { type: 'team' } } } })
        return
      }
      if (url.pathname.endsWith('/member/add')) {
        payload = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>
        await route.fulfill({ json: { code: 0, message: 'ok', data: {} } })
        return
      }
      await route.fulfill({ json: { code: 0, message: 'ok', data: {} } })
    })

    await page.goto(`${teamOrigin}/member-add`)
    const input = page.getByLabel('个人入队码')
    await expect(input).toBeVisible()
    await expect(page.getByLabel('用户 ID')).toHaveCount(0)
    const submit = page.getByRole('button', { name: '添加成员' })
    await expect(submit).toHaveAttribute('aria-disabled', 'true')
    await expect(submit).not.toHaveAttribute('disabled')
    await submit.click({ force: true })
    await expect(page.getByText('请填写个人入队码', { exact: true })).toHaveCount(1)
    expect(payload).toBeNull()
    await input.fill('invalid')
    await submit.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByText('请填写有效的 20 位个人入队码', { exact: true })).toHaveCount(1)
    expect(payload).toBeNull()
    await input.fill('  abcdef0123456789abcd  ')
    await submit.focus()
    await page.keyboard.press('Enter')
    await expect.poll(() => payload).toEqual({ join_code: 'ABCDEF0123456789ABCD' })
    await expect(page).toHaveURL(/\/members$/)
  })

  test('没有邀请权限时提交按钮禁用且不发送请求，320px 与键盘操作无溢出', async ({ page }) => {
    await setAuth(page)
    let addCalls = 0
    await page.route(`${teamOrigin}/api/**`, async route => {
      const url = new URL(route.request().url())
      if (url.pathname.endsWith('/access')) {
        await route.fulfill({ json: { code: 0, message: 'ok', data: { permissions: [], abilities: {}, identity: { type: 'team' } } } })
        return
      }
      if (url.pathname.endsWith('/member/add')) addCalls += 1
      await route.fulfill({ json: { code: 0, message: 'ok', data: {} } })
    })

    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto(`${teamOrigin}/member-add`)
    const input = page.getByLabel('个人入队码')
    const submit = page.getByRole('button', { name: '添加成员' })
    await input.fill('ABCDEF0123456789ABCD')
    await expect(submit).toBeDisabled()
    await input.focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(100)
    expect(addCalls).toBe(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
    expect((await input.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    expect((await submit.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  })
})


test.describe('入队码可选代填', () => {
  const fields = [{ id: 101, field_key: 'name', name: '入职姓名', input_type: 'text', is_apply_required: 1 }, { id: 102, field_key: 'note', name: '相关经验', input_type: 'textarea' }, { id: 103, field_key: 'attachment', name: '入职附件', input_type: 'upload' }]
  for (const mode of ['fill', 'skip-after-edit', 'load-error'] as const) {
    test(mode, async ({ page }) => {
      await setAuth(page)
      let payload: unknown
      let requests = 0
      let uploads = 0
      let failSave = true
      await page.route(teamOrigin + '/api/**', async route => {
        const path = new URL(route.request().url()).pathname
        let data: unknown = {}
        if (path.endsWith('/access')) data = { permissions: ['team.member.invite'], abilities: {}, identity: { type: 'team' } }
        if (path.endsWith('/member/joinForm')) {
          requests++
          if (mode === 'load-error') return route.fulfill({ status: 503, json: { code: 503, message: '入职表单暂时不可用', data: null } })
          data = { fields, file_upload: { available: true } }
        }
        if (path.endsWith('/member/joinUpload')) { uploads++; data = { id: 501 } }
        if (path.endsWith('/member/add')) {
          payload = route.request().postDataJSON()
          if (mode === 'fill' && failSave) { failSave = false; return route.fulfill({ status: 422, json: { code: 1, message: '表单保存失败', data: null } }) }
        }
        if (path.endsWith('/member/index')) data = []
        await route.fulfill({ json: { code: 0, message: 'ok', data } })
      })
      await page.goto(teamOrigin + '/member-add')
      await page.getByLabel('个人入队码').fill('abcdef0123456789abcd')
      const toggle = page.getByRole('switch', { name: '代填入职表单' })
      const submit = page.getByRole('button', { name: '添加成员' })
      await expect(toggle).not.toBeChecked()
      await expect(submit).toBeEnabled()
      expect(requests).toBe(0)
      await toggle.click()
      if (mode === 'load-error') {
        await expect(page.locator('#member-profile-form [role=alert]')).toBeVisible()
        await expect(submit).toBeDisabled()
        await toggle.click()
      } else {
        await expect(page.getByRole('textbox', { name: '入职姓名', exact: true })).toBeVisible()
        await expect(submit).toBeDisabled()
        await expect(submit).not.toHaveAttribute('disabled')
        await submit.focus()
        await page.keyboard.press('Space')
        await expect(page.getByText('请补齐入职表单必填项', { exact: true })).toHaveCount(1)
        expect(payload).toBeUndefined()
        await page.getByRole('textbox', { name: '入职姓名', exact: true }).fill('青空')
        await page.getByRole('textbox', { name: '相关经验', exact: true }).fill('两年经验')
        await expect(page.getByLabel('补充说明')).toHaveCount(0)
        const codeBox = (await page.getByLabel('个人入队码').boundingBox())!
        const nameBox = (await page.getByRole('textbox', { name: '入职姓名', exact: true }).boundingBox())!
        expect(Math.abs(codeBox.x - nameBox.x)).toBeLessThanOrEqual(1)
        expect(Math.abs(codeBox.width - nameBox.width)).toBeLessThanOrEqual(1)
        if (mode === 'skip-after-edit') await toggle.click()
        else {
          await page.locator('.join-application-fields input[type=file]').setInputFiles({ name: 'intro.txt', mimeType: 'text/plain', buffer: Buffer.from('intro') })
          await expect.poll(() => uploads).toBe(1)
          await expect(page.getByRole('button', { name: '重新选择文件' })).toBeVisible()
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
      await expect(submit).toBeEnabled()
      await submit.scrollIntoViewIfNeeded()
      const bottomNav = page.getByRole('navigation', { name: '移动端导航' })
      if (await bottomNav.isVisible()) {
        const actionBox = (await submit.boundingBox())!
        const navBox = (await bottomNav.boundingBox())!
        expect(actionBox.y + actionBox.height).toBeLessThanOrEqual(navBox.y)
      }
      await submit.click()
      if (mode === 'fill') {
        await expect(page.getByText('表单保存失败', { exact: true })).toBeVisible()
        await expect(page.getByRole('textbox', { name: '入职姓名', exact: true })).toHaveValue('青空')
        await expect(page.getByLabel('个人入队码')).toHaveValue('abcdef0123456789abcd')
        expect(payload).toEqual({ join_code: 'ABCDEF0123456789ABCD', join_form: { values: { name: '青空', note: '两年经验', attachment: '501' } } })
        await submit.click()
      } else expect(payload).toEqual({ join_code: 'ABCDEF0123456789ABCD' })
      await expect(page).toHaveURL(/\/members$/)
    })
  }
})


test('代填加载期间阻止提交，空字段表单可保存，窄屏无溢出', async ({ page }) => {
  await setAuth(page)
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  let payload: unknown
  await page.route(teamOrigin + '/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = {}
    if (path.endsWith('/access')) data = { permissions: ['team.member.invite'], abilities: {}, identity: { type: 'team' } }
    if (path.endsWith('/member/joinForm')) { await gate; data = { fields: [], file_upload: { available: false } } }
    if (path.endsWith('/member/add')) payload = route.request().postDataJSON()
    if (path.endsWith('/member/index')) data = []
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
  await page.goto(teamOrigin + '/member-add')
  await page.getByLabel('个人入队码').fill('ABCDEF0123456789ABCD')
  await page.getByRole('switch', { name: '代填入职表单' }).click()
  await expect(page.getByRole('status', { name: '正在读取入职表单' })).toBeVisible()
  await expect(page.getByRole('button', { name: '添加成员' })).toBeDisabled()
  release()
  await expect(page.getByText('暂无可代填的入职字段')).toBeVisible()
  await expect(page.getByLabel('补充说明')).toHaveCount(0)
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  }
  await page.setViewportSize({ width: 320, height: 900 })
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
  expect(await page.evaluate(() => Array.from(document.querySelectorAll('body *')).filter(element => {
    const rect = element.getBoundingClientRect()
    return rect.width > 0 && rect.right > document.documentElement.clientWidth + 1 && rect.left >= 0
  }).map(element => ({ tag: element.tagName, class: element.className, width: element.getBoundingClientRect().width })))).toEqual([])
  await page.getByRole('button', { name: '添加成员' }).click()
  await expect(page).toHaveURL(/\/members$/)
  expect(payload).toEqual({ join_code: 'ABCDEF0123456789ABCD', join_form: { values: {} } })
})

test('自行申请继续使用共享入职字段并提交原契约', async ({ page }) => {
  let payload: unknown
  await page.route(teamOrigin + '/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = []
    if (path.endsWith('/join/form')) data = { purpose_code: 'join', refill_required: true, fields: [{ id: 1, field_key: 'name', name: '入职姓名', input_type: 'text', is_apply_required: 1 }, { id: 2, field_key: 'skills', name: '擅长项目', input_type: 'checkbox', options: ['设计', '运营'] }], file_upload: { available: false } }
    if (path.endsWith('/join/apply')) payload = route.request().postDataJSON()
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
  await page.goto(teamOrigin + '/join')
  await expect(page.getByLabel('补充说明')).toHaveCount(0)
  await page.getByRole('textbox', { name: '入职姓名', exact: true }).fill('青空')
  await page.getByRole('checkbox', { name: '设计' }).check()
  await page.getByRole('button', { name: '提交加入申请' }).click()
  await expect.poll(() => payload).toEqual({ values: { name: '青空', skills: ['设计'] } })
})
