import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compileScript, parse } from '@vue/compiler-sfc'
import { transformSync } from 'esbuild'
import * as Vue from 'vue'
import { describe, expect, it } from 'vitest'
import { useQueryDraft } from '../../../packages/shared/src/useQueryDraft'

// Execute the actual setup; mock only queries, transport, navigation and visual dependencies.
function setup(kind: 'Campaign' | 'Package', copy = false) {
  const route = Vue.reactive({ params: { id: copy ? '' : '1' }, query: { copy: copy ? '1' : '' }, meta: { workspace: 'team' } })
  const access = Vue.ref<any>(undefined)
  const records = Vue.reactive<Record<number, any>>({})
  const pushed: string[] = []
  const sent: any[] = []
  let finishSave: ((value: any) => void) | undefined
  const management = {
    personal: false, routePrefix: '/manage', permission: '', disablePermission: '',
    saveCampaign: (_id: number, body: unknown) => { sent.push(body); return new Promise(resolve => { finishSave = resolve }) },
    savePackage: (_id: number, body: unknown) => { sent.push(body); return new Promise(resolve => { finishSave = resolve }) },
  }
  const source = readFileSync(resolve('frontend/apps/shop/src/views/manage', `${kind}FormView.vue`), 'utf8')
  const code = transformSync(compileScript(parse(source).descriptor, { id: kind }).content, { loader: 'ts', format: 'cjs' }).code
  const module = { exports: {} as any }
  const require = (id: string): any => {
    if (id === 'vue') return Vue
    if (id === 'vue-router') return { useRoute: () => route, useRouter: () => ({ push: (path: string) => pushed.push(path) }) }
    if (id.endsWith('/useQueryDraft')) return { useQueryDraft }
    if (id.endsWith('/useUnsavedChangesGuard')) return { useUnsavedChangesGuard: () => {} }
    if (id.endsWith('/useRouteAccess')) return { useRouteAccess: () => ({ restricted: Vue.ref(false), reason: Vue.ref(''), read: (fn: () => unknown) => fn() }) }
    if (id.endsWith('/feedback')) return { feedback: { success: () => {}, info: () => {} } }
    if (id === 'naive-ui') return { useDialog: () => ({ warning: () => {} }) }
    if (id.endsWith('/quantity')) return { quantityScaleForStep: () => 0 }
    if (id.endsWith('/personal-pricing')) return { personalDistributionLocked: () => false }
    if (id.endsWith('/service-distribution')) return { calculateServiceTeamCut: () => 0 }
    if (id === '../../lib') return { entitlementManagement: () => management, canManage: () => true, resourceOwnerLabel: () => '' }
    if (id === '@tanstack/vue-query') return {
      useQuery: (options: any) => ({ data: Vue.computed(() => {
        const key = Vue.unref(options.queryKey) as any[]
        if (key.includes('shop-manage-access')) return access.value
        if (key.includes('manage-options')) return { services: [], packages: [] }
        return records[Number(key.at(-1))]
      }), isPending: Vue.ref(false), isError: Vue.ref(false) }),
      useMutation: (options: any) => ({ isPending: Vue.ref(false), mutateAsync: async () => {
        const data = await options.mutationFn()
        await options.onSuccess?.(data)
        return data
      } }),
    }
    return {}
  }
  new Function('require', 'module', 'exports', code)(require, module, module.exports)
  const scope = Vue.effectScope()
  const state = scope.run(() => module.exports.default.setup({}, { expose: () => {} }))
  const row = (id: number, name: string) => kind === 'Campaign'
    ? { id, name, package_id: 1, claim_group: 'group', mode: 1, total_limit: null, redeem_starts_at: 0, redeem_ends_at: 0, is_active: 1 }
    : { id, name, pricing_mode: 2, is_active: 1, services: [{ id: 3, service_id: 2, quantity: 1, valid_days: 30, unit_price: '1', unit_cost: '0', unit_handler_cut: '0', unit_sender_cut: '0', unit_cs_cut: '0' }] }
  return { state, route, records, access, row, pushed, sent, finish: (id = 1) => finishSave?.({ id }), stop: () => scope.stop() }
}

describe.each(['Campaign', 'Package'] as const)('%s real setup query draft', kind => {
  it('hydrates clean refreshes, protects dirty input and rehydrates after a late access identity', async () => {
    const page = setup(kind)
    page.records[1] = page.row(1, '初始')
    await Vue.nextTick()
    expect(page.state.form.name).toBe('初始')
    page.access.value = { team: { id: 2 }, identity: { entity_id: 4 } }
    await Vue.nextTick()
    expect(page.state.form.name).toBe('初始')
    page.records[1] = page.row(1, '远端更新')
    await Vue.nextTick()
    expect(page.state.form.name).toBe('远端更新')
    page.state.form.name = '本地草稿'
    page.records[1] = page.row(1, '后台刷新')
    await Vue.nextTick()
    expect(page.state.form.name).toBe('本地草稿')
    expect(page.state.draft.dirty.value).toBe(true)
    page.stop()
  })

  it('confirms only the submitted snapshot and ignores a save response after switching objects', async () => {
    const page = setup(kind)
    page.records[1] = page.row(1, '初始')
    await Vue.nextTick()
    page.state.form.name = '提交值'
    const save = page.state.save.mutateAsync()
    page.state.form.name = '请求期间输入'
    page.finish()
    await save
    expect(page.sent[0].name).toBe('提交值')
    if (kind === 'Campaign') expect(page.sent[0]).not.toHaveProperty('per_target_limit')
    expect(page.state.form.name).toBe('请求期间输入')
    expect(page.state.draft.dirty.value).toBe(true)
    expect(page.pushed).toEqual([])
    const lateSave = page.state.save.mutateAsync()
    page.records[2] = page.row(2, '第二对象')
    page.route.params.id = '2'
    await Vue.nextTick()
    expect(page.state.form.name).toBe('第二对象')
    page.finish()
    await lateSave
    expect(page.state.form.name).toBe('第二对象')
    expect(page.state.draft.dirty.value).toBe(false)
    expect(page.pushed).toEqual([])
    page.stop()
  })
})

it('protects a Package copy draft and changes its source only after the task identity changes', async () => {
  const page = setup('Package', true)
  page.records[1] = page.row(1, '来源一')
  await Vue.nextTick()
  expect(page.state.form.name).toBe('来源一（副本）')
  page.state.form.name = '副本草稿'
  page.records[1] = page.row(1, '来源刷新')
  await Vue.nextTick()
  expect(page.state.form.name).toBe('副本草稿')
  page.records[2] = page.row(2, '来源二')
  page.route.query.copy = '2'
  await Vue.nextTick()
  expect(page.state.form.name).toBe('来源二（副本）')
  expect(page.state.draft.dirty.value).toBe(false)
  page.stop()
})
