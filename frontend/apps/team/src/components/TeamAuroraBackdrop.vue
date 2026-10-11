<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createAuroraRenderer } from './aurora-renderer'

const props = defineProps<{ paused: boolean }>()
const emit = defineEmits<{ available: [value: boolean] }>()
const canvas = ref<HTMLCanvasElement | null>(null)
const ready = ref(false)
let renderer: ReturnType<typeof createAuroraRenderer> | undefined
onMounted(() => {
  renderer = createAuroraRenderer(canvas.value!, value => { ready.value = value; emit('available', value) })
  renderer.setPaused(props.paused)
})
watch(() => props.paused, value => renderer?.setPaused(value))
onBeforeUnmount(() => renderer?.destroy())
</script>

<template>
  <div class="team-aurora-backdrop" aria-hidden="true">
    <canvas ref="canvas" :class="{ ready }" />
  </div>
</template>

<style scoped>
.team-aurora-backdrop { position: absolute; inset: 0 0 auto; z-index: -1; height: min(28rem, 75vh); max-height: 100%; overflow: hidden; border-radius: inherit; pointer-events: none; mask-image: linear-gradient(black 11rem, transparent 12rem); background: radial-gradient(ellipse at 20% 12%, #14867480, transparent 58%), radial-gradient(ellipse at 78% 4%, #387bb980, transparent 52%), #050a13; }
canvas { display: block; width: 100%; height: 100%; opacity: 0; }
canvas.ready { opacity: 1; }
@media (max-width: 639px) { .team-aurora-backdrop { height: min(20rem, 65vh); mask-image: linear-gradient(black 8rem, transparent 9rem); } }
</style>
