import { renderToString } from '@vue/server-renderer'
import { createSSRApp, h } from 'vue'
import { describe, expect, it } from 'vitest'
import LsMetricGrid from './components/LsMetricGrid.vue'

describe('LsMetricGrid', () => {
  it('renders semantic metrics and optional hints', async () => {
    const html = await renderToString(createSSRApp({
      render: () => h(LsMetricGrid, {
        ariaLabel: '经营摘要',
        items: [
          { key: 'flow', label: '实际流水', value: '¥128.00', hint: '现金与预存款' },
          { key: 'orders', label: '接单数', value: 4 },
        ],
      }),
    }))

    expect(html).toContain('aria-label="经营摘要"')
    expect(html).toMatch(/<dt[^>]*>实际流水<\/dt>/)
    expect(html).toMatch(/<dd class="ls-tabular"[^>]*>¥128\.00<\/dd>/)
    expect(html).toMatch(/<small[^>]*>现金与预存款<\/small>/)
  })
})
