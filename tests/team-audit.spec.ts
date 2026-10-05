import { expect, test } from './fixtures'

test('Team 审计日志覆盖权限、筛选、详情、状态与响应式布局', async ({ page }) => {
  test.setTimeout(90_000)
  let mode: 'list' | 'empty' | 'error' = 'list'
  let allowed = true
  const requestedQueries: string[] = []
  await page.context().addCookies([
    {
      name: 'lostsky_token',
      value: 'e2e-token',
      domain: '.lostsky.work',
      path: '/',
      sameSite: 'Lax',
    },
  ])
  await page.route('http://demo.team.lostsky.work:5175/api/**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/access')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          message: 'ok',
          data: {
            permissions: allowed ? ['team.audit.read'] : [],
            abilities: {
              file: {
                enabled: true,
                level: 0,
                expire_time: 0,
                reason: null,
                label: '文件',
              },
              doc: {
                enabled: true,
                level: 1,
                expire_time: 0,
                reason: null,
                label: '文档',
              },
              transaction: {
                enabled: true,
                level: 1,
                expire_time: 0,
                reason: null,
                label: '记账',
              },
            },
            file_upload: {
              count: 0,
              total_size: 0,
              size_limit: 134217728,
              remaining_size: 134217728,
              available: true,
              reason: null,
            },
          },
        }),
      })
      return
    }
    if (url.pathname.endsWith('/audit/catalog')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          message: 'ok',
          data: {
            applications: [{ value: 'team', label: '团队' }],
            actions: [{ value: 'update', label: '更新' }],
            resource_types: [{ value: 'member', label: '成员' }],
          },
        }),
      })
      return
    }
    if (url.pathname.endsWith('/audit/index')) {
      requestedQueries.push(url.search)
      if (mode === 'error') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 503,
            message: '审计服务暂时不可用',
            data: null,
          }),
        })
        return
      }
      const list =
        mode === 'empty'
          ? []
          : [
              {
                id: 91,
                application: 'team',
                application_label: '团队',
                action: 'update',
                action_label: '更新',
                resource_type: 'member',
                resource_label: '成员',
                resource_id: 8,
                actor: {
                  authenticated_user_id: 2,
                  username: 'owner',
                  entity_id: 3,
                  entity_type: 'teamMember',
                  entity_name: '青空管理员',
                  entity_slug: 'owner',
                },
                request_id: 'req-audit-91',
                create_time: 1786320000,
              },
            ]
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          message: 'ok',
          data: { total: list.length, list, page: 1, limit: 20 },
        }),
      })
      return
    }
    if (url.pathname.endsWith('/audit/get')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          message: 'ok',
          data: {
            id: 91,
            application: 'team',
            application_label: '团队',
            action: 'update',
            action_label: '更新',
            resource_type: 'member',
            resource_label: '成员',
            resource_id: 8,
            actor: {
              authenticated_user_id: 2,
              username: 'owner',
              entity_id: 3,
              entity_type: 'teamMember',
              entity_name: '青空管理员',
              entity_slug: 'owner',
            },
            request_id: 'req-audit-91',
            create_time: 1786320000,
            context: {
              changed: true,
              changed_fields: ['status'],
              changes: { status: { before: 'active', after: 'blocked' } },
            },
          },
        }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data: [] }),
    })
  })

  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 })
    await page.goto('http://demo.team.lostsky.work:5175/audit')
    await expect(page.locator('#workspace').getByRole('heading', { name: '审计日志' })).toBeVisible()
    await expect(page.getByText('成员 · 更新').first()).toBeVisible()
    const overflow = await page.evaluate(() => ({
      hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      offenders: [...document.querySelectorAll<HTMLElement>('body *')]
        .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
        .slice(0, 8)
        .map((element) => ({
          tag: element.tagName,
          className: element.className,
          right: element.getBoundingClientRect().right,
        })),
    }))
    expect(overflow.hasOverflow, `${width}px overflow: ${JSON.stringify(overflow.offenders)}`).toBe(false)
  }

  await page.locator('#workspace .ls-search-input input').fill('owner')
  await expect.poll(() => requestedQueries.some((query) => query.includes('q=owner'))).toBe(true)
  await page.getByText('成员 · 更新').first().click()
  await expect(page).toHaveURL(/\/audit\/91$/)
  await expect(page.getByText('req-audit-91')).toBeVisible()
  await expect(page.getByText('active')).toBeVisible()
  await expect(page.getByText('blocked')).toBeVisible()
  await page.getByRole('link', { name: '返回审计日志' }).click()
  await expect(page).toHaveURL(/\/audit$/)

  mode = 'empty'
  await page.reload()
  await expect(page.getByText('没有可显示的审计事件')).toBeVisible()
  mode = 'error'
  await page.reload()
  await expect(page.getByText('暂时无法读取审计日志')).toBeVisible()

  mode = 'list'
  allowed = false
  await page.setViewportSize({ width: 1024, height: 900 })
  await page.goto('http://demo.team.lostsky.work:5175/')
  const auditEntry = page.locator('.sidebar a[href="/audit"]')
  await expect(auditEntry).toBeVisible()
  await expect(page.locator('.n-message')).toHaveCount(0)
  await auditEntry.click()
  await expect(page).toHaveURL(/\/audit$/)
  await expect(page.locator('.ls-empty-state')).toContainText('team.audit.read')
  await expect(page.locator('.n-message').filter({ hasText: 'team.audit.read' })).toBeVisible()
})
