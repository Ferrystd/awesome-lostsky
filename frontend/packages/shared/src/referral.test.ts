import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { normalizeReferral, storedReferral, syncReferral, withReferral } from './referral'

const values = new Map<string, string>()

beforeEach(() => {
  values.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  })
  vi.stubGlobal('location', { href: 'https://demo.display.lostsky.work/products?tab=all' })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('referral', () => {
  it('normalizes valid entity slugs and rejects unsafe values', () => {
    expect(normalizeReferral(' Member_01 ')).toBe('member_01')
    expect(normalizeReferral(['team-a', 'team-b'])).toBe('team-a')
    expect(normalizeReferral('1-member')).toBe('')
    expect(normalizeReferral('member?next=https://evil.example')).toBe('')
  })

  it('lets the last valid explicit referral replace the stored value', () => {
    expect(syncReferral('member-a')).toBe('member-a')
    expect(storedReferral()).toBe('member-a')
    expect(syncReferral('member-b')).toBe('member-b')
    expect(storedReferral()).toBe('member-b')
    expect(syncReferral(undefined)).toBe('member-b')
  })

  it('adds the stored referral to new internal and cross-app URLs', () => {
    syncReferral('member-a')

    expect(withReferral('/products/7')).toBe('/products/7?ref=member-a')
    expect(withReferral('//demo.shop.lostsky.work/products/7?quantity=2'))
      .toBe('//demo.shop.lostsky.work/products/7?quantity=2&ref=member-a')
  })
})
