<script setup lang="ts">
import ChatScene from './ChatScene.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsSceneMotionControl from '@lostsky/ui/components/LsSceneMotionControl.vue'
import { MessageCircleMore, Plus, Shield } from '@lucide/vue'
defineOptions({ inheritAttrs:false })
defineProps<{ title:string; description?:string }>()
</script>
<template><ChatScene><main class="chat-task"><nav class="chat-task__nav" aria-label="会话工作台"><LsPageLink to="/" :icon="MessageCircleMore" label="消息" /><LsPageLink to="/new" :icon="Plus" label="新会话" /><LsPageLink to="/requests" :icon="Shield" label="邀请与屏蔽" /><LsSceneMotionControl /></nav><div class="chat-task__body"><LsPageHeader :title="title" :description="description" /><LsPanel><div class="chat-task__content"><slot /></div></LsPanel></div></main></ChatScene></template>
<style scoped>
.chat-task{min-height:100dvh;max-width:64rem;margin-inline:auto;padding:2rem 1rem;display:grid;grid-template-columns:11.5rem minmax(0,1fr);gap:1.5rem;align-items:start;color:var(--ink)}.chat-task__nav{display:grid;gap:.75rem;position:sticky;top:2rem}.chat-task__body,.chat-task__content{display:grid;gap:1.5rem;min-width:0;overflow-wrap:anywhere}@media(max-width:767px){.chat-task{grid-template-columns:minmax(0,1fr);padding:1rem}.chat-task__nav{position:static;display:flex;flex-wrap:wrap}}
</style>
