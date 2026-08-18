export type StatsPeriod = 'day' | 'week' | 'month'

export function startOfPeriod(timestamp: number, period: StatsPeriod): Date {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  if (period === 'week') {
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  } else if (period === 'month') {
    date.setDate(1)
  }
  return date
}

export function periodRange(timestamp: number, period: StatsPeriod): [number, number] {
  const start = startOfPeriod(timestamp, period)
  const end = new Date(start)
  if (period === 'day') end.setDate(end.getDate() + 1)
  if (period === 'week') end.setDate(end.getDate() + 7)
  if (period === 'month') end.setMonth(end.getMonth() + 1)
  return [start.getTime(), end.getTime()]
}

export function shiftPeriod(timestamp: number, period: StatsPeriod, amount: number): number {
  const date = startOfPeriod(timestamp, period)
  if (period === 'day') date.setDate(date.getDate() + amount)
  if (period === 'week') date.setDate(date.getDate() + amount * 7)
  if (period === 'month') date.setMonth(date.getMonth() + amount)
  return date.getTime()
}

export function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fillTimeline<T extends { date: string; count: number; amount: string; receipt_amount: string }>(
  rows: T[],
  start: number,
  end: number,
  period: StatsPeriod,
): T[] {
  const byDate = new Map(rows.map(row => [row.date, row]))
  const cursor = new Date(start)
  const result: T[] = []
  while (cursor.getTime() < end) {
    const key = period === 'day'
      ? `${dateKey(cursor)} ${String(cursor.getHours()).padStart(2, '0')}:00`
      : dateKey(cursor)
    result.push(byDate.get(key) ?? ({ date: key, count: 0, amount: '0.00', receipt_amount: '0.00' } as T))
    if (period === 'day') cursor.setHours(cursor.getHours() + 1)
    else cursor.setDate(cursor.getDate() + 1)
  }
  return result
}
