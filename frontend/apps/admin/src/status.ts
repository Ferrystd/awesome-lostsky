export type AdminStatus = 'active' | 'banned' | 'cancelled' | 'healthy' | 'degraded' | 'unhealthy'

const labels: Record<AdminStatus, string> = {
  active: '正常',
  banned: '已封禁',
  cancelled: '已注销',
  healthy: '正常',
  degraded: '需关注',
  unhealthy: '异常',
}

export function adminStatusLabel(status: AdminStatus): string {
  return labels[status]
}

export function adminStatusType(status: AdminStatus): 'success' | 'warning' | 'error' {
  if (status === 'active' || status === 'healthy') return 'success'
  if (status === 'banned' || status === 'unhealthy') return 'error'
  return 'warning'
}
