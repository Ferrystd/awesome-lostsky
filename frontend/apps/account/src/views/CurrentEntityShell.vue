<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import { identityUrl, safeRedirect } from '@lostsky/shared/navigation'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import { ArrowLeft, KeyRound, RefreshCw, SlidersHorizontal, UserRound } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useCurrentEntityQuery } from '../lib/current-entity'

const route = useRoute()
const query = useCurrentEntityQuery()
const identity = computed(() => query.data.value?.identity ?? null)
const returnTo = computed(() => safeRedirect(route.query.redirect, '/teams'))
const switchUrl = computed(() => identityUrl(location.href))
const tabs = [
  { to: '/identity/current/profile', label: '资料', icon: UserRound },
  { to: '/identity/current/fields', label: '对象字段', icon: SlidersHorizontal },
  { to: '/identity/current/access', label: '角色权限', icon: KeyRound },
]
function recheckCurrentIdentity() {
  void query.refetch()
}
onMounted(() => window.addEventListener('focus', recheckCurrentIdentity))
onBeforeUnmount(() => window.removeEventListener('focus', recheckCurrentIdentity))
</script>

<template>
  <div class="current-entity-shell">
    <a class="skip" href="#current-entity-content">跳到主要内容</a>
    <header class="account-topbar">
      <a class="back" :href="returnTo"><ArrowLeft :size="18" />返回</a>
      <div><strong>LostSky Account</strong><span>当前实体中心</span></div>
      <a :href="switchUrl">切换身份</a>
    </header>

    <main id="current-entity-content" tabindex="-1">
      <LsAsyncState v-if="query.isPending.value" state="loading" :rows="5" />
      <div v-else-if="query.isError.value" class="shell-state">
        <LsAsyncState state="error" title="暂时无法核对当前身份" :description="friendlyError(query.error.value)" />
        <LsButton variant="secondary" @click="query.refetch()"><template #icon><RefreshCw :size="17" /></template>重新加载</LsButton>
      </div>
      <LsEmptyState
        v-else-if="!identity"
        title="尚未使用实体身份"
        description="先从身份选择页领取成员、虚拟实体或客户身份，再维护当前实体。"
      />
      <div v-else class="entity-layout">
        <aside class="identity-rail" aria-label="当前身份摘要">
          <LsEntityIdentity
            :type="identity.type"
            :name="identity.name"
            :slug="identity.slug || ''"
            :image-url="identity.avatar"
            fallback="initial"
            size="lg"
          />
          <dl>
            <div class="team-summary"><dt>所属团队</dt><dd>{{ identity.team.name }}</dd></div>
            <div class="secondary-summary"><dt>实体 ID</dt><dd class="ls-tabular">{{ identity.entity_id }}</dd></div>
            <div v-if="identity.status_label" class="secondary-summary"><dt>当前状态</dt><dd>{{ identity.status_label }}</dd></div>
          </dl>
          <a class="switch-link" :href="switchUrl">切换身份</a>
        </aside>

        <section class="task-area">
          <nav class="local-nav" aria-label="当前实体中心导航">
            <RouterLink v-for="tab in tabs" :key="tab.to" :to="{ path: tab.to, query: route.query }">
              <component :is="tab.icon" :size="17" aria-hidden="true" />{{ tab.label }}
            </RouterLink>
          </nav>
          <LsEmptyState
            v-if="!query.data.value?.supported"
            title="当前身份暂不支持自我管理"
            :description="query.data.value?.unsupported_reason || '请切换身份或进入对应的 Team 管理流程。'"
          />
          <RouterView v-else />
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.current-entity-shell{min-height:100dvh;background:var(--cloud)}.skip{position:fixed;z-index:100;left:1rem;top:-4rem;padding:.65rem 1rem;background:white;border-radius:8px}.skip:focus{top:1rem}.account-topbar{position:sticky;z-index:var(--z-sticky);top:0;height:64px;display:grid;grid-template-columns:minmax(7rem,1fr) auto minmax(7rem,1fr);align-items:center;padding:0 1.25rem;background:white;border-bottom:1px solid var(--line)}.account-topbar>div{display:flex;align-items:baseline;gap:.55rem}.account-topbar>div strong{font-family:'Barlow Condensed';font-size:1.25rem}.account-topbar>div span{color:var(--muted-ink);font-size:.78rem}.account-topbar>a{min-height:44px;display:inline-flex;align-items:center;gap:.4rem;color:var(--sky-lost-strong);font-size:.85rem;font-weight:650}.account-topbar>a:last-child{justify-self:end}.current-entity-shell main{width:min(100% - 2rem,76rem);margin:0 auto;padding:1.5rem 0 3rem}.shell-state{display:grid;justify-items:start;gap:1rem}.entity-layout{display:grid;grid-template-columns:16rem minmax(0,1fr);gap:1.5rem;align-items:start}.identity-rail{position:sticky;top:5.5rem;display:grid;gap:1.25rem;padding:1.25rem;background:white;border:1px solid var(--line);border-radius:var(--radius-lg)}.identity-rail dl{display:grid;gap:.75rem;margin:0;padding-top:1rem;border-top:1px solid var(--line)}.identity-rail dl div{display:grid;gap:.12rem}.identity-rail dt{color:var(--muted-ink);font-size:.72rem}.identity-rail dd{margin:0;overflow-wrap:anywhere;font-size:.85rem;font-weight:650}.switch-link{min-height:44px;display:flex;align-items:center;justify-content:center;color:var(--sky-lost-strong);background:var(--cloud);border-radius:8px;font-size:.84rem;font-weight:650}.task-area{min-width:0;display:grid;gap:1rem}.local-nav{display:grid;grid-template-columns:repeat(3,1fr);padding:.3rem;background:white;border:1px solid var(--line);border-radius:10px}.local-nav a{min-height:44px;display:flex;align-items:center;justify-content:center;gap:.4rem;color:var(--muted-ink);border-radius:7px;font-size:.85rem;font-weight:650;transition:color var(--motion-fast) var(--ease-standard),background-color var(--motion-fast) var(--ease-standard)}.local-nav a:hover{color:var(--ink);background:var(--cloud)}.local-nav a.router-link-active{color:var(--sky-lost-strong);background:color-mix(in oklch,var(--sky-lost),white 88%)}
@media(max-width:767px){.account-topbar{grid-template-columns:1fr auto;height:60px;padding:0 .75rem}.account-topbar>div{display:none}.account-topbar>a:last-child{justify-self:end}.current-entity-shell main{width:min(100% - 1rem,76rem);padding:.75rem 0 2rem}.entity-layout{grid-template-columns:1fr;gap:.75rem}.identity-rail{position:static;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:.55rem 1rem;padding:1rem}.identity-rail dl{display:block;grid-column:2;grid-row:1;margin:0;padding:0;border:0;text-align:right}.identity-rail .secondary-summary,.identity-rail .switch-link{display:none}.identity-rail dt{font-size:.68rem}.identity-rail dd{max-width:9rem}.task-area{gap:.75rem}.local-nav{position:sticky;z-index:calc(var(--z-sticky) - 1);top:60px}.local-nav a{min-width:0;flex-direction:column;gap:.1rem;padding:.35rem .15rem;font-size:.72rem}}
</style>
