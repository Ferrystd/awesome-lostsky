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
  <div class="team-aurora-backdrop" :class="{ rendered: ready }" aria-hidden="true">
    <canvas ref="canvas" :class="{ ready }" />
  </div>
</template>

<style scoped>
.team-aurora-backdrop { position: absolute; inset: 0 0 auto; z-index: -1; height: min(28rem, 75vh); max-height: 100%; overflow: hidden; pointer-events: none; background: radial-gradient(ellipse 17% 3% at 8% 76%, #45d9b9b0, transparent 100%), radial-gradient(ellipse 15% 3% at 87% 28%, #5a98ed90, transparent 100%); }
.team-aurora-backdrop.rendered { background: none; }
canvas { display: block; width: 100%; height: 100%; opacity: 0; }
canvas.ready { opacity: 1; }
@media (max-width: 639px) { .team-aurora-backdrop { height: min(20rem, 65vh); } }
</style>
