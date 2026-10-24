<script setup lang="ts">
import { MoreHorizontal } from '@lucide/vue'
import { NButton, NDropdown, type DropdownOption } from 'naive-ui'
import { computed, h, ref, type Component } from 'vue'
import { RouterLink, useRouter, type RouteLocationRaw } from 'vue-router'
import LsPageLink from './LsPageLink.vue'

type Destination = { to: RouteLocationRaw; href?: never } | { to?: never; href: string }
type NavigationLink = Destination & { label: string; icon: Component; target?: '_self' | '_blank' | '_parent' | '_top'; rel?: string }
const props = defineProps<{ label: string; links: NavigationLink[] }>()
const router = useRouter()
const open = ref(false)
const options = computed<DropdownOption[]>(() => props.links.map((link, index) => ({
  key: index,
  label: () => {
    const attributes = {
      target: link.target, rel: link.rel, tabindex: -1,
      style: { display: 'block', color: 'inherit', textDecoration: 'none', whiteSpace: 'normal', overflowWrap: 'anywhere', maxWidth: 'min(18rem, calc(100vw - 5rem))' },
      onClick: (event: MouseEvent) => { event.stopPropagation(); open.value = false },
    }
    return link.to !== undefined
      ? h(RouterLink as Component, { ...attributes, to: link.to }, { default: () => link.label })
      : h('a', { ...attributes, href: link.href }, link.label)
  },
  icon: () => h(link.icon, { size: 16, 'aria-hidden': true }),
})))
function navigate(key: string | number) {
  const link = props.links[Number(key)]
  if (!link) return
  open.value = false
  const href = link.to !== undefined ? router.resolve(link.to).href : link.href
  if (link.target === '_blank') window.open(href, '_blank', 'noopener,noreferrer')
  else if (link.to !== undefined) void router.push(link.to)
  else window.location.assign(href)
}
</script>

<template>
  <nav v-if="links.length" class="ls-page-navigation" :aria-label="label">
    <div class="ls-page-navigation__links"><LsPageLink v-for="(link, index) in links" :key="index" v-bind="link" /></div>
    <div class="ls-page-navigation__menu">
      <NDropdown :show="open" trigger="click" placement="bottom-end" :options="options" @update:show="open = $event" @select="navigate">
        <NButton text class="ls-page-navigation__trigger" :aria-label="label" :title="label" aria-haspopup="menu" :aria-expanded="open"><MoreHorizontal :size="20" aria-hidden="true" /></NButton>
      </NDropdown>
    </div>
  </nav>
</template>

<style scoped>
.ls-page-navigation { min-width: 0; }
.ls-page-navigation__links { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: .5rem .75rem; }
.ls-page-navigation__menu { display: none; }
.ls-page-navigation__trigger { width: 44px; min-width: 44px; height: 44px; padding: 0; color: var(--text-secondary); }
@container (max-width: 40rem) {
  .ls-page-navigation__links { display: none; }
  .ls-page-navigation__menu { display: block; }
}
</style>
