let position = { scope: '', top: 0 }

export function feedPosition(scope: string) {
  if (position.scope !== scope) position = { scope, top: 0 }
  return { top: position.top }
}

export function saveFeedPosition(scope: string, top: number) {
  position = { scope, top }
}
