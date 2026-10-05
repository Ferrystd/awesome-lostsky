import { expect, test as base, type Route } from '@playwright/test'

export { expect }
export type { Locator, Page, Route } from '@playwright/test'

export const test = base.extend<{ _businessApiIsolation: void }>({
  _businessApiIsolation: [async ({ context }, use, testInfo) => {
    const unmocked: { method: string; pathname: string }[] = []
    const businessApi = (url: URL) => url.hostname === 'api.lostsky.work'
      || url.pathname === '/api' || url.pathname.startsWith('/api/')
    const block = async (route: Route) => {
      unmocked.push({ method: route.request().method(), pathname: new URL(route.request().url()).pathname })
      await route.abort('blockedbyclient')
    }
    // Per-page mocks take precedence; this also protects popups and new pages in the context.
    await context.route(businessApi, block)
    await use()
    // Leave the guard installed until the owning context closes, including child pages.
    if (unmocked.length) await testInfo.attach('unmocked-business-api', {
      body: JSON.stringify(unmocked, null, 2), contentType: 'application/json',
    })
    expect(unmocked, 'Every business API request must have an explicit fixture; network fallback is forbidden').toEqual([])
  }, { auto: true }],
})
