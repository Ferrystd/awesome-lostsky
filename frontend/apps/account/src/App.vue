<script setup lang="ts">
import { workspaceSceneProviderProps } from '@lostsky/ui/workspace-scene-theme'

import { lostskyNaiveTheme } from '@lostsky/ui/naive-theme'
import { setLucideProps } from '@lucide/vue'
import { NConfigProvider, NDialogProvider, NMessageProvider, zhCN } from 'naive-ui'
import { RouterView } from 'vue-router'
setLucideProps({ strokeWidth: 1.8 })
</script>
<template><NConfigProvider :theme-overrides="lostskyNaiveTheme" :locale="zhCN" v-bind="workspaceSceneProviderProps(true)"><NDialogProvider><NMessageProvider><RouterView /></NMessageProvider></NDialogProvider></NConfigProvider></template>
