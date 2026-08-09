<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  eyebrow?: string
  id?: string
  headingLevel?: 2 | 3 | 4
}>(), { headingLevel: 2 })
</script>

<template>
  <div class="ls-section-header">
    <div class="ls-section-header__copy">
      <p v-if="eyebrow" class="ls-section-header__eyebrow">{{ eyebrow }}</p>
      <component :is="`h${headingLevel}`" :id="id">{{ title }}</component>
      <p v-if="description" class="ls-section-header__description">{{ description }}</p>
    </div>
    <div v-if="$slots.aside" class="ls-section-header__aside"><slot name="aside" /></div>
  </div>
</template>

<style scoped>
.ls-section-header { min-width: 0; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.ls-section-header__copy { min-width: 0; }
.ls-section-header h2,
.ls-section-header h3,
.ls-section-header h4,
.ls-section-header p { margin: 0; }
.ls-section-header h2,
.ls-section-header h3,
.ls-section-header h4 { color: var(--ink); font-size: 1.05rem; line-height: 1.4; overflow-wrap: anywhere; }
.ls-section-header__eyebrow { margin-bottom: .25rem !important; color: var(--sky-lost-strong); font-size: .72rem; font-weight: 750; letter-spacing: .08em; }
.ls-section-header__description { max-width: 65ch; margin-top: .3rem !important; color: var(--muted-ink); font-size: .82rem; line-height: 1.55; overflow-wrap: anywhere; }
.ls-section-header__aside { flex: none; min-height: 44px; display: flex; align-items: center; justify-content: flex-end; gap: .75rem; }
@media (max-width: 639px) {
  .ls-section-header { align-items: stretch; flex-direction: column; }
  .ls-section-header__aside { width: 100%; justify-content: flex-start; flex-wrap: wrap; }
  .ls-section-header__aside :deep(.ls-button) { width: 100%; }
}
</style>
