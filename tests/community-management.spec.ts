import { test, expect, type Page } from './fixtures'
const adminOrigin = 'http://127.0.0.1:5180'
const teamOrigin = 'http://127.0.0.1:5175'
const entity = { id: 9, slug: 'external-sky', name: '跨团队管理人员', is_valid: true, avatar: null }
async function setup(page: Page, scope: 'admin' | 'team', permissions: string[]) {
  const origin = scope === 'admin' ? adminOrigin : teamOrigin
  await page.addInitScript(() => localStorage.setItem('lostsky_token', 'management-fixture'))
  const community = { id: 1, slug: 'sky', name: '青空社区', description: '一起交流', owner_type: scope === 'admin' ? 'Platform' : 'Team', owner: scope === 'admin' ? null : { id: 1, slug: 'demo', name: '青空团队' }, team_id: scope === 'admin' ? null : 1, status: 'Active', is_official: scope === 'admin', entity_id: scope === 'admin' ? null : 9, is_joined: false, is_muted: false, mute_reason: '', can_manage: true, can_write: true, can_moderate: true, team_available: true, create_time: 1791331200, update_time: 1791331200 }
  let administrators: unknown[] = []
  const writes: { path: string; body: Record<string, unknown> }[] = []
  const post = { id: 11, community_id: 1, board_id: 1, author_entity_id: 9, author: entity, title: '待处理的讨论', content: '讨论正文', pinned: false, status: 'Visible', hidden_reason: '', like_count: 0, comment_count: 0, is_liked: false, can_edit: false, create_time: 1791331200, update_time: 1791331200 }
  const comment = { ...post, id: 21, post_id: 11, content: '待处理的评论' }
  const list = (items: unknown[]) => ({ list: items, total: items.length, page: 1, limit: 20 })
  await page.route(`${origin}/api/**`, async route => {
    const request = route.request(), path = new URL(request.url()).pathname.replace('/api', ''), body = request.method() === 'POST' ? request.postDataJSON() as Record<string, unknown> : {}
    if (request.method() === 'POST') writes.push({ path, body })
    let data: unknown
    if (path === '/session') data = { user: { id: 1, username: 'manager' }, roles: [], permissions, is_super_admin: false }
    else if (path === '/access') data = { team: { id: 1, slug: 'demo', name: '青空团队' }, identity: { entity_id: 9, name: '跨团队管理人员', type: 'teamMember', belongs_to_team: false, is_external: true }, entry_warning: { required: false }, permissions, abilities: {} }
    else if (path === '/communities' && request.method() === 'POST') { Object.assign(community, body); data = community }
    else if (path === '/communities') data = list([community])
    else if (path === '/communities/1') { if (request.method() === 'POST') Object.assign(community, body); data = community }
    else if (path === '/communities/1/administrators' && request.method() === 'POST') { administrators = [{ entity_id: 9, entity, joined: false, muted: false, reason: '' }]; data = administrators[0] }
    else if (path === '/communities/1/administrators') data = list(administrators)
    else if (path === '/communities/1/administrators/9/remove') { administrators = []; data = {} }
    else if (path === '/communities/1/boards') data = list([{ id: 1, name: '日常交流', sort: 0, enabled: true, community_id: 1 }])
    else if (path === '/communities/1/posts') data = list([post])
    else if (path === '/communities/1/comments') data = list([comment])
    else if (path === '/communities/1/posts/11/moderate') { if ('hidden' in body) { post.status = body.hidden ? 'Hidden' : 'Visible'; post.hidden_reason = String(body.reason) }; if ('pinned' in body) post.pinned = Boolean(body.pinned); data = post }
    else if (path === '/communities/1/comments/21/moderate') { comment.status = body.hidden ? 'Hidden' : 'Visible'; comment.hidden_reason = String(body.reason); data = comment }
    else throw new Error(`Unmocked management API: ${request.method()} ${path}`)
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
  return { origin, writes }
}
for (const scope of ['admin', 'team'] as const) test(`${scope} creates owned community, assigns cross-team administrator, pauses with reason and links governance`, async ({ page }) => {
  const { origin, writes } = await setup(page, scope, scope === 'admin' ? ['admin.community.read', 'admin.community.write', 'admin.community.moderate'] : ['community.team.read', 'community.team.manage'])
  await page.goto(`${origin}/communities/new`)
  await page.getByRole('textbox', { name: '社区名称', exact: true }).fill('新建的主题社区')
  await page.getByRole('textbox', { name: '社区标识', exact: true }).fill('sky-talk')
  await page.getByRole('button', { name: '保存社区' }).click()
  await expect(page.getByRole('heading', { name: '新建的主题社区' })).toBeVisible()
  await page.getByRole('link', { name: '管理员分配' }).click()
  await page.getByRole('textbox', { name: '人员标识', exact: true }).fill('external-sky')
  await page.getByRole('button', { name: '添加管理员' }).press('Enter')
  await expect(page.getByText('跨团队管理人员', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: '移除管理员' }).click(); await page.getByRole('button', { name: '确认移除' }).click()
  await expect(page.getByText('尚未分配社区管理员')).toBeVisible()
  await page.getByRole('link', { name: '返回', exact: true }).click()
  await page.getByRole('button', { name: '编辑资料与状态' }).click()
  await page.locator('#community-status').click(); await page.getByText('暂停', { exact: true }).click()
  await page.getByRole('textbox', { name: '暂停原因', exact: true }).fill('整理社区内容')
  await page.getByRole('button', { name: '保存社区' }).click()
  await expect(page.getByText('已暂停', { exact: true })).toBeVisible()
  if (scope === 'team') { await expect(page.getByRole('link', { name: '前往社区日常管理' })).toHaveAttribute('href', /:5182\/c\/sky-talk\/manage\/boards$/); expect(writes.every(write => write.body.expected_entity_id === 9)).toBe(true) }
  else { expect(writes.every(write => !('expected_entity_id' in write.body))).toBe(true); await page.getByRole('link', { name: '板块、公告、内容与成员' }).click(); await expect(page.getByText('日常交流', { exact: true })).toBeVisible() }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
})
test('Admin read-only sees governance but cannot write, moderate or appoint administrators', async ({ page }) => {
  const { writes } = await setup(page, 'admin', ['admin.community.read'])
  await page.goto(`${adminOrigin}/communities/1/manage/posts`)
  await expect(page.getByText('讨论正文', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '隐藏内容', exact: true }).press('Enter')
  await expect(page.getByRole('button', { name: '隐藏内容', exact: true })).toHaveAttribute('aria-disabled', 'true')
  await page.goto(`${adminOrigin}/communities/1/administrators`)
  await page.getByRole('textbox', { name: '人员标识', exact: true }).fill('external-sky')
  await page.getByRole('button', { name: '添加管理员' }).press('Enter')
  await expect(page.getByRole('button', { name: '添加管理员' })).toHaveAttribute('aria-disabled', 'true')
  expect(writes).toHaveLength(0)
})
test('Admin moderate without write hides and restores comments but cannot appoint administrators', async ({ page }) => {
  const { writes } = await setup(page, 'admin', ['admin.community.read', 'admin.community.moderate'])
  await page.goto(`${adminOrigin}/communities/1/manage/comments`)
  await page.getByRole('button', { name: '隐藏内容', exact: true }).press('Enter')
  await page.getByRole('textbox', { name: '处理原因' }).fill('重复评论')
  await page.getByRole('button', { name: '确认', exact: true }).click()
  await expect(page.getByText('处理原因：重复评论')).toBeVisible()
  await page.getByRole('button', { name: '恢复内容', exact: true }).click(); await page.getByRole('button', { name: '确认', exact: true }).click()
  await expect(page.getByRole('button', { name: '隐藏内容', exact: true })).toBeVisible()
  await page.goto(`${adminOrigin}/communities/1/administrators`)
  await page.getByRole('textbox', { name: '人员标识', exact: true }).fill('external-sky')
  await page.getByRole('button', { name: '添加管理员' }).press('Enter')
  expect(writes).toHaveLength(2)
  expect(writes.every(write => write.path.endsWith('/moderate') && !('expected_entity_id' in write.body))).toBe(true)
})
test('Admin write without moderate cannot hide or pin content', async ({ page }) => {
  const { writes } = await setup(page, 'admin', ['admin.community.read', 'admin.community.write'])
  await page.goto(`${adminOrigin}/communities/1/manage/posts`)
  await page.getByRole('button', { name: '置顶帖子', exact: true }).press('Enter')
  await expect(page.getByRole('button', { name: '置顶帖子', exact: true })).toHaveAttribute('aria-disabled', 'true')
  expect(writes).toHaveLength(0)
})
test('Admin without read keeps community entry available but cannot submit', async ({ page }) => {
  const { writes } = await setup(page, 'admin', ['admin.community.write', 'admin.community.moderate'])
  await page.goto(`${adminOrigin}/communities`)
  await expect(page.getByRole('heading', { name: '平台社区', exact: true }).last()).toBeVisible()
  await expect(page.getByRole('link', { name: '青空社区', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '创建社区', exact: true }).click()
  await expect(page.getByRole('button', { name: '保存社区' })).toHaveAttribute('aria-disabled', 'true')
  await page.getByRole('button', { name: '保存社区' }).press('Enter')
  expect(writes).toHaveLength(0)
})
