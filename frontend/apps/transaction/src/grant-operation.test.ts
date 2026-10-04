import { readFileSync } from 'node:fs'
import { compileScript, parse } from '@vue/compiler-sfc'
import { transformSync } from 'esbuild'
import * as Vue from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useQueryDraft } from '../../../packages/shared/src/useQueryDraft'
import * as grants from './lib/grantOperation'

class RequestError extends Error {
  constructor(public status: number) { super(`HTTP ${status}`) }
}
function memoryStorage(): Storage {
  const records = new Map<string, string>()
  return {
    get length() { return records.size },
    getItem: key => records.get(key) ?? null,
    setItem: (key, value) => { records.set(key, value) },
    removeItem: key => { records.delete(key) },
    key: index => [...records.keys()][index] ?? null,
    clear: () => records.clear(),
  }
}
const payload: grants.GrantPayload = { product_id: 31, customer_id: 8, quantity: 1, sender_entity_id: 11, cs_entity_id: null }
const result = { entitlement_ids: [101], entitlement_count: 1, transaction_id: null, order_id: null }
const activeScopes: Vue.EffectScope[] = []
beforeEach(() => {
  vi.stubGlobal('sessionStorage', memoryStorage())
  vi.stubGlobal('location', { host: 'demo.transaction.lostsky.work' })
})
afterEach(() => { activeScopes.splice(0).forEach(scope => scope.stop()); vi.unstubAllGlobals() })

function setup(post: (body: any) => Promise<unknown>, personal = false) {
  const route = Vue.reactive({ meta: { workspace: personal ? 'personal' : 'team' } })
  const access = Vue.ref<any>({ team: { id: 1 }, identity: { entity_id: 11 }, abilities: { transaction: { enabled: true } } })
  const source = readFileSync('frontend/apps/transaction/src/views/EntitlementGrantView.vue', 'utf8')
  const code = transformSync(compileScript(parse(source).descriptor, { id: 'grant' }).content, { loader: 'ts', format: 'cjs' }).code
  const module = { exports: {} as any }
  const require = (id: string): any => {
    if (id === 'vue') return Vue
    if (id === 'vue-router') return { useRoute: () => route, useRouter: () => ({ back() {} }) }
    if (id.endsWith('/grantOperation')) return grants
    if (id.endsWith('/useQueryDraft')) return { useQueryDraft }
    if (id.endsWith('/useUnsavedChangesGuard')) return { useUnsavedChangesGuard() {} }
    if (id.endsWith('/useRouteAccess')) return { useRouteAccess: () => ({ restricted: Vue.ref(false), reason: Vue.ref('') }) }
    if (id.endsWith('/feedback')) return { feedback: { success() {}, info() {} } }
    if (id === '@lostsky/api/client') return { ApiError: RequestError, friendlyError: (error: Error) => error.message, api: { post: (_path: string, body: any) => post(body) } }
    if (id.endsWith('/navigation')) return { shopWorkspaceUrl: () => '/shop' }
    if (id.endsWith('/workspace-access')) return { transactionAbilityReason: () => '', resolveTransactionAbilityReason: async () => '' }
    if (id === '../lib') return { customerOptions: () => [{ label: '顾客', value: 8 }], money: String }
    if (id === '@tanstack/vue-query') return {
      useQuery: (config: any) => ({ data: Vue.unref(config.queryKey)[0] === 'transaction-workspace-access' ? access : Vue.ref({ products: [{ id: 31, name: '服务', price: '10' }], customers: [{ id: 8 }] }), isPending: Vue.ref(false), isError: Vue.ref(false) }),
      useMutation: (config: any) => ({ mutateAsync: (value: any) => config.mutationFn(value) }),
    }
    return {}
  }
  new Function('require', 'module', 'exports', code)(require, module, module.exports)
  const effect = Vue.effectScope()
  activeScopes.push(effect)
  const state = effect.run(() => module.exports.default.setup({}, { expose() {} }))
  return { state, access, route, stop: () => effect.stop() }
}
const fill = (state: any) => Object.assign(state.form, payload)

