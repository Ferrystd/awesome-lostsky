import type { SelectOption } from 'naive-ui'

export type SettingValue = string | number | boolean | null

export interface SettingOption extends SelectOption {
  value: string | number
  label: string
  description?: string
}

export interface SettingField {
  key: string
  label: string
  description: string
  type: 'boolean' | 'integer' | 'enum' | 'string'
  control: 'switch' | 'radio' | 'select' | 'number' | 'input'
  order: number
  default: SettingValue
  value: SettingValue
  options?: SettingOption[]
  min?: number
  max?: number
  step?: number
  max_length?: number
  nullable?: boolean
  ability_requirement?: {
    key: string
    label: string
    minimum_level: number
    satisfied: boolean
    reason: 'missing' | 'level' | 'expired' | null
  }
}

export interface SettingApp {
  app_name: string
  label: string
  description: string
  order: number
  settings: SettingField[]
}

export interface SettingSchema {
  apps: SettingApp[]
}
