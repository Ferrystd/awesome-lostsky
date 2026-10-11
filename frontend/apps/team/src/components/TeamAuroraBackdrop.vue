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
.team-aurora-backdrop { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; background: radial-gradient(ellipse at 12% 42%, #12554b, transparent 75%), radial-gradient(ellipse at 88% 76%, #203c62, transparent 80%), #101e27; }
.team-aurora-backdrop.rendered { background: none; }
canvas { display: block; width: 100%; height: 100%; opacity: 0; }
canvas.ready { opacity: 1; }

</style>
