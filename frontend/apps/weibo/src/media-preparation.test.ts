import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('./components/MediaPreparation.vue', import.meta.url), 'utf8')

describe('微博图片准备', () => {
  it('复用上传原语并提供完整的选择、状态和错误反馈', () => {
    expect(source).toContain("import LsUploadField from '@lostsky/ui/components/LsUploadField.vue'")
    expect(source).toContain('button-label="uploadLabel"')
    expect(source).not.toContain('show-reason')
    expect(source).toContain('LsInlineError v-if="uploadError"')
    expect(source).toContain('aria-live="polite"')
    expect(source).not.toContain('<NUpload')
    expect(source).not.toContain('<NButton')
  })

  it('逐张提交成功结果并保留部分上传成果', () => {
    expect(source).toContain('for (const file of selected)')
    expect(source).toContain("await api.uploadTo<{ id: number }>")
    expect(source).toContain("emit('update:modelValue', [...ids])")
    expect(source).toContain('本次最多还能添加')
  })
})
