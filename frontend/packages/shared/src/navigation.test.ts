import { describe, expect, it } from 'vitest'
import { safeRedirect } from './navigation'

describe('safeRedirect', () => {
  it('accepts local and LostSky HTTPS destinations only', () => {
    expect(safeRedirect('/teams')).toBe('/teams')
    expect(safeRedirect('https://demo.team.lostsky.work/members')).toBe('https://demo.team.lostsky.work/members')
    expect(safeRedirect('https://example.com/phishing')).toBe('/teams')
    expect(safeRedirect('//example.com/phishing')).toBe('/teams')
    expect(safeRedirect('javascript:alert(1)')).toBe('/teams')
  })
})
