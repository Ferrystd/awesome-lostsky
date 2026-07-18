<script setup lang="ts">
import { ArrowRight, Check, Menu, Play, setLucideProps, X } from '@lucide/vue'
import { ref } from 'vue'

setLucideProps({})
const menuOpen = ref(false)
const hasHeroVideo = import.meta.env.VITE_HAS_HERO_VIDEO === '1'
const capabilities = [
  ['团队与权限', '成员、岗位和角色在同一条清晰的权限链上协作。'],
  ['资料与文件', '让文档、文件和成员资料留在工作发生的地方。'],
  ['持续扩展', '统一的团队上下文承接交易、商店与更多业务应用。'],
]
</script>

<template>
  <div class="site-shell">
    <a class="skip" href="#main">跳到主要内容</a>
    <header class="site-header">
      <a class="brand" href="/" aria-label="LostSky 首页"><span>LostSky</span><small>失落青空</small></a>
      <button class="menu-button" type="button" :aria-expanded="menuOpen" aria-controls="site-nav" aria-label="切换导航" @click="menuOpen = !menuOpen">
        <X v-if="menuOpen" /><Menu v-else />
      </button>
      <nav id="site-nav" :class="['site-nav', { open: menuOpen }]" aria-label="主导航">
        <a href="#system" @click="menuOpen = false">系统</a>
        <a href="#approach" @click="menuOpen = false">方法</a>
        <a href="//account.lostsky.work/login" class="nav-cta">进入工作台 <ArrowRight :size="17" /></a>
      </nav>
    </header>

    <main id="main">
      <section class="hero">
        <div class="hero-copy">
          <p class="hero-note">工作室运营系统 · LOSTSKY</p>
          <h1 class="ls-display">当喧闹退去，<br><span>工作重新清晰。</span></h1>
          <p class="hero-lead">失落青空把团队、成员、资料和业务入口收进同一个运营底座。少一点来回确认，多一点确定地向前。</p>
          <div class="hero-actions">
            <a class="primary-link" href="//account.lostsky.work/register">创建工作空间 <ArrowRight :size="19" /></a>
            <a class="text-link" href="#system"><Play :size="17" fill="currentColor" /> 看系统如何工作</a>
          </div>
        </div>
        <figure class="hero-media">
          <video v-if="hasHeroVideo" autoplay muted loop playsinline preload="metadata" crossorigin="anonymous" poster="//assets.lostsky.work/media/site/lostsky-loop-poster.webp" aria-label="失落青空青色天光进入夜空的品牌动态场景">
            <source src="//assets.lostsky.work/media/site/lostsky-loop.webm" type="video/webm">
            <source src="//assets.lostsky.work/media/site/lostsky-loop.mp4" type="video/mp4">
          </video>
          <img v-else crossorigin="anonymous" src="//assets.lostsky.work/images/hero-3d.png" width="1200" height="900" alt="失落青空工作室的立体青色品牌场景">
          <figcaption><span>LIVE SYSTEM</span><span>TEAM / DATA / FLOW</span></figcaption>
        </figure>
      </section>

      <section id="system" class="system-section">
        <div class="section-intro">
          <h2 class="ls-display">不是更多工具，<br>是更少的断点。</h2>
          <p>每个模块都基于同一个团队身份和权限上下文。你不用在不同系统之间重新解释谁可以做什么。</p>
        </div>
        <div class="capability-list">
          <article v-for="(item, index) in capabilities" :key="item[0]">
            <span class="capability-index">0{{ index + 1 }}</span>
            <div><h3>{{ item[0] }}</h3><p>{{ item[1] }}</p></div>
            <Check aria-hidden="true" />
          </article>
        </div>
      </section>

      <section id="approach" class="product-proof">
        <div class="proof-frame">
          <img crossorigin="anonymous" src="//assets.lostsky.work/images/data-dashboard.png" width="1200" height="760" loading="lazy" alt="LostSky 团队数据工作台界面预览">
        </div>
        <div class="proof-copy">
          <p>从手机开始设计</p>
          <h2 class="ls-display">在任何屏幕上，<br>都知道下一步。</h2>
          <p class="ls-prose">移动端优先的信息结构，让常用动作触手可及；回到桌面后，侧栏、表格与多列信息自然展开，而不是简单放大。</p>
          <a href="//account.lostsky.work/login">打开工作台 <ArrowRight :size="18" /></a>
        </div>
      </section>

      <section class="closing">
        <p>LOSTSKY / 失落青空</p>
        <h2 class="ls-display">把复杂留给系统。<br>把判断留给人。</h2>
        <a href="//account.lostsky.work/register">开始使用 <ArrowRight /></a>
      </section>
    </main>
    <footer><span>© {{ new Date().getFullYear() }} LostSky</span><span>让工作在青空消退后依然清晰</span></footer>
  </div>
