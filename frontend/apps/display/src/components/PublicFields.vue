<script setup lang="ts">
import type { PublicField } from '../types'
import { formatPublicField } from '../lib'

defineProps<{ fields: PublicField[] }>()
</script>

<template>
  <dl v-if="fields.length" class="public-fields">
    <div v-for="field in fields" :key="field.key">
      <dt>{{ field.name }}</dt>
      <dd :class="{ 'pre-value': field.value_type === 'json' || field.value_type === 'text' }">{{ formatPublicField(field) }}</dd>
    </div>
  </dl>
</template>
