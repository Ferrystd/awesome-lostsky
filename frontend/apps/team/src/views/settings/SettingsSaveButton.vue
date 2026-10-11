<script setup lang="ts">
import LsButton from '@lostsky/ui/components/LsButton.vue'

withDefaults(defineProps<{
  loading?: boolean
  disabled?: boolean
}>(), { loading: false, disabled: false })
</script>

<template>
  <LsButton
    class="settings-save-button"
    type="submit"
    :loading="loading"
    :disabled="disabled"
  >
    <slot />
  </LsButton>
</template>

<style scoped>
.settings-save-button { width: min(9rem, 100%); }
@media (max-width: 639px) {
  .settings-save-button { width: 100%; }
}
</style>
