import { renderToString } from '@vue/server-renderer'
import { createSSRApp, h } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import LsMarkdownRenderer from './components/LsMarkdownRenderer.vue'
import { removeUnresolvedMarkdownImages } from './markdown'

vi.mock('dompurify', () => ({
  default: { sanitize: (value: string) => value },
}))

describe('removeUnresolvedMarkdownImages', () => {
  it('removes Milkdown image placeholders without an address', () => {
    expect(removeUnresolvedMarkdownImages('before\n\n![1.00]()\n\nafter')).toBe('before\n\n\nafter')
    expect(removeUnresolvedMarkdownImages('![1.00](<> "图片说明")\n')).toBe('')
  })

  it('keeps images that have an address', () => {
    const markdown = '![1.00](https://assets.lostsky.work/example.png "图片说明")'
    expect(removeUnresolvedMarkdownImages(markdown)).toBe(markdown)
  })

  it('does not remove unresolved image syntax inside a paragraph', () => {
    const markdown = '文字 ![1.00]() 仍然是用户输入'
    expect(removeUnresolvedMarkdownImages(markdown)).toBe(markdown)
  })

  it('does not render a broken image or its ratio from legacy content', async () => {
    const app = createSSRApp({
      render: () => h(LsMarkdownRenderer, { content: 'before\n\n![1.00]()\n\nafter' }),
    })
    const html = await renderToString(app)

    expect(html).toContain('before')
    expect(html).toContain('after')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('1.00')
  })
})
