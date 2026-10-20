<script setup lang="ts">
import { lostskyNaiveTheme } from '@lostsky/ui/naive-theme'
import { setLucideProps } from '@lucide/vue'
import { NConfigProvider, NDialogProvider, NMessageProvider, zhCN } from 'naive-ui'
import { RouterView } from 'vue-router'
setLucideProps({ strokeWidth: 1.8 })
</script>
<template><NConfigProvider :theme-overrides="lostskyNaiveTheme" :locale="zhCN"><NDialogProvider><NMessageProvider><RouterView /></NMessageProvider></NDialogProvider></NConfigProvider></template>
