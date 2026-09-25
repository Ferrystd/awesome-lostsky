import { describe, expect, it } from 'vitest'
import { fileSourceLabel } from './fileSource'

describe('file source labels', () => {
  it.each([
    ['manual', '手动上传'], ['markdown', 'Markdown 上传'], ['attachment', '表单附件'],
    ['join', '加入申请'], ['command', '命令上传'], ['system', '系统上传'],
    ['unknown', '未知来源'], [null, '未知来源'], ['unexpected', '未知来源'],
  ])('formats %s', (source, label) => expect(fileSourceLabel(source)).toBe(label))
})
