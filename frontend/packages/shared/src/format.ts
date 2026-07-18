export const formatNumber = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('zh-CN').format(Number(value ?? 0))

export const formatDate = (value: string | number | Date | null | undefined) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(date)
}

export const formatBytes = (value: number | null | undefined) => {
  const bytes = Number(value ?? 0)
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`
}
