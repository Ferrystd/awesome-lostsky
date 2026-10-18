import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  chatWorkspaceUrl,
  loginUrl,
  memberIdentityCallbackUrl,
  redirectToWorkspaceWarning,
  redirectWorkspaceRoleError,
  redirectToLogin,
  safeRedirect,
  shopWorkspaceUrl,
  teamWorkspaceUrl,
  teamScopedAppUrl,
  transactionWorkspaceUrl,
  workspaceWarningUrl,
} from './navigation'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

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

  it('preserves a LostSky development subdomain deep link through the Account subdomain', () => {
    const redirect = 'http://demo.team.lostsky.work:5175/doc?id=11#content'
    vi.stubGlobal('location', {
      href: redirect,
      hostname: 'demo.team.lostsky.work',
      port: '5175',
      protocol: 'http:',
    })

    const target = new URL(loginUrl())
    expect(target.origin).toBe('http://account.lostsky.work:5174')
    expect(target.pathname).toBe('/login')
    expect(target.searchParams.get('redirect')).toBe(redirect)
    expect(safeRedirect(target.searchParams.get('redirect'))).toBe(redirect)
  })

  it('keeps browser-facing LostSky development URLs free of internal Vite ports', () => {
    const redirect = 'http://demo.team.lostsky.work/doc?id=11#content'
    vi.stubGlobal('location', {
      href: redirect,
      hostname: 'demo.team.lostsky.work',
      port: '',
      protocol: 'http:',
    })

    const target = new URL(loginUrl())
    expect(target.origin).toBe('http://account.lostsky.work')
    expect(target.searchParams.get('redirect')).toBe(redirect)
    expect(safeRedirect(target.searchParams.get('redirect'))).toBe(redirect)
  })

  it('accepts an HTTP LostSky return URL from an HTTP Account page in production builds', () => {
    const redirect = 'http://demo.team.lostsky.work/doc?id=11#content'
    vi.stubEnv('DEV', false)
    vi.stubGlobal('location', {
      href: `http://account.lostsky.work/login?redirect=${encodeURIComponent(redirect)}`,
      hostname: 'account.lostsky.work',
      port: '',
      protocol: 'http:',
    })

    expect(safeRedirect(redirect)).toBe(redirect)
  })

  it('rejects an HTTP downgrade from an HTTPS Account page', () => {
    vi.stubEnv('DEV', false)
    vi.stubGlobal('location', {
      hostname: 'account.lostsky.work',
      port: '',
      protocol: 'https:',
    })

    expect(safeRedirect('http://demo.team.lostsky.work/private')).toBe('/teams')
  })

  it('rejects non-LostSky hosts and unknown ports during development', () => {
    vi.stubGlobal('location', {
      hostname: 'account.lostsky.work',
      protocol: 'http:',
    })

    expect(safeRedirect('http://demo.team.lostsky.work:9000/private')).toBe('/teams')
    expect(safeRedirect('http://example.com:5175/private')).toBe('/teams')
  })

  it('uses history replacement when authentication is required', () => {
    const replace = vi.fn()
    vi.stubGlobal('location', { href: 'https://demo.chat.lostsky.work/new', replace })

    redirectToLogin()

    expect(replace).toHaveBeenCalledOnce()
    const target = new URL(String(replace.mock.calls[0]?.[0]), 'https://account.lostsky.work')
    expect(target.searchParams.get('redirect')).toBe('https://demo.chat.lostsky.work/new')
  })

  it('preserves a standard LostSky deep link in the member callback URL', () => {
    const href = 'https://demo.transaction.lostsky.work/transactions/7'
    vi.stubGlobal('location', { href })

    const target = new URL(memberIdentityCallbackUrl('demo', 'team_mismatch'), 'https://account.lostsky.work')
    expect(target.searchParams.get('team_slug')).toBe('demo')
    expect(target.searchParams.get('reason')).toBe('team_mismatch')
    expect(target.searchParams.get('return_to')).toBe(href)
  })

  it('uses browser history instead of embedding an untrusted custom-domain return URL', () => {
    vi.stubGlobal('location', { href: 'https://team.example.com/private' })

    const target = new URL(memberIdentityCallbackUrl('demo', 'missing'), 'https://account.lostsky.work')
    expect(target.searchParams.has('return_to')).toBe(false)
  })

  it('builds the shared Account warning URL with a safe workspace return', () => {
    const href = 'https://demo.weibo.lostsky.work/tasks/8'
    vi.stubGlobal('location', { href })

    const target = new URL(workspaceWarningUrl('demo'), 'https://account.lostsky.work')
    expect(target.pathname).toBe('/identity/workspace-warning')
    expect(target.searchParams.get('team_slug')).toBe('demo')
    expect(target.searchParams.get('redirect')).toBe(href)
  })

  it('redirects only required external warning snapshots and structured role errors', () => {
    const replace = vi.fn()
    vi.stubGlobal('location', { href: 'https://demo.team.lostsky.work/', replace })

    expect(redirectToWorkspaceWarning({
      team: { slug: 'demo' },
      identity: { belongs_to_team: false, is_external: true },
      entry_warning: { required: true, kind: 'external_entity', ttl_seconds: 86400 },
    })).toBe(true)
    expect(redirectWorkspaceRoleError({ code: 40304, data: { kind: 'team_workspace_role', team_slug: 'demo' } })).toBe(true)
    expect(replace).toHaveBeenCalledTimes(2)
  })
})

describe('chatWorkspaceUrl', () => {
  it('opens the matching team Chat workspace and preserves participant context', () => {
    vi.stubEnv('DEV', false)
    vi.stubGlobal('location', {
      hostname: 'demo.team.lostsky.work',
      port: '',
      protocol: 'https:',
    })

    expect(chatWorkspaceUrl('/new', { participant: 'member-1' }))
      .toBe('https://chat.lostsky.work/new?participant=member-1')
  })

  it('uses the Chat development port from a local team workspace', () => {
    vi.stubEnv('DEV', true)
    vi.stubGlobal('location', {
      hostname: 'demo.team.lostsky.work',
      port: '5175',
      protocol: 'http:',
    })

    expect(chatWorkspaceUrl()).toBe('http://chat.lostsky.work:5176/')
  })
})

describe('workspace destinations', () => {
  it('moves from Chat to the matching Shop and Team workspaces', () => {
    vi.stubEnv('DEV', true)
    vi.stubGlobal('location', {
      hostname: 'demo.chat.lostsky.work',
      port: '5176',
      protocol: 'http:',
    })

    expect(shopWorkspaceUrl('/customer/profile'))
      .toBe('http://demo.shop.lostsky.work:5179/customer/profile')
    expect(teamWorkspaceUrl('/personal/profile'))
      .toBe('http://demo.team.lostsky.work:5175/personal/profile')
    expect(transactionWorkspaceUrl('/personal'))
      .toBe('http://demo.transaction.lostsky.work:5177/personal')
  })

  it('builds an explicit team-scoped destination from the Account host', () => {
    vi.stubEnv('DEV', true)
    vi.stubGlobal('location', {
      hostname: 'localhost',
      port: '5174',
      protocol: 'http:',
    })
    expect(teamScopedAppUrl('demo', 'shop', '/customer/profile'))
      .toBe('http://localhost:5179/customer/profile')
  })
})
