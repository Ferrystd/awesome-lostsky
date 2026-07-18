<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
defineProps<{ title: string; intro: string }>()
</script>
<template>
  <main class="auth-shell">
    <section class="auth-story" aria-label="LostSky 品牌介绍">
      <a href="//www.lostsky.work" class="back"><ArrowLeft :size="18" /> 返回官网</a>
      <div class="story-copy"><p>LOSTSKY / ACCESS</p><h1 class="ls-display">青空消退后，<br>系统仍然清醒。</h1><span>一个通行证，进入你的全部工作空间。</span></div>
    </section>
    <section class="auth-content">
      <div class="auth-brand"><strong>LostSky</strong><span>失落青空</span></div>
      <div class="auth-form"><h2>{{ title }}</h2><p>{{ intro }}</p><slot /></div>
    </section>
  </main>
</template>
<style scoped>
.auth-shell { min-height: 100dvh; background: white; }
.auth-story { display: none; }
.auth-content { min-height: 100dvh; display: flex; flex-direction: column; padding: 1.25rem; }
.auth-brand { display: flex; align-items: baseline; gap: .5rem; color: var(--ink); }
.auth-brand strong { font-family: 'Barlow Condensed'; font-size: 1.5rem; }
.auth-brand span { color: var(--muted-ink); font-size: .75rem; }
.auth-form { width: 100%; max-width: 27rem; margin: auto; padding: 3rem 0; }
.auth-form h2 { margin: 0; font-size: 1.85rem; letter-spacing: -.025em; }
.auth-form > p { margin: .5rem 0 2rem; color: var(--muted-ink); }
@media (min-width: 900px) {
  .auth-shell { display: grid; grid-template-columns: minmax(380px, .9fr) minmax(480px, 1.1fr); }
  .auth-story { min-height: 100dvh; display: flex; flex-direction: column; justify-content: space-between; padding: 2.5rem clamp(2rem, 5vw, 5rem); color: white; background: var(--sky-void); position: relative; overflow: hidden; }
  .auth-story::after { content: ''; position: absolute; width: 28rem; height: 28rem; right: -12rem; bottom: -12rem; border: 1px solid color-mix(in oklch, var(--sky-lost), transparent 28%); border-radius: 50%; box-shadow: inset 0 0 0 5rem color-mix(in oklch, var(--sky-lost), transparent 92%); }
  .back { min-height: 44px; display: inline-flex; align-items: center; gap: .5rem; width: fit-content; color: oklch(.77 .014 210); }
  .story-copy { position: relative; z-index: 1; margin-bottom: 10vh; }
  .story-copy p { color: var(--sky-lost); font-size: .78rem; font-weight: 720; letter-spacing: .08em; }
  .story-copy h1 { max-width: 9ch; margin: 1.25rem 0; font-size: clamp(3.6rem, 6vw, 6rem); }
  .story-copy span { color: oklch(.72 .014 210); }
  .auth-content { padding: 2.5rem clamp(2rem, 6vw, 6rem); }
}
</style>
