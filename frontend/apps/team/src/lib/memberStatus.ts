export type MemberStatusCode = 'active' | 'blocked' | 'departed'

export function memberStatusCode(member: Record<string, unknown>): MemberStatusCode {
  const code = String(member.status_code ?? '').toLowerCase()
  if (code === 'active' || code === 'blocked' || code === 'departed') return code
  throw new TypeError('成员状态代码不正确')
}

export function memberStatusLabel(member: Record<string, unknown>): string {
  return String(member.status_label || ({ active: '正常', blocked: '已封禁', departed: '已离队' }[memberStatusCode(member)]))
}

export function memberStatusType(member: Record<string, unknown>): 'success' | 'error' | 'warning' {
  return ({ active: 'success', blocked: 'error', departed: 'warning' } as const)[memberStatusCode(member)]
}
