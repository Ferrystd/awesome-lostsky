import type { RouteLocationNormalized } from 'vue-router'
import { auth } from '@lostsky/api/client'

/** Team is selected by host; the acting identity comes from the current session. */
export function teamDraftScope(task: string, target: unknown = '') {
  return JSON.stringify([location.host, auth.entity(), task, target])
}

/** Presentation queries do not change the editing task. */
export function teamDraftNavigationChanged(to: RouteLocationNormalized, from: RouteLocationNormalized) {
  const task = (route: RouteLocationNormalized) => JSON.stringify([route.path, route.params, route.query.id, route.query.slug, route.query.entity_id, route.query.type])
  return task(to) !== task(from)
}
