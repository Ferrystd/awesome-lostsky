import { expect, test } from './fixtures'
import { selectSettingsGroup } from './helpers/team-settings'

const origin = process.env.TEAM_TEST_ORIGIN ?? 'http://demo.team.lostsky.work:5175'

test('settings categories retain drafts, attribute pending results and refresh schema safely', async ({ page }) => {
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/' }])
  const group = (name: string, label: string) => ({ app_name: name, label, description: '按业务管理设置', order: 1, settings: [{ key: 'text', label: '说明文字', description: '', type: 'string', control: 'input', value: `${name} baseline`, default: '', order: 1 }] })
  let apps = [group('entity', '人员'), group('chat', '聊天'), group('custom', '扩展业务')]
  let release: (() => void) | undefined
  let fail = false
  let reads = 0
  const payloads: any[] = []
  await page.route(`${origin}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname
    if (route.request().method() === 'POST' && path.endsWith('/setting')) {
      const payload = route.request().postDataJSON()
      payloads.push(payload)
      await new Promise<void>(resolve => { release = resolve })
      if (fail) return route.fulfill({ json: { code: 500, message: '本组保存失败', data: null } })
      const saved = apps.find(app => app.app_name === payload.app_name)
      if (saved) saved.settings[0].value = payload.settings.text
      return route.fulfill({ json: { code: 0, data: null } })
    }
    if (path.endsWith('/setting/schema')) reads++
    return route.fulfill({ json: { code: 0, data: path.endsWith('/access') ? { permissions: ['team'], abilities: {} } : { apps } } })
  })
  await page.goto(`${origin}/settings`)
  const field = page.getByRole('textbox', { name: '说明文字' })
  const save = page.locator('.settings-panel button[type=submit]')
  await expect(field).toHaveValue('entity baseline')
  const nav = page.getByRole('navigation', { name: '设置分类' })
  if (await nav.isVisible()) {
    await nav.getByRole('button').first().focus()
    await page.keyboard.press('End')
    await expect(page.locator('.settings-panel h2')).toHaveText('扩展业务')
    await expect(nav.getByRole('button').last()).toBeFocused()
    await page.keyboard.press('Home')
    await expect(page.locator('.settings-panel h2')).toHaveText('人员')
    await page.keyboard.press('ArrowDown')
    await expect(page.locator('.settings-panel h2')).toHaveText('聊天')
    await expect(nav.getByRole('button').nth(1)).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(page.locator('.settings-panel h2')).toHaveText('人员')
  }
  await field.fill('submitted snapshot')
  await selectSettingsGroup(page, '聊天')
  expect(await page.evaluate(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented })).toBe(true)
  await field.fill('chat draft')
  await selectSettingsGroup(page, '人员')
  await expect(field).toHaveValue('submitted snapshot')
  await save.click()
  await expect.poll(() => payloads.length).toBe(1)
  await field.fill('newer entity draft')
  await selectSettingsGroup(page, '聊天')
  await expect(field).toHaveValue('chat draft')
  await expect(save).toBeDisabled()
  release!()
  await expect(save).toBeEnabled()
  await expect(page.locator('.settings-panel')).not.toContainText('已保存')
  await selectSettingsGroup(page, '人员')
  await expect(field).toHaveValue('newer entity draft')
  await expect(save).toBeEnabled()
  expect(payloads[0]).toEqual({ app_name: 'entity', settings: { text: 'submitted snapshot' } })
  fail = true
  await save.click()
  await expect.poll(() => payloads.length).toBe(2)
  await selectSettingsGroup(page, '聊天')
  release!()
  await expect(save).toBeEnabled()
  await expect(page.locator('.settings-panel')).not.toContainText('本组保存失败')
  await selectSettingsGroup(page, '人员')
  await expect(page.locator('.settings-panel')).toContainText('本组保存失败')
  await expect(field).toHaveValue('newer entity draft')

  // A successful save refetches schema; retain an existing selected category and its draft.
  fail = false
  await save.click()
  await expect.poll(() => payloads.length).toBe(3)
  await selectSettingsGroup(page, '扩展业务')
  await field.fill('custom draft')
  const before = reads
  release!()
  await expect.poll(() => reads).toBeGreaterThan(before)
  await expect(field).toHaveValue('custom draft')
  await expect(page.locator('.settings-panel h2')).toHaveText('扩展业务')
  // Removing the selected category during the next refresh falls back to the first valid group.
  await selectSettingsGroup(page, '聊天')
  await save.click()
  await expect.poll(() => payloads.length).toBe(4)
  await selectSettingsGroup(page, '扩展业务')
  apps = apps.filter(app => app.app_name !== 'custom')
  release!()
  await expect(page.locator('.settings-panel h2')).toHaveText('人员')
  await expect(field).toHaveValue('newer entity draft')
})
