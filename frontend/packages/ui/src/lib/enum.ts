export interface EnumOption<T extends string | number = string | number> {
  label: string
  value: T
  disabled?: boolean
}

/**
 * 将接口返回的枚举底层值、case name 或展示文案统一还原为表单提交值。
 */
export function enumOptionValue<T extends string | number>(value: unknown, options: readonly EnumOption<T>[], fallback: T): T {
  const text = String(value)
  return options.find((option) => option.value === value || String(option.value) === text || option.label === text)?.value ?? fallback
}
