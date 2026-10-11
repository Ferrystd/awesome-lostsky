import { expect, type Page } from '../fixtures'

export async function selectSettingsGroup(page: Page, label: string) {
  const navigation = page.getByRole('navigation', { name: '设置分类', exact: true })
  if (await navigation.isVisible()) await navigation.getByRole('button').filter({ has: page.getByText(label, { exact: true }) }).click()
  else {
    await page.locator('.settings-navigation__mobile .n-select').click()
    await page.locator('.n-base-select-menu:visible .n-base-select-option').filter({ hasText: label }).first().click()
    await expect(page.locator('.n-base-select-menu:visible')).toHaveCount(0)
  }
  await expect(page.locator('.settings-panel').getByRole('heading', { name: label, exact: true })).toBeVisible()
}
