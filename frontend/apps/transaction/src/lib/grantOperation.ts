/** One unconfirmed grant per tab, team, acting entity and workspace entry. */
export interface GrantPayload {
  product_id: number
  customer_id: number
  quantity: number
  sender_entity_id?: number | null
  cs_entity_id: number | null
}

export interface GrantOperation {
  version: 1
  key: string
  payload: GrantPayload
}

const prefix = 'lostsky:entitlement-grant:'
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const positiveId = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0

export function grantScope(host: string, teamId: unknown, entityId: unknown, personal: boolean) {
  return positiveId(teamId) && positiveId(entityId)
    ? JSON.stringify([host, teamId, entityId, personal ? 'personal' : 'team']) : ''
}

function validPayload(value: unknown): value is GrantPayload {
  if (!value || typeof value !== 'object') return false
  const payload = value as GrantPayload
  return positiveId(payload.product_id) && positiveId(payload.customer_id)
    && positiveId(payload.quantity) && payload.quantity <= 999
    && (payload.sender_entity_id == null || positiveId(payload.sender_entity_id))
    && (payload.cs_entity_id === null || positiveId(payload.cs_entity_id))
}

function storageKey(scope: string) {
  if (!scope) throw new Error('尚未确认当前团队和人员，请稍后重试。')
  return prefix + scope
}

export function loadGrantOperation(scope: string, storage: Storage = sessionStorage): GrantOperation | null {
  const raw = storage.getItem(storageKey(scope))
  if (raw === null) return null
  const value = JSON.parse(raw) as GrantOperation
  if (value?.version !== 1 || !uuidPattern.test(value.key) || !validPayload(value.payload)) {
    throw new Error('待确认发放记录无法读取，请联系管理员核对发放历史后处理。')
  }
  return value
}

function uuid() {
  // getRandomValues remains available on the HTTP development hosts.
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 15) | 64
  bytes[8] = (bytes[8] & 63) | 128
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function beginGrantOperation(scope: string, payload: GrantPayload, storage: Storage = sessionStorage): GrantOperation {
  const current = loadGrantOperation(scope, storage)
  if (current) throw new Error('请先确认上一次发放结果。')
  if (!validPayload(payload)) throw new Error('请检查发放商品、顾客和份数。')
  const operation: GrantOperation = { version: 1, key: uuid(), payload: { ...payload } }
  storage.setItem(storageKey(scope), JSON.stringify(operation))
  return operation
}

/** An old response must never delete a newer operation stored under the same scope. */
export function finishGrantOperation(scope: string, key: string, storage: Storage = sessionStorage) {
  if (loadGrantOperation(scope, storage)?.key !== key) return false
  storage.removeItem(storageKey(scope))
  return true
}
