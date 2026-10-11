import type { InjectionKey, Ref } from 'vue'
export const teamSceneKey: InjectionKey<{ paused: Ref<boolean>; available: Ref<boolean> }> = Symbol('team-scene')
