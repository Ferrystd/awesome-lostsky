import { auth } from '@lostsky/api/client'
import { nextTick, reactive, toRefs } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

interface ListState { keyword: string; status: string | null; board: number | null; page: number; scroll: number }
const lists = new Map<string, ListState>()
/** A list's filters survive its detail route, scoped to this app, resource and actor. */
export function useCommunityListState(scope: string) {
  const key = `${scope}:${auth.entity()?.id ?? `user-${auth.user()?.id ?? 'visitor'}`}`
  if (!lists.has(key)) lists.set(key, reactive({ keyword: '', status: null, board: null, page: 1, scroll: 0 }))
  const state = lists.get(key)!
  onBeforeRouteLeave(() => { state.scroll = window.scrollY })
  async function restoreScroll() { await nextTick(); window.scrollTo({ top: state.scroll }) }
  return { ...toRefs(state), restoreScroll }
}
