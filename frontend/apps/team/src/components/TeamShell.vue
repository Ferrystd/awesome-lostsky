<script setup lang="ts">
import { auth } from '@lostsky/api/client'
import { Bell, BookOpen, BriefcaseBusiness, ChevronRight, FileText, Files, House, LogOut, Menu, Settings, ShieldCheck, UserRound, Users, X } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute(); const drawer = ref(false)
const primary = [
  ['/', '概览', House], ['/members', '成员', Users], ['/docs', '文档', BookOpen], ['/files', '文件', Files], ['/me', '我的', UserRound],
] as const
const secondary = [
  ['/posts', '岗位类型', BriefcaseBusiness], ['/fields', '成员字段', FileText], ['/roles', '角色权限', ShieldCheck], ['/join-review', '加入审核', Users], ['/notice', '站内信', Bell], ['/settings', '团队设置', Settings],
] as const
const title = computed(() => String(route.meta.title ?? '工作台'))
function logout() { auth.clear(); location.href = '//account.lostsky.work/login' }
</script>
<template>
  <div class="team-shell">
    <a href="#workspace" class="skip">跳到主要内容</a>
    <aside :class="['sidebar', { open: drawer }]" aria-label="团队导航">
      <div class="sidebar-head"><a href="/" class="wordmark"><strong>LostSky</strong><span>失落青空</span></a><button type="button" aria-label="关闭导航" @click="drawer=false"><X /></button></div>
      <nav><p>工作空间</p><RouterLink v-for="item in primary.slice(0,4)" :key="item[0]" :to="item[0]" @click="drawer=false"><component :is="item[2]" :size="19" /><span>{{ item[1] }}</span><ChevronRight :size="15" /></RouterLink><p>管理</p><RouterLink v-for="item in secondary" :key="item[0]" :to="item[0]" @click="drawer=false"><component :is="item[2]" :size="19" /><span>{{ item[1] }}</span><ChevronRight :size="15" /></RouterLink></nav>
      <button class="logout" type="button" @click="logout"><LogOut :size="18" />退出登录</button>
    </aside>
    <div v-if="drawer" class="backdrop" aria-hidden="true" @click="drawer=false"></div>
    <section class="workspace">
      <header class="topbar"><button type="button" aria-label="打开导航" @click="drawer=true"><Menu /></button><div><p>TEAM WORKSPACE</p><h1>{{ title }}</h1></div><RouterLink to="/notice" aria-label="查看站内信"><Bell :size="20" /></RouterLink></header>
      <main id="workspace"><slot /></main>
      <nav class="bottom-nav" aria-label="移动端导航"><RouterLink v-for="item in primary" :key="item[0]" :to="item[0]"><component :is="item[2]" :size="20" /><span>{{ item[1] }}</span></RouterLink><button type="button" @click="drawer=true"><Menu :size="20" /><span>更多</span></button></nav>
    </section>
  </div>
</template>
<style scoped>
.team-shell{min-height:100dvh;background:var(--cloud)}.skip{position:fixed;left:1rem;top:-4rem;z-index:100;padding:.7rem 1rem;background:white}.skip:focus{top:1rem}.sidebar{position:fixed;z-index:var(--z-modal);inset:0 auto 0 0;width:min(86vw,320px);display:flex;flex-direction:column;padding:1rem;background:var(--sky-void);color:white;transform:translateX(-101%);transition:transform .22s cubic-bezier(.22,1,.36,1)}.sidebar.open{transform:translateX(0)}.sidebar-head{height:52px;display:flex;align-items:center;justify-content:space-between}.sidebar-head button{width:44px;height:44px;display:grid;place-items:center;color:white;background:transparent;border:0}.wordmark{display:flex;align-items:baseline;gap:.45rem}.wordmark strong{font-family:'Barlow Condensed';font-size:1.45rem}.wordmark span{color:oklch(.68 .015 210);font-size:.68rem}nav p{margin:1.35rem .65rem .45rem;color:var(--sky-lost);font-size:.7rem;font-weight:750;letter-spacing:.06em}.sidebar nav a{min-height:44px;display:grid;grid-template-columns:24px 1fr auto;align-items:center;gap:.55rem;padding:0 .65rem;color:oklch(.76 .012 210);border-radius:8px;font-size:.9rem}.sidebar nav a:hover,.sidebar nav a.router-link-active{color:white;background:color-mix(in oklch,var(--sky-lost),transparent 78%)}.sidebar nav a.router-link-active svg:last-child{color:var(--afterglow)}.logout{min-height:44px;display:flex;align-items:center;gap:.55rem;margin-top:auto;padding:0 .65rem;color:oklch(.72 .012 210);background:transparent;border:0}.backdrop{position:fixed;z-index:var(--z-backdrop);inset:0;background:oklch(.06 0 0/.66)}.workspace{min-height:100dvh;padding-bottom:72px}.topbar{height:68px;display:grid;grid-template-columns:44px 1fr 44px;align-items:center;gap:.5rem;padding:0 .75rem;background:white;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:var(--z-sticky)}.topbar>button,.topbar>a{width:44px;height:44px;display:grid;place-items:center;color:var(--muted-ink);background:transparent;border:0;border-radius:8px}.topbar div{min-width:0}.topbar p{margin:0;color:var(--sky-lost-strong);font-family:'Barlow Condensed';font-size:.68rem;font-weight:700;letter-spacing:.08em}.topbar h1{margin:0;font-size:1.05rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.workspace main{width:min(100%,90rem);margin:0 auto;padding:1rem}.bottom-nav{position:fixed;z-index:var(--z-sticky);inset:auto 0 0;min-height:64px;display:grid;grid-template-columns:repeat(6,1fr);padding-bottom:env(safe-area-inset-bottom);background:white;border-top:1px solid var(--line)}.bottom-nav a,.bottom-nav button{min-width:0;min-height:60px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.1rem;color:var(--muted-ink);background:transparent;border:0;font-size:.65rem}.bottom-nav a.router-link-active{color:var(--sky-lost-strong)}
@media(min-width:900px){.team-shell{display:grid;grid-template-columns:248px minmax(0,1fr)}.sidebar{position:sticky;top:0;width:248px;height:100dvh;transform:none}.sidebar-head button{display:none}.workspace{padding-bottom:0}.topbar{grid-template-columns:1fr 44px;height:72px;padding-inline:1.5rem}.topbar>button{display:none}.topbar div{grid-column:1}.workspace main{padding:1.75rem}.bottom-nav{display:none}}
</style>
