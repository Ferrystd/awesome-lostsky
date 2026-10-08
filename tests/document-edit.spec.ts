import { expect, test } from './fixtures'
import { marked } from 'marked'

const origin = 'http://demo.team.lostsky.work:5175'
const content = '## 已有服务说明\n\n这段正文必须完整保留。\n\n- 服务流程\n- 注意事项'

test('document editor loads existing detail and preserves content when saving title', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  let saved: Record<string, unknown> | null = null
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/' }])
  await page.route(`${origin}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname
    const document = { id: 11, title: '已有文档', content, entity_id: 1, manager_scope: 1, visibility: 1, sort: 3, tags: ['须知'] }
    let data: unknown = []
    if (path.endsWith('/access')) data = { permissions: ['team.document.read', 'team.document.team.manage'], abilities: { doc: { enabled: true, level: 1 }, file: { enabled: true, level: 1 } } }
    else if (path.endsWith('/entity/options')) data = [{ entity_id: 1, type: 'team', slug: 'demo', name: '测试团队' }]
    else if (path.endsWith('/doc/get')) data = document
    else if (path.endsWith('/doc/edit')) saved = route.request().postDataJSON()
    await route.fulfill({ json: { code: 0, message: 'ok', data } })
  })
  await page.goto(`${origin}/doc-edit?id=11`)
  await expect(page.locator('#document-title input, input#document-title').first()).toHaveValue('已有文档')
  await expect(page.locator('.document-tags input')).toHaveValue('须知')
  const visual = page.locator('.ls-markdown-editor .ProseMirror')
  await expect(visual).toContainText('这段正文必须完整保留。')
  await page.getByRole('tab', { name: '源码' }).click()
  const source = await page.getByRole('textbox', { name: 'Markdown 源码' }).inputValue()
  for (const text of ['已有服务说明', '这段正文必须完整保留。', '服务流程', '注意事项']) expect(source).toContain(text)
  await page.getByRole('tab', { name: '预览' }).click()
  await expect(page.locator('.ls-markdown-editor')).toContainText('这段正文必须完整保留。')
  await page.getByRole('tab', { name: '可视化' }).click()
  await expect(visual).toContainText('这段正文必须完整保留。')
  await expect(visual.locator('li')).toHaveText(['服务流程', '注意事项'])
  await page.locator('#document-title input, input#document-title').first().fill('已有文档（修订标题）')
  await page.getByRole('button', { name: '保存文档' }).click()
  await expect.poll(() => saved).not.toBeNull()
  expect(saved).toMatchObject({ id: 11, title: '已有文档（修订标题）', sort: 3, tags: ['须知'] })
  // Milkdown normalizes list markers and whitespace; preserve content and structure.
  const structure = (markdown: string) => marked.lexer(markdown).filter(token => token.type !== 'space').map(token => ({
    type: token.type,
    text: token.type === 'heading' || token.type === 'paragraph' ? token.text : undefined,
    depth: token.type === 'heading' ? token.depth : undefined,
    items: token.type === 'list' ? token.items.map(item => item.text.trim()) : undefined,
  }))
  expect(structure(String(saved!.content))).toEqual(structure(content))
  expect(errors).toEqual([])
})
