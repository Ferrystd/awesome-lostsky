<script setup lang="ts">
import { NConfigProvider } from 'naive-ui'
import { workspaceSceneProviderProps } from '@lostsky/ui/workspace-scene-theme'
import LsWorkspaceScene from '@lostsky/ui/components/LsWorkspaceScene.vue'
</script>
<template><NConfigProvider v-bind="workspaceSceneProviderProps(true)"><LsWorkspaceScene><slot /></LsWorkspaceScene></NConfigProvider></template>
