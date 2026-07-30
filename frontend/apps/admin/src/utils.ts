export function formatTime(value: unknown) {
  const seconds = Number(value ?? 0)
  if (!seconds) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(seconds * 1000)
}

export function statusText(banned: number, cancelled = 0) {
  if (cancelled) return '已注销'
  return banned ? '已封禁' : '正常'
}