describe('manual grant operation persistence', () => {
  it('restores a lost response after refresh and replays the frozen payload and key', async () => {
    const post = vi.fn().mockRejectedValueOnce(new RequestError(0)).mockResolvedValue(result)
    const first = setup(post)
    fill(first.state)
    await first.state.submit()
    const firstBody = post.mock.calls[0][0]
    expect(firstBody.idempotency_key).toMatch(/^[0-9a-f-]{36}$/)
    expect(first.state.pending.value).not.toBeNull()
    first.stop()
    const refreshed = setup(post)
    expect(refreshed.state.form.product_id).toBe(31)
    // Pending retries must not depend on current product candidates or ability availability.
    refreshed.state.options.data.value = { products: [], customers: [] }
    refreshed.state.options.isError.value = true
    refreshed.access.value.abilities.transaction.enabled = false
    await refreshed.state.submit()
    expect(post.mock.calls[1][0]).toEqual(firstBody)
    expect(refreshed.state.result.value).toEqual(result)
    expect(sessionStorage.length).toBe(0)
    expect(refreshed.state.pending.value).toBeNull()
  })

  it('isolates pending operations by team, entity and workspace entry', async () => {
    const page = setup(async () => { throw new RequestError(0) })
    fill(page.state)
    await page.state.submit()
    const original = page.state.pending.value.key
    page.access.value = { ...page.access.value, identity: { entity_id: 12 } }
    expect(page.state.pending.value).toBeNull()
    page.access.value = { ...page.access.value, identity: { entity_id: 11 }, team: { id: 2 } }
    expect(page.state.pending.value).toBeNull()
    page.access.value = { ...page.access.value, team: { id: 1 } }
    expect(page.state.pending.value.key).toBe(original)
    page.route.meta.workspace = 'personal'
    expect(page.state.pending.value).toBeNull()
    page.route.meta.workspace = 'team'
    expect(page.state.pending.value.key).toBe(original)
  })

  it('does not overwrite the current draft when a response arrives after changing identity', async () => {
    let finish!: (value: unknown) => void
    const page = setup(() => new Promise(resolve => { finish = resolve }))
    fill(page.state)
    const submitted = page.state.submit()
    await Vue.nextTick()
    page.access.value = { ...page.access.value, identity: { entity_id: 12 } }
    page.state.form.customer_id = 99
    finish(result)
    await submitted
    expect(page.state.form.customer_id).toBe(99)
    expect(page.state.result.value).toBeNull()
  })

  it('blocks sending when session storage cannot persist the operation', async () => {
    const post = vi.fn()
    const page = setup(post)
    fill(page.state)
    vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => { throw new Error('quota') })
    await page.state.submit()
    expect(post).not.toHaveBeenCalled()
    expect(page.state.storageError.value).toContain('尚未发送')
  })

  it('accepts the matching pending response after leaving and returning to its scope', async () => {
    let finish!: (value: unknown) => void
    const page = setup(() => new Promise(resolve => { finish = resolve }))
    fill(page.state)
    const submitted = page.state.submit()
    await Vue.nextTick()
    page.route.meta.workspace = 'personal'
    page.route.meta.workspace = 'team'
    expect(page.state.pending.value).not.toBeNull()
    finish(result)
    await submitted
    expect(page.state.pending.value).toBeNull()
    expect(page.state.result.value).toEqual(result)
    expect(sessionStorage.length).toBe(0)
  })

  it('can confirm a restored operation after an earlier page already cleared its record', async () => {
    let finish!: (value: unknown) => void
    const previous = setup(() => new Promise(resolve => { finish = resolve }))
    fill(previous.state)
    const submitted = previous.state.submit()
    await Vue.nextTick()
    previous.stop()
    const restored = setup(async () => result)
    finish(result)
    await submitted
    expect(sessionStorage.length).toBe(0)
    await restored.state.submit()
    expect(restored.state.pending.value).toBeNull()
    expect(restored.state.result.value).toEqual(result)
  })

  it('allows editing and generates a new key only after a definitive 422 rejection', async () => {
    const post = vi.fn().mockRejectedValueOnce(new RequestError(422)).mockResolvedValue(result)
    const page = setup(post)
    fill(page.state)
    await page.state.submit()
    expect(page.state.pending.value).toBeNull()
    expect(page.state.form.product_id).toBe(31)
    page.state.form.quantity = 2
    await page.state.submit()
    expect(post.mock.calls[1][0].quantity).toBe(2)
    expect(post.mock.calls[1][0].idempotency_key).not.toBe(post.mock.calls[0][0].idempotency_key)
  })

  it.each([401, 403, 409, 429, 500])('retains the same operation after HTTP %s', async status => {
    const post = vi.fn().mockRejectedValue(new RequestError(status))
    const page = setup(post)
    fill(page.state)
    await page.state.submit()
    page.state.form.quantity = 10 // Even an out-of-band mutation cannot change a pending request.
    await page.state.submit()
    expect(post.mock.calls[1][0]).toEqual(post.mock.calls[0][0])
    expect(page.state.pending.value).not.toBeNull()
  })

  it('ignores a stale completion when a newer operation occupies the same scope', () => {
    const scope = grants.grantScope('host', 1, 11, false)
    const old = grants.beginGrantOperation(scope, payload)
    grants.finishGrantOperation(scope, old.key)
    const current = grants.beginGrantOperation(scope, payload)
    expect(grants.finishGrantOperation(scope, old.key)).toBe(false)
    expect(grants.loadGrantOperation(scope)?.key).toBe(current.key)
  })

  it('blocks invalid numeric input and overlapping submissions', async () => {
    const post = vi.fn().mockResolvedValue(result)
    const page = setup(post)
    fill(page.state)
    page.state.form.quantity = null
    await page.state.submit()
    expect(post).not.toHaveBeenCalled()
    page.state.form.quantity = 1
    await Promise.all([page.state.submit(), page.state.submit()])
    expect(post).toHaveBeenCalledTimes(1)
  })
})