</template>

<style scoped>
.site-shell { min-height: 100dvh; color: oklch(.94 .008 205); background: var(--sky-void); overflow: hidden; }
.skip { position: fixed; left: 1rem; top: -4rem; z-index: 100; padding: .7rem 1rem; background: white; color: var(--ink); }
.skip:focus { top: 1rem; }
.site-header { min-height: 72px; display: flex; align-items: center; justify-content: space-between; padding: 0 1rem; border-bottom: 1px solid color-mix(in oklch, white, transparent 88%); position: relative; z-index: 20; }
.brand { display: flex; align-items: baseline; gap: .55rem; font-family: 'Barlow Condensed', sans-serif; font-size: 1.45rem; font-weight: 700; letter-spacing: .02em; }
.brand small { color: color-mix(in oklch, white, transparent 38%); font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; font-size: .72rem; font-weight: 500; }
.menu-button { width: 46px; height: 46px; display: grid; place-items: center; color: white; background: transparent; border: 1px solid color-mix(in oklch, white, transparent 82%); border-radius: 8px; }
.site-nav { display: none; position: absolute; inset: 72px 0 auto; padding: 1rem; background: var(--sky-night); border-bottom: 1px solid color-mix(in oklch, white, transparent 85%); }
.site-nav.open { display: grid; }
.site-nav a { min-height: 48px; display: flex; align-items: center; padding: 0 .75rem; color: oklch(.88 .01 205); }
.site-nav .nav-cta { justify-content: space-between; margin-top: .5rem; color: var(--sky-void); background: var(--afterglow); font-weight: 720; border-radius: 8px; }
.hero { min-height: calc(100svh - 72px); display: grid; align-items: center; gap: 2.5rem; padding: clamp(3rem, 10vw, 7rem) 1rem 2rem; }
.hero-note { margin: 0 0 1.5rem; color: var(--sky-lost); font-size: .78rem; font-weight: 720; letter-spacing: .08em; }
.hero h1 { max-width: 11ch; margin: 0; font-size: clamp(3.25rem, 16vw, 5.5rem); }
.hero h1 span { color: color-mix(in oklch, var(--sky-lost), white 12%); }
.hero-lead { max-width: 39rem; margin: 1.5rem 0 0; color: oklch(.76 .016 210); font-size: clamp(1rem, 3.2vw, 1.2rem); line-height: 1.75; }
.hero-actions { display: flex; flex-direction: column; align-items: stretch; gap: .75rem; margin-top: 2rem; }
.primary-link, .text-link { min-height: 50px; display: inline-flex; align-items: center; justify-content: center; gap: .65rem; font-weight: 680; border-radius: 8px; }
.primary-link { color: var(--sky-void); background: var(--afterglow); }
.text-link { color: white; border: 1px solid color-mix(in oklch, white, transparent 78%); }
.hero-media { margin: 0; position: relative; border: 1px solid color-mix(in oklch, var(--sky-lost), transparent 52%); overflow: hidden; border-radius: 12px; background: var(--sky-night); }
.hero-media img, .hero-media video { width: 100%; aspect-ratio: 4/3; object-fit: cover; filter: saturate(.72) hue-rotate(-8deg) contrast(1.05); }
.hero-media::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, color-mix(in oklch, var(--sky-void), transparent 10%), transparent 55%); pointer-events: none; }
.hero-media figcaption { position: absolute; z-index: 2; inset: auto .8rem .7rem; display: flex; justify-content: space-between; color: white; font-family: 'Barlow Condensed', sans-serif; font-size: .72rem; letter-spacing: .06em; }
.system-section { padding: 5rem 1rem; color: var(--ink); background: white; }
.section-intro h2, .proof-copy h2, .closing h2 { margin: 0; font-size: clamp(2.75rem, 11vw, 5.2rem); }
.section-intro > p { max-width: 36rem; margin: 1.5rem 0 0; color: var(--muted-ink); }
.capability-list { margin-top: 3.5rem; border-top: 1px solid var(--line); }
.capability-list article { display: grid; grid-template-columns: 2.5rem 1fr auto; gap: .75rem; padding: 1.4rem 0; border-bottom: 1px solid var(--line); }
.capability-index { color: var(--sky-lost-strong); font-family: 'Barlow Condensed', sans-serif; font-weight: 700; }
.capability-list h3 { margin: 0; font-size: 1.1rem; }
.capability-list p { margin: .35rem 0 0; color: var(--muted-ink); font-size: .9rem; }
.capability-list svg { margin-top: .2rem; color: var(--sky-lost-strong); }
.product-proof { padding: 5rem 1rem; background: var(--cloud); }
.proof-frame { overflow: hidden; border: 1px solid var(--line); border-radius: 12px; background: white; }
.proof-frame img { width: 100%; aspect-ratio: 4/3; object-fit: cover; object-position: left top; }
.proof-copy { margin-top: 2.5rem; }
.proof-copy > p:first-child { color: var(--sky-lost-strong); font-weight: 720; }
.proof-copy .ls-prose { color: var(--muted-ink); }
.proof-copy a { min-height: 46px; display: inline-flex; align-items: center; gap: .5rem; margin-top: 1rem; color: var(--sky-lost-strong); font-weight: 720; }
.closing { padding: 5.5rem 1rem; background: var(--sky-lost-strong); }
.closing > p { font-family: 'Barlow Condensed'; letter-spacing: .08em; }
.closing a { min-height: 50px; display: inline-flex; align-items: center; gap: .75rem; margin-top: 2rem; padding: 0 1.25rem; color: var(--sky-void); background: white; border-radius: 8px; font-weight: 720; }
footer { display: flex; flex-direction: column; gap: .4rem; padding: 2rem 1rem; color: oklch(.63 .015 210); font-size: .8rem; }
@media (min-width: 768px) {
  .site-header { padding-inline: clamp(1.5rem, 4vw, 4rem); }
  .menu-button { display: none; }
  .site-nav { display: flex; position: static; align-items: center; gap: .5rem; padding: 0; background: transparent; border: 0; }
  .site-nav a { padding: 0 1rem; }
  .site-nav .nav-cta { margin: 0 0 0 .5rem; padding-inline: 1.15rem; gap: .6rem; }
  .hero { grid-template-columns: minmax(0, .92fr) minmax(340px, .75fr); padding-inline: clamp(2rem, 6vw, 7rem); }
  .hero-actions { flex-direction: row; }
  .primary-link, .text-link { padding-inline: 1.2rem; }
  .system-section, .product-proof, .closing { padding-inline: clamp(2rem, 7vw, 8rem); }
  .system-section { display: grid; grid-template-columns: minmax(280px, .8fr) minmax(360px, 1fr); gap: 7vw; }
  .capability-list { margin-top: 0; }
  .product-proof { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(300px, .7fr); align-items: center; gap: 6vw; }
  .proof-copy { margin: 0; }
  footer { flex-direction: row; justify-content: space-between; padding-inline: clamp(2rem, 6vw, 7rem); }
}
</style>
