export type EntityType = 'entity' | 'customer' | 'team' | 'virtual' | 'teamMember' | 'teamCustomer' | 'teamVirtual' | 'unknown'

export interface EntityDisplay {
  slug: string
  type: EntityType
  name: string
  avatar?: string | null
}

export const entityTypeLabel = (type: EntityType) => ({
  entity: '成员',
  teamMember: '成员',
  customer: '客户',
  teamCustomer: '客户',
  team: '团队',
  virtual: '虚拟实体',
  teamVirtual: '虚拟实体',
  unknown: '实体',
})[type]
