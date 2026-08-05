import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repository = resolve(process.cwd())
const source = (path: string) => readFileSync(join(repository, path), 'utf8')

describe('Account current entity center contract', () => {
  it('uses task routes instead of separate member, virtual and customer pages', () => {
    const router = source('frontend/apps/account/src/router.ts')
    expect(router).toContain("path: '/identity/current'")
    expect(router).toContain("path: 'profile'")
    expect(router).toContain("path: 'fields'")
    expect(router).toContain("path: 'access'")
    expect(router).not.toMatch(/identity\/current\/(?:member|customer|virtual)/)
  })

  it('isolates drafts and every write by global entity id', () => {
    const profile = source('frontend/apps/account/src/views/CurrentEntityProfileView.vue')
    const fields = source('frontend/apps/account/src/views/CurrentEntityFieldsView.vue')
    expect(profile).toContain('lostsky:current-entity:profile:${loadedEntityId.value}')
    expect(fields).toContain('lostsky:current-entity:fields:${loadedEntityId.value}')
    expect(profile).toMatch(/expected_entity_id/g)
    expect(fields).toMatch(/expected_entity_id/g)
  })

  it('freezes stale forms, guards unsaved navigation and keeps mobile controls reachable', () => {
    const profile = source('frontend/apps/account/src/views/CurrentEntityProfileView.vue')
    const fields = source('frontend/apps/account/src/views/CurrentEntityFieldsView.vue')
    const guard = source('frontend/apps/account/src/composables/useUnsavedGuard.ts')
    const shell = source('frontend/apps/account/src/views/CurrentEntityShell.vue')
    expect(profile).toContain('身份已切换，未保存内容没有提交')
    expect(fields).toContain('身份已切换，未保存内容没有提交')
    expect(guard).toContain('beforeunload')
    expect(guard).toContain('onBeforeRouteLeave')
    expect(shell).toContain('grid-template-columns:repeat(3,1fr)')
    expect(profile).toContain('env(safe-area-inset-bottom)')
  })

  it('shows customer assignment only for customers and public media only for member or virtual identities', () => {
    const profile = source('frontend/apps/account/src/views/CurrentEntityProfileView.vue')
    expect(profile).toContain('v-if="isCustomer"')
    expect(profile).toContain('v-if="hasPublicProfile"')
    expect(profile).toContain("['teamMember', 'teamVirtual']")
  })
})
