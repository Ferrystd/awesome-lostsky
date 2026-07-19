import type { EnumOption } from '@lostsky/ui/lib/enum'

export const managerScopeOptions: EnumOption<number>[] = [
  { label: '仅团队管理员', value: 1 },
  { label: '成员本人和团队管理员', value: 2 },
]

export const visibilityOptions: EnumOption<number>[] = [
  { label: '团队管理员可见', value: 1 },
  { label: '成员本人和团队管理员可见', value: 3 },
  { label: '团队成员可见', value: 4 },
  { label: '公开可见', value: 5 },
  { label: '指定对象可见', value: 6, disabled: true },
]
