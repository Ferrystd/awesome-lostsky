let position = { scope: '', page: 1, top: 0 }

export function feedPosition(scope: string) {
  if (position.scope !== scope) position = { scope, page: 1, top: 0 }
  return { page: position.page, top: position.top }
}

export function saveFeedPosition(scope: string, page: number, top: number) {
  position = { scope, page, top }
}
