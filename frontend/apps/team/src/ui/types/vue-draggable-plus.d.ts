import type { DefineComponent } from 'vue'

export interface DraggableEvent<T = unknown> {
  oldIndex?: number
  newIndex?: number
  data?: T
}

export const VueDraggable: DefineComponent<any, any, any>
