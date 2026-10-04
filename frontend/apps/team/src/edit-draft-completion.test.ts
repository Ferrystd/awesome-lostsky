import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compileScript, parse } from '@vue/compiler-sfc'
import { transformSync } from 'esbuild'
import * as Vue from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useQueryDraft } from '../../../packages/shared/src/useQueryDraft'

function setup(name: string) {
  const source = readFileSync(resolve('frontend/apps/team/src/views', `${name}.vue`), 'utf8')
  const code = transformSync(compileScript(parse(source).descriptor, { id: name }).content, { loader: 'ts', format: 'cjs' }).code
  const module = { exports: {} as any }
  const route = Vue.reactive({ path: '/edit', query: { id: '7', slug: 'original' }, params: { id: '7' }, meta: {} })
  const router = { push: vi.fn(), replace: vi.fn() }
  let finish!: () => void
  const invalidation = new Promise<void>(resolve => { finish = resolve })
  const query = () => ({ data: Vue.ref(undefined), isError: Vue.ref(false), isSuccess: Vue.ref(false), isPending: Vue.ref(false), isFetching: Vue.ref(false), error: Vue.ref(null) })
  const client = { invalidateQueries: vi.fn(() => invalidation) }
  const mocks: Record<string, unknown> = {
    vue: Vue,
    'vue-router': { useRoute: () => route, useRouter: () => router },
    '@lostsky/shared/useQueryDraft': { useQueryDraft },
    '@lostsky/shared/useUnsavedChangesGuard': { useUnsavedChangesGuard: () => {} },
    '@tanstack/vue-query': { useQuery: query, useQueryClient: () => client, useMutation: (options: Record<string, unknown>) => ({ ...options, mutate: vi.fn() }) },
    '@lostsky/api/client': { api: { post: vi.fn(async () => ({ id: 99, slug: 'created', token: 'new-token', signing_secret: 'new-secret' })) } },
    '@lostsky/ui/useRouteAccess': { useRouteAccess: () => ({ restricted: Vue.ref(false), reason: Vue.ref('') }) },
    '@lostsky/ui/feedback': { feedback: { success: vi.fn() } },
    '../lib/teamAccess': { useTeamAccess: query, hasPermission: () => true },
    '../lib/draftScope': { teamDraftScope: (task: string, target: unknown) => JSON.stringify([task, target]) },
    '../lib/permissionHierarchy': { permissionsForSave: (keys: string[]) => [...keys] },
    '../lib/documentTags': { documentTagsPayload: (value: unknown) => value },
    '../lib/joinFields': { usesJoinOptions: () => false },
  }
  new Function('require', 'module', 'exports', code)((id: string) => mocks[id] ?? {}, module, module.exports)
  const scope = Vue.effectScope()
  const state = scope.run(() => module.exports.default.setup({}, { expose: () => {} }))
  return { state, route, router, client, finish, stop: () => scope.stop() }
}

describe('Team save completion after delayed query invalidation', () => {
  for (const name of ['DocumentFormView', 'ChatVirtualFormView', 'ChatIntegrationFormView', 'EntityFieldFormView', 'JoinFieldFormView']) {
    for (const change of ['edit', 'target']) {
      it(`${name}: suppresses stale navigation after ${change} during invalidation`, async () => {
        const page = setup(name)
        if (name === 'ChatIntegrationFormView') page.route.query.id = '0'
        if ('title' in page.state.form) page.state.form.title = 'submitted'
        else page.state.form.name = 'submitted'
        const result = await page.state.save.mutationFn()
        const completion = page.state.save.onSuccess(result)
        expect(page.client.invalidateQueries).toHaveBeenCalledOnce()
        if (change === 'edit') {
          if ('title' in page.state.form) page.state.form.title = 'new input'
          else page.state.form.name = 'new input'
        } else {
          page.route.query.id = '8'
          page.route.query.slug = 'other'
          page.route.params.id = '8'
        }
        await Vue.nextTick()
        page.finish()
        await completion
        expect(page.router.push).not.toHaveBeenCalled()
        expect(page.router.replace).not.toHaveBeenCalled()
        if (name === 'ChatIntegrationFormView') expect(page.state.credentials.token).toBe('')
        if (change === 'edit') expect(page.state.draft.dirty.value).toBe(true)
        page.stop()
      })
    }
  }
})


describe('Role advanced permission confirmation identity', () => {
  it('closes the old confirmation and refuses to submit its keys to a new role', async () => {
    const page = setup('RoleDetailView')
    page.state.catalogQuery.data.value = { groups: [], advanced_items: [{ key: 'team', label: 'Team', covered_keys: [] }] }
    page.state.permissionKeys.value = ['team']
    page.state.requestPermissionSave()
    expect(page.state.showAdvancedConfirm.value).toBe(true)
    expect(page.state.pendingPermissionKeys.value).toEqual(['team'])
    page.route.params.id = '8'
    await Vue.nextTick()
    expect(page.state.showAdvancedConfirm.value).toBe(false)
    expect(page.state.pendingPermissionKeys.value).toEqual([])
    page.state.confirmPermissionSave()
    expect(page.state.savePermissions.mutate).not.toHaveBeenCalled()
    page.stop()
  })
})
