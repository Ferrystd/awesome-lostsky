import { describe, expect, it } from 'vitest'
import { fillTimeline, periodRange, shiftPeriod } from './stats-period'

describe('stats periods', () => {
  it('uses Monday as the beginning of a natural week', () => {
    const [start, end] = periodRange(new Date(2026, 7, 19, 16).getTime(), 'week')
    expect(new Date(start).getDay()).toBe(1)
    expect(new Date(start).getDate()).toBe(17)
    expect((end - start) / 86_400_000).toBe(7)
  })

  it('shifts calendar months without carrying the old day', () => {
    const shifted = new Date(shiftPeriod(new Date(2026, 0, 31).getTime(), 'month', 1))
    expect([shifted.getFullYear(), shifted.getMonth(), shifted.getDate()]).toEqual([2026, 1, 1])
  })

  it('fills every hourly bucket with exact zero values', () => {
    const [start, end] = periodRange(new Date(2026, 7, 17, 9).getTime(), 'day')
    const key = `${new Date(start).getFullYear()}-08-17 09:00`
    const rows = fillTimeline([{ date: key, count: 1, amount: '20.00', receipt_amount: '18.00' }], start, end, 'day')
    expect(rows).toHaveLength(24)
    expect(rows[9]?.receipt_amount).toBe('18.00')
    expect(rows[10]?.receipt_amount).toBe('0.00')
  })
})
