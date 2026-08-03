export type MemberStatusCode = 'active' | 'blocked' | 'departed'

export function memberStatusCode(member: Record<string, unknown>): MemberStatusCode {
  const code = String(member.status_code ?? '').toLowerCase()
  if (code === 'blocked' || code === 'departed') return code
  if (Number(member.status) === 2 || Number(member.is_blocked) === 1) return 'blocked'
  if (Number(member.status) === 3) return 'departed'
  return 'active'
}

export function memberStatusLabel(member: Record<string, unknown>): string {
  return String(member.status_label || ({ active: '正常', blocked: '已封禁', departed: '已离队' }[memberStatusCode(member)]))
}

export function memberStatusType(member: Record<string, unknown>): 'success' | 'error' | 'warning' {
  return ({ active: 'success', blocked: 'error', departed: 'warning' } as const)[memberStatusCode(member)]
}
