import { afterEach, describe, expect, it, vi } from 'vitest'
import { loginUrl, redirectToLogin, safeRedirect } from './navigation'

afterEach(() => vi.unstubAllGlobals())

describe('safeRedirect', () => {
  it('accepts local and LostSky HTTPS destinations only', () => {
    expect(safeRedirect('/teams')).toBe('/teams')
    expect(safeRedirect('https://demo.team.lostsky.work/members')).toBe('https://demo.team.lostsky.work/members')
    expect(safeRedirect('https://demo.chat.lostsky.work/?conversation=abc#latest')).toBe('https://demo.chat.lostsky.work/?conversation=abc#latest')
    expect(safeRedirect('https://example.com/phishing')).toBe('/teams')
    expect(safeRedirect('//example.com/phishing')).toBe('/teams')
    expect(safeRedirect('javascript:alert(1)')).toBe('/teams')
  })

  it('preserves a complete Chat deep link in the shared login URL', () => {
    const redirect = 'https://demo.chat.lostsky.work/?conversation=123e4567-e89b-42d3-a456-426614174000#latest'
    vi.stubGlobal('location', { href: redirect })

    const target = new URL(loginUrl({ expired: true }), 'https://account.lostsky.work')
    expect(target.pathname).toBe('/login')
    expect(target.searchParams.get('redirect')).toBe(redirect)
    expect(target.searchParams.get('expired')).toBe('1')
  })

  it('uses history replacement when authentication is required', () => {
    const replace = vi.fn()
    vi.stubGlobal('location', { href: 'https://demo.chat.lostsky.work/new', replace })

    redirectToLogin()

    expect(replace).toHaveBeenCalledOnce()
    const target = new URL(String(replace.mock.calls[0]?.[0]), 'https://account.lostsky.work')
    expect(target.searchParams.get('redirect')).toBe('https://demo.chat.lostsky.work/new')
  })
})
