import {
  formatAbilityDenied,
  formatPermissionDenied,
  formatSettingDenied,
  type SettingRequirement,
  type SettingValue,
} from '@lostsky/api/error-format'
import { ERROR_MESSAGES } from '@lostsky/api/error-messages'
import { permissionCovers } from './permissionHierarchy'

export type { SettingRequirement, SettingValue } from '@lostsky/api/error-format'

export interface AccessSnapshotLike {
  permissions?: string[]
  abilities?: Record<string, {
    enabled: boolean
    label: string
  } | undefined>
  file_upload?: FileUploadAvailability
}

export interface FileUploadAvailability {
  count: number
  total_size: number
  size_limit: number | null
  remaining_size: number | null
  available: boolean
  reason: 'quota' | null
}

export function hasPermission(snapshot: AccessSnapshotLike | undefined, permission: string) {
  return Boolean(snapshot?.permissions?.some(granted => permissionCovers(granted, permission)))
}

export function permissionReason(permission: string) {
  return formatPermissionDenied([permission])
}

export function abilityReason(key: string, label: string) {
  return formatAbilityDenied(key, label)
}

export function settingReason(
  appName: string,
  key: string,
  label: string,
  current: SettingValue,
  requirement: SettingRequirement,
) {
  return formatSettingDenied(appName, key, label, current, requirement)
}

export function fileUploadReason(snapshot: AccessSnapshotLike | undefined) {
  const resourceReason = resourceUploadReason(snapshot)
  if (resourceReason) return resourceReason
  if (snapshot?.permissions && !hasPermission(snapshot, 'file.upload')) return permissionReason('file.upload')
  return ''
}

export function fileAvailabilityReason(state: FileUploadAvailability | undefined) {
  if (!state || state.available) return ''
  if (state.reason === 'quota') return ERROR_MESSAGES.file.quota
  return ''
}

export function resourceUploadReason(snapshot: AccessSnapshotLike | undefined) {
  if (!snapshot) return ''
  return fileAvailabilityReason(snapshot.file_upload)
}
