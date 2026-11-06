import { describe, expect, it } from 'vitest'
import { coverageErrors, planGroups, reportTests, sitePort } from './e2e-plan.mjs'

const tests = [
  { key: 'mobile/a', file: 'a.spec.ts', project: 'mobile', status: 'expected' },
  { key: 'desktop/a', file: 'a.spec.ts', project: 'desktop', status: 'expected' },
  { key: 'mobile/new', file: 'new.spec.ts', project: 'mobile', status: 'expected' },
]
describe('bounded E2E release coverage', () => {
  it('discovers nested titles and both projects independently of line numbers', () => {
    const report = { suites: [{ title: 'a.spec.ts', file: 'a.spec.ts', suites: [{ title: 'flow', file: 'a.spec.ts', specs: [{ title: 'saves', file: 'a.spec.ts', tests: [{ projectName: 'mobile', status: 'expected' }, { projectName: 'desktop', status: 'expected' }] }] }] }] }
    expect(reportTests(report).map(test => test.key)).toEqual(['["mobile","a.spec.ts","flow","saves"]', '["desktop","a.spec.ts","flow","saves"]'])
  })
  it('includes a newly discovered spec and rejects missing server declarations', () => {
    const servers = [{ url: 'http://127.0.0.1:5175' }, { url: 'http://127.0.0.1:5181' }]
    const groups = planGroups(tests, servers, file => `import { test } from './fixtures'; ${file === 'a.spec.ts' ? 'http://demo:5175/' : 'http://demo:5181/'}`)
    expect(groups.flatMap(group => group.tests)).toEqual(tests)
    expect(() => planGroups(tests, servers, () => "import { test } from './fixtures'; no URL")).toThrow('No local webServer')
    expect(() => planGroups(tests, servers, () => "import { test } from '@playwright/test'; http://demo:5175/")).toThrow('API-isolated')
    for (const bypass of ['browser.newContext()', 'browser.newPage()', 'page.request.get()', 'request.post()', 'request.newContext()']) {
      expect(() => planGroups(tests, servers, () => `import { test } from './fixtures'; ${bypass}; http://demo:5175/`)).toThrow('outside the guarded')
    }
  })
  it('fails closed for omissions, repeats, unknown tests, skips and flaky passes', () => {
    expect(coverageErrors(tests, tests)).toEqual([])
    expect(coverageErrors(tests, tests.slice(1))).toContain('Missing test: mobile/a')
    expect(coverageErrors(tests, [...tests, tests[0]])).toContain('Duplicate test: mobile/a')
    expect(coverageErrors(tests, [...tests, { key: 'unknown', status: 'expected' }])).toContain('Unexpected test: unknown')
    for (const status of ['skipped', 'flaky', 'unexpected']) expect(coverageErrors(tests, tests.map(test => ({ ...test, status })))).toHaveLength(3)
  })
})


describe('isolated Site physical port', () => {
  it('uses the default and rejects invalid or colliding ports', () => {
    expect(sitePort(undefined)).toBe('5173')
    expect(sitePort('15173')).toBe('15173')
    for (const value of ['', '0', '80', '65536', '-1', '1.5', '15173x', '05173', '5175']) {
      expect(() => sitePort(value)).toThrow('E2E_SITE_PORT')
    }
  })
  it('keeps site-only and mixed discovery identities with a physical alias', () => {
    const source = file => `import { test } from './fixtures'; http://127.0.0.1:5173/ ${file === 'new.spec.ts' ? 'http://demo:5175/' : ''}`
    const defaults = [{ url: 'http://127.0.0.1:5173' }, { url: 'http://127.0.0.1:5175' }]
    const isolated = [{ url: 'http://127.0.0.1:15173' }, defaults[1]]
    const baseline = planGroups(tests, defaults, source)
    const groups = planGroups(tests, isolated, source, { '5173': '15173' })
    expect(groups.map(group => group.ports)).toEqual([['15173'], ['15173', '5175']])
    expect(groups.flatMap(group => group.tests)).toEqual(baseline.flatMap(group => group.tests))
    expect(coverageErrors(tests, groups.flatMap(group => group.tests))).toEqual([])
    expect(source('a.spec.ts')).toContain('http://127.0.0.1:5173/')
  })
})
