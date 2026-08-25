import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('./views/TaskFormView.vue', import.meta.url), 'utf8')

describe('微博任务表单', () => {
  it('与其他后台表单复用同一分区、字段和操作契约', () => {
    for (const component of ['LsFormSection', 'LsField', 'LsFormActions', 'LsButton', 'LsInlineError']) {
      expect(source).toContain(`<${component}`)
    }
    expect(source).toContain('title="执行安排"')
    expect(source).toContain(":title=\"isCheckin ? '签到目标' : '发布内容'\"")
    expect(source).not.toContain('NFormItem')
    expect(source).not.toContain('<NButton')
    expect(source).not.toContain('<LsPanel')
  })

  it('保持单次保存与图片上传边界', () => {
    expect(source.match(/type="submit"/g)).toHaveLength(1)
    expect(source).toContain('保存为暂停')
    expect(source).toContain('<MediaPreparation')
    expect(source).toContain(':account-id="accountIds[0] ?? null"')
  })

  it('每日签到只保留超话并固定为每天一次', () => {
    expect(source).toContain('<NRadioButton value="Checkin">每日签到</NRadioButton>')
    expect(source).toContain('<LsField v-if="!isCheckin" label="正文"')
    expect(source).toContain('<MediaPreparation\n          v-if="!isCheckin"')
    expect(source).toContain('min_interval: isCheckin.value ? 86400 : min.value')
    expect(source).toContain('max_interval: isCheckin.value ? 86400 : max.value')
  })
})
