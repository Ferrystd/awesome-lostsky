import { inject, ref, type InjectionKey, type Ref } from 'vue'

type WorkspaceSceneState = { paused: Ref<boolean>; available: Ref<boolean> }
export const workspaceSceneKey: InjectionKey<WorkspaceSceneState> = Symbol('workspace-scene')

/** Outside a scene, motion controls stay unavailable. State is local to each scene. */
export function useWorkspaceScene(): WorkspaceSceneState {
  return inject(workspaceSceneKey, { paused: ref(false), available: ref(false) })
}
