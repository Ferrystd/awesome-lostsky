export interface JoinTransferOption {
  id: number
  field_key: string
  name: string
  value_type: string
  input_type: string
  sort?: number
}

export interface JoinField {
  id: number
  field_key: string
  name: string
  value_type: string
  input_type: string
  options: unknown
  default_value: string | null
  is_apply_fillable: number
  is_apply_required: number
  is_transfer_entity_field: number
  entity_field_id: number | null
  entity_field?: JoinTransferOption | null
  is_active: number
  sort: number
}

export interface JoinFieldOption {
  key: string
  label: string
  value: string
}

export const valueTypeOptions = [
  ['string', '短文本'], ['text', '长文本'], ['int', '整数'], ['decimal', '小数'],
  ['bool', '布尔值'], ['date', '日期'], ['datetime', '日期时间'], ['select', '单选值'],
  ['multi_select', '多选值'], ['json', 'JSON'],
].map(([value, label]) => ({ value, label }))

export const inputTypeOptions = [
  ['text', '单行输入'], ['textarea', '多行输入'], ['radio', '单选按钮'],
  ['checkbox', '复选项'], ['select', '下拉选择'], ['date', '日期选择'],
  ['datetime', '日期时间选择'], ['upload', '文件上传'],
].map(([value, label]) => ({ value, label }))

export const valueTypeLabel = (value: string) => valueTypeOptions.find(option => option.value === value)?.label ?? value
export const inputTypeLabel = (value: string) => inputTypeOptions.find(option => option.value === value)?.label ?? value
export const usesJoinOptions = (inputType: string) => ['radio', 'checkbox', 'select'].includes(inputType)

export function normalizeJoinOptions(source: unknown): Array<Omit<JoinFieldOption, 'key'>> {
  if (typeof source === 'string') {
    const raw = source
    try { source = JSON.parse(source) }
    catch { source = raw.split(',') }
  }
  if (!Array.isArray(source)) return []
  return source.map((item) => {
    if (typeof item !== 'object' || item === null) {
      return { label: String(item), value: String(item) }
    }
    const option = item as Record<string, unknown>
    const label = String(option.label ?? option.name ?? option.value ?? option.id ?? '')
    const value = String(option.value ?? option.id ?? option.label ?? option.name ?? '')
    return { label, value }
  })
}
