import { queryPositiveInteger, queryText } from '@lostsky/shared/routeQuery'
import type { LocationQuery } from 'vue-router'

export type NoticeScope = 'team' | 'entity' | 'sent'
export interface NoticeListState { keyword: string; filter: 'all' | 'unread'; page: number }
export const noticeListPath = (scope: NoticeScope) => scope === 'entity' ? '/personal/notices' : `/notices/${scope}`
export function noticeListState(query: LocationQuery): NoticeListState {
  const keyword = queryText(query.keyword) ?? ''
  const page = queryPositiveInteger(query.page) ?? 1
  return { keyword: keyword.length <= 200 ? keyword : '', filter: queryText(query.filter) === 'unread' ? 'unread' : 'all', page: page <= 100000 ? page : 1 }
}
export function noticeListQuery(state: NoticeListState) {
  return { ...(state.keyword ? { keyword: state.keyword } : {}), ...(state.filter === 'unread' ? { filter: 'unread' } : {}), ...(state.page > 1 ? { page: String(state.page) } : {}) }
}
/** Only harmless list geometry is retained; no notification body or permission state. */
const scrollPositions = new Map<string, number>()
export const noticeScroll = (key: string) => scrollPositions.get(key) ?? 0
export function rememberNoticeScroll(key: string, top: number) {
  if (scrollPositions.size > 100) scrollPositions.delete(scrollPositions.keys().next().value!)
  scrollPositions.set(key, Math.max(0, top))
}
