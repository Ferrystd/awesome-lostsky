import { expect, test, type Page } from './fixtures'

const origin = 'http://account.lostsky.work:5174'
const credential = 'memory-only-recovery-token'
const originalPhone = '13800138000'
const nextPhone = '13900139000'

type Call = { path: string; body: Record<string, string> }
async function mockRecovery(page: Page, options: { failSave?: boolean; expired?: boolean; lifetime?: number } = {}) {
  const calls: Call[] = []
  await page.route(`${origin}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '')
    const body = route.request().postDataJSON() ?? {}
    calls.push({ path, body })
    if (path === '/recovery/verify') {
      await route.fulfill({ json: { code: 0, data: { recovery_token: credential, expires_in: options.lifetime ?? 600 } } })
    } else if (path.endsWith('/sms')) {
      await route.fulfill({ json: { code: 0, data: { expires_in: 300, retry_after: 60 } } })
    } else if (options.expired) {
      options.expired = false
      await route.fulfill({ status: 410, json: { code: 410, message: '恢复凭据已失效，请重新验证当前绑定手机号' } })
    } else if (options.failSave) {
      options.failSave = false
      await route.fulfill({ status: 422, json: { code: 422, message: '提交未完成，请检查输入' } })
    } else {
      await route.fulfill({ json: { code: 0, data: null } })
    }
  })
  return calls
}
async function verify(page: Page) {
  await page.locator('#recovery-phone').fill(originalPhone)
  await page.locator('#recovery-code').fill('123456')
  await page.locator('form button[type=submit]').click()
  await expect(page.locator('[aria-label="恢复方式"]')).toBeVisible()
}
async function assertNoTokenStorage(page: Page) {
  expect(await page.evaluate(() => JSON.stringify([localStorage, sessionStorage, document.cookie]))).not.toContain(credential)
  expect(page.url()).not.toContain(credential)
  expect(await page.evaluate(() => localStorage.getItem('lostsky_token'))).toBeNull()
  expect(await page.context().cookies()).not.toEqual(expect.arrayContaining([expect.objectContaining({ name: 'lostsky_token' })]))
}

test('account recovery entry copy is exactly 无法登录', async ({ page }) => {
  await page.goto(`${origin}/login`)
  const entry = page.getByRole('link', { name: '无法登录', exact: true })
  await expect(entry).toHaveAttribute('href', '/recovery')
  expect((await entry.boundingBox())!.height).toBeGreaterThanOrEqual(44)
})

test('account recovery resets password, preserves failed input and safe redirect without login', async ({ page }) => {
  const calls = await mockRecovery(page, { failSave: true })
  const redirect = 'http://demo.team.lostsky.work:5175/personal'
  await page.goto(`${origin}/login?redirect=${encodeURIComponent(redirect)}`)
  await page.locator('a[href^="/recovery"]').click()
  await page.locator('#recovery-phone').fill(originalPhone)
  await page.locator('form button[type=button]').click()
  await expect(page.locator('form button[type=button]')).toBeDisabled()
  expect(calls[0]).toEqual({ path: '/verification/sms', body: { phone: originalPhone, purpose: 'recovery' } })
  await page.locator('#recovery-code').fill('123456')
  await page.locator('form button[type=submit]').click()
  await page.locator('#recovery-password-choice').click()
  await page.locator('#recovery-password').fill('new-password')
  await page.locator('#recovery-confirmation').fill('different')
  await page.locator('form button[type=submit]').click()
  expect(calls.some(call => call.path === '/recovery/password')).toBe(false)
  await page.locator('#recovery-confirmation').fill('new-password')
  await page.locator('form button[type=submit]').click()
  await expect(page.getByRole('alert')).toContainText('提交未完成')
  await expect(page.locator('#recovery-password')).toHaveValue('new-password')
  await page.locator('form button[type=submit]').click()
  await expect(page.locator('form')).toHaveCount(0)
  expect(calls.filter(call => call.path === '/recovery/password')).toHaveLength(2)
  expect(calls.at(-1)).toEqual({ path: '/recovery/password', body: { recovery_token: credential, password: 'new-password' } })
  await assertNoTokenStorage(page)
  await page.locator('#recovery-login').click()
  await expect(page).toHaveURL(url => url.pathname === '/login' && url.searchParams.get('redirect') === redirect)
})

test('account recovery changes phone only after new SMS and clears code on number change', async ({ page }) => {
  const calls = await mockRecovery(page)
  await page.goto(`${origin}/recovery`)
  await verify(page)
  await page.locator('[aria-label="恢复方式"] button').nth(1).click()
  await page.locator('#recovery-new-phone').fill(nextPhone)
  await page.locator('#recovery-new-code').fill('old-code')
  await page.locator('#recovery-new-phone').fill('13700137000')
  await expect(page.locator('#recovery-new-code')).toHaveValue('')
  await page.locator('#recovery-new-phone').fill(nextPhone)
  await page.locator('form button[type=button]').first().click()
  expect(calls.at(-1)).toEqual({ path: '/recovery/phone/sms', body: { recovery_token: credential, phone: nextPhone } })
  await expect(page.locator('form button[type=button]').first()).toBeDisabled()
  await page.locator('#recovery-new-code').fill('654321')
  await page.locator('form button[type=submit]').click()
  await expect(page.locator('form')).toHaveCount(0)
  expect(calls.at(-1)).toEqual({ path: '/recovery/phone', body: { recovery_token: credential, phone: nextPhone, code: '654321' } })
  await assertNoTokenStorage(page)
})

test('account recovery expired credential and reload require original verification', async ({ page }) => {
  await mockRecovery(page, { expired: true })
  await page.goto(`${origin}/recovery`)
  await verify(page)
  await page.locator('#recovery-password-choice').click()
  await page.locator('#recovery-password').fill('new-password')
  await page.locator('#recovery-confirmation').fill('new-password')
  await page.locator('form button[type=submit]').click()
  await expect(page.locator('#recovery-phone')).toHaveValue(originalPhone)
  await expect(page.getByRole('alert')).toContainText('验证已失效')
  await verify(page)
  await assertNoTokenStorage(page)
  page.on('dialog', dialog => dialog.accept())
  await page.reload()
  await expect(page.locator('#recovery-phone')).toBeVisible()
  await expect(page.locator('[aria-label="恢复方式"]')).toHaveCount(0)
})

test('account recovery local expiry returns to verification', async ({ page }) => {
  await mockRecovery(page, { lifetime: 2 })
  await page.goto(`${origin}/recovery`)
  await verify(page)
  await expect(page.locator('#recovery-phone')).toBeVisible({ timeout: 6000 })
  await expect(page.getByRole('alert')).toContainText('验证已失效')
})

test('account recovery prevents concurrent saves and remains within supported widths', async ({ page }) => {
  await mockRecovery(page)
  let finish!: () => void
  const pending = new Promise<void>(resolve => { finish = resolve })
  let saves = 0
  await page.route(`${origin}/api/recovery/password`, async route => {
    saves += 1
    await pending
    await route.fulfill({ json: { code: 0, data: null } })
  })
  await page.goto(`${origin}/recovery`)
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  }
  await page.setViewportSize({ width: 320, height: 900 })
  await verify(page)
  await page.locator('#recovery-password-choice').click()
  await page.locator('#recovery-password').fill('new-password')
  await page.locator('#recovery-confirmation').fill('new-password')
  await page.locator('form button[type=submit]').click()
  await expect(page.locator('form button[type=submit]')).toBeDisabled()
  await expect(page.locator('#recovery-password')).toBeDisabled()
  await page.locator('form').evaluate(form => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) })
  expect(saves).toBe(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  finish()
  await expect(page.locator('form')).toHaveCount(0)
})


for (const purpose of ['login', 'register']) {
  test(`account recovery shared SMS keeps ${purpose} sending and submission contracts`, async ({ page }) => {
    const calls: Call[] = []
    await page.route(`${origin}/api/**`, async route => {
      const path = new URL(route.request().url()).pathname.replace('/api', '')
      calls.push({ path, body: route.request().postDataJSON() })
      if (path === '/verification/sms') await route.fulfill({ json: { code: 0, data: { retry_after: 60 } } })
      else await route.fulfill({ status: 422, json: { code: 422, message: '保留输入' } })
    })
    await page.goto(`${origin}/${purpose}`)
    await page.locator(`#${purpose}-phone`).fill(originalPhone)
    await page.locator('form button[type=button]').click()
    await expect(page.locator('form button[type=button]')).toBeDisabled()
    await page.locator(`#${purpose}-code`).fill('123456')
    if (purpose === 'register') {
      await page.locator('#register-password').fill('new-password')
      await page.locator('#register-confirm').fill('new-password')
    }
    await page.locator('form button[type=submit]').click()
    await expect(page.getByRole('alert')).toContainText('保留输入')
    expect(calls[0]).toEqual({ path: '/verification/sms', body: { phone: originalPhone, purpose } })
    expect(calls[1]).toEqual({ path: `/${purpose}/sms`, body: { phone: originalPhone, code: '123456', ...(purpose === 'register' ? { password: 'new-password' } : {}) } })
    await expect(page.locator(`#${purpose}-code`)).toHaveValue('123456')
  })
}

test('account recovery shared SMS ignores stale send feedback after number changes', async ({ page }) => {
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  await page.route(`${origin}/api/verification/sms`, async route => {
    await pending
    await route.fulfill({ json: { code: 0, data: { retry_after: 60 } } })
  })
  await page.goto(`${origin}/login`)
  await page.locator('#login-phone').fill(originalPhone)
  await page.locator('form button[type=button]').click()
  await page.locator('#login-code').fill('123456')
  await page.locator('#login-phone').fill(nextPhone)
  await expect(page.locator('#login-code')).toHaveValue('')
  release()
  await expect(page.locator('form button[type=button]')).toHaveText(/秒后重发/)
  await expect(page.locator('.field-message')).toHaveCount(0)
})

test('account recovery SMS failure preserves input and permits sending again', async ({ page }) => {
  let attempts = 0
  await page.route(`${origin}/api/verification/sms`, async route => {
    attempts += 1
    if (attempts === 1) await route.fulfill({ status: 422, json: { code: 422, message: '短信发送失败' } })
    else await route.fulfill({ json: { code: 0, data: { retry_after: 60 } } })
  })
  await page.goto(`${origin}/recovery`)
  await page.locator('#recovery-phone').fill(originalPhone)
  await page.locator('#recovery-code').fill('123456')
  await page.locator('form button[type=button]').click()
  await expect(page.getByRole('alert')).toContainText('短信发送失败')
  await expect(page.locator('#recovery-phone')).toHaveValue(originalPhone)
  await expect(page.locator('#recovery-code')).toHaveValue('123456')
  await expect(page.locator('form button[type=button]')).toBeEnabled()
  await page.locator('form button[type=button]').click()
  await expect(page.locator('form button[type=button]')).toBeDisabled()
  expect(attempts).toBe(2)
})
