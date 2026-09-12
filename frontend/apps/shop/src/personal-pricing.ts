import { hasManagePermission } from './lib'

export const personalRepricePermission = 'shop.product.self.reprice'

export function personalDistributionLocked(personal: boolean, permissions: string[] = []) {
  return personal && !hasManagePermission(permissions, personalRepricePermission)
}

export function withoutPersonnelCuts<T extends Record<string, unknown>>(data: T, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = { ...data }
  for (const person of ['handler', 'sender', 'cs']) delete result[`${prefix}${person}_cut`]
  return result
}
