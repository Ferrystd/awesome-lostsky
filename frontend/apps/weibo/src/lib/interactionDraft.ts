import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import type { WorkspaceAccess } from '../types'
import { queryPositiveInteger, queryText } from '@lostsky/shared/routeQuery'

export type InteractionAction = 'like' | 'comment'
export interface InteractionInput { action: InteractionAction; statusUrl: string; feedPostId: number | null; fromFeed: boolean; error: string }
export interface InteractionDraft { action: InteractionAction; statusUrl: string; comment: string; accountId: number | null }
interface SavedDraft { scope: string; query: LocationQueryRaw; task: InteractionInput; draft: InteractionDraft; baseline: string }
const drafts = new Map<string, SavedDraft>()
const tokenPattern = /^[a-zA-Z0-9-]{12,80}$/

export function validStatusUrl(value: string) {
  if (value.length > 2048) return false
  try {
    const url = new URL(value)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) return false
    if (url.hostname === 'weibo.com' || url.hostname === 'www.weibo.com') return /^\/(?:\d+\/[a-zA-Z0-9]+|(?:detail|status)\/\d+)\/?$/.test(url.pathname)
    return url.hostname === 'm.weibo.cn' && /^\/(?:detail|status)\/[a-zA-Z0-9]+\/?$/.test(url.pathname)
  } catch { return false }
}

export function parseInteractionQuery(query: LocationQuery, personal: boolean): InteractionInput {
  const task: InteractionInput = { action: 'like', statusUrl: '', feedPostId: null, fromFeed: false, error: '' }
  for (const key of ['action', 'status_url', 'feed_post_id', 'from', 'draft']) {
    if (key in query && !queryText(query[key])) task.error = '互动链接包含空值或重复参数，请重新进入互动页面'
  }
  if (query.action !== undefined && query.action !== 'like' && query.action !== 'comment') task.error = '互动操作无效，请重新选择点赞或评论'
  if (query.action === 'comment') task.action = 'comment'
  if (typeof query.status_url === 'string') {
    task.statusUrl = query.status_url
    if (!validStatusUrl(task.statusUrl)) task.error = '微博帖子链接无效，请使用微博正文页链接'
  }
  if (query.feed_post_id !== undefined) {
    const value = queryPositiveInteger(query.feed_post_id)
    if (!personal || value === undefined) task.error = '点单微博标识无效，请从个人点单信息流重新进入'
    else task.feedPostId = value
    if (task.action !== 'comment') task.error = '点单微博仅支持评论，请从点单信息流重新进入'
  }
  if (query.status_url !== undefined && query.feed_post_id !== undefined) task.error = '互动链接包含两个目标，请重新选择一条微博'
  if (query.from !== undefined && query.from !== 'feed') task.error = '互动来源无效，请重新进入互动页面'
  task.fromFeed = personal && query.from === 'feed'
  if (query.draft !== undefined && (typeof query.draft !== 'string' || !tokenPattern.test(query.draft))) task.error = '互动草稿标识无效，请重新进入互动页面'
  return task
}

export function interactionScopeKey(access: WorkspaceAccess | undefined, personal: boolean) {
  return access ? `${access.team?.id ?? access.team?.slug ?? ''}:${access.identity.entity_id}:${personal ? 'personal' : 'team'}` : ''
}
export function interactionPresetQuery(query: LocationQuery): LocationQueryRaw {
  return query.from === 'interaction' && typeof query.draft === 'string' && tokenPattern.test(query.draft)
    ? { from: 'interaction', draft: query.draft } : {}
}
export function interactionReturnTarget(query: LocationQuery, access: WorkspaceAccess | undefined, personal: boolean) {
  const path = `${personal ? '/personal' : ''}/interactions`
  const token = interactionPresetQuery(query).draft
  const saved = typeof token === 'string' ? drafts.get(token) : undefined
  return saved && saved.scope === interactionScopeKey(access, personal)
    ? { path, query: { ...saved.query, draft: token } } : { path }
}
export function storeInteractionDraft(scope: string, query: LocationQuery, task: InteractionInput, draft: InteractionDraft, baseline: string) {
  drafts.clear()
  // getRandomValues also works on the HTTP development/preview hosts.
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 15) | 64
  bytes[8] = (bytes[8] & 63) | 128
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('')
  const token = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  drafts.set(token, { scope, query: Object.fromEntries(Object.entries(query).filter(([key]) => ['action', 'status_url', 'feed_post_id', 'from'].includes(key))), task: { ...task }, draft: { ...draft }, baseline })
  return token
}
export function takeInteractionDraft(token: unknown, scope: string, task?: InteractionInput) {
  // Browser Back returns to the original URL, which contains no draft token.
  if (token === undefined && task) token = [...drafts].find(([, saved]) => saved.scope === scope && JSON.stringify(saved.task) === JSON.stringify(task))?.[0]
  if (typeof token !== 'string') return undefined
  const saved = drafts.get(token)
  drafts.delete(token)
  return saved?.scope === scope && (!task || JSON.stringify(saved.task) === JSON.stringify(task)) ? saved : undefined
}
export function clearInteractionDrafts() { drafts.clear() }
