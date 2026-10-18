export type EntityType = 'entity' | 'customer' | 'team' | 'virtual' | 'teamMember' | 'teamCustomer' | 'teamVirtual' | 'unknown'
export type EntityTone = 'team' | 'member' | 'customer' | 'virtual' | 'unknown'

export interface EntityDisplay {
  slug: string
  type: EntityType
  name: string
  avatar?: string | null
}

export const entityTypeLabel = (type: EntityType) => ({
  entity: '成员',
  teamMember: '成员',
  customer: '顾客',
  teamCustomer: '顾客',
  team: '团队',
  virtual: '虚拟人员',
  teamVirtual: '虚拟人员',
  unknown: '人员',
})[type]

export const entityTypeTone = (type: EntityType): EntityTone => ({
  entity: 'member',
  teamMember: 'member',
  customer: 'customer',
  teamCustomer: 'customer',
  team: 'team',
  virtual: 'virtual',
  teamVirtual: 'virtual',
  unknown: 'unknown',
} as const)[type]

export function entityMatchesKeyword(entity: EntityDisplay, keyword: string): boolean {
  const normalizedKeyword = keyword.trim().toLowerCase()
  if (!normalizedKeyword) return true
  return entity.slug.toLowerCase().includes(normalizedKeyword)
    || entity.name.toLowerCase().includes(normalizedKeyword)
}
