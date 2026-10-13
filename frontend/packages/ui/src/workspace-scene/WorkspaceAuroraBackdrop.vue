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
.team-aurora-backdrop { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; background: radial-gradient(ellipse 90% 70% at 18% 105%, transparent 48%, #125852 51%, #2f586f 52%, #124b49 54%, transparent 59%), radial-gradient(ellipse 85% 60% at 88% -15%, transparent 49%, #173c68 52%, #2e5874 53%, #162f53 55%, transparent 60%), radial-gradient(ellipse 110% 80% at 80% 115%, transparent 48%, #125650 51%, #28586f 52%, transparent 57%), #081319; }
.team-aurora-backdrop.rendered { background: none; }
canvas { display: block; width: 100%; height: 100%; opacity: 0; }
canvas.ready { opacity: 1; }

</style>
