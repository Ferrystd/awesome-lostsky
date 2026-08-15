<script setup lang="ts">
import { ref } from 'vue'

const menuOpen = ref(false)

const members = [
  {
    name: 'Alex Chen',
    role: '创始人 / 首席运营官',
    description: '前一线大厂泛娱乐业务负责人，深谙陪玩行业底层逻辑。擅长从0到1搭建运营体系，曾操盘多个月流水破百万的顶尖陪玩公会。致力于用标准化流程解决行业痛点。',
    tags: ['流量矩阵', '商业化变现'],
    initials: 'AC',
    primary: true,
  },
  {
    name: 'Sarah Lin',
    role: '技术总监 / 架构师',
    description: '全栈开发专家，主导研发了失落青空核心派单算法与数据分析中台。通过技术手段大幅提升派单效率与匹配精准度，让运营决策真正建立在数据之上。',
    tags: ['算法匹配', '数据中台'],
    initials: 'SL',
    primary: false,
  },
]

const services = [
  ['流水破局方案', '解决：单量不稳定、客单价低', '通过精细化用户分层与定制化营销活动，快速拉升店铺整体流水。适合遇到增长瓶颈的中腰部陪玩店。', 'primary'],
  ['陪玩孵化体系', '解决：人员流失率高、服务质量差', '提供从招募、培训到包装的全套 SOP，打造高素质陪玩团队。适合初创团队或急需提升服务口碑的公会。', 'secondary'],
  ['数据中台部署', '解决：管理混乱、决策拍脑袋', '私有化部署智能派单与财务分析系统，实现数字化管理。适合规模化运作、追求极致效率的大型工作室。', 'blue'],
]

const stats = [['300+', '服务店铺 / 公会'], ['5000w+', '累计助力流水'], ['98%', '顾客续约率'], ['24/7', '全天候技术支持']]
const advantages = [
  ['拒绝模板化运营', '深入调研您的业务现状，量身定制增长策略，不卖通用废话。'],
  ['自研核心科技', '独家派单算法与风控模型，用技术降本增效，领先同行一个时代。'],
  ['结果导向交付', '所有服务均有明确的数据指标考核，为最终的流水增长负责。'],
]
</script>

<template>
  <div class="legacy-site">
    <a class="skip-link" href="#main">跳到主要内容</a>
    <div class="fixed-background" aria-hidden="true"></div>
    <div class="background-shade" aria-hidden="true"></div>

    <nav class="navbar" aria-label="主导航">
      <div class="container nav-container">
        <a href="#home" class="wordmark" aria-label="失落青空首页">失落<span>青空</span></a>
        <button class="menu-button" type="button" :aria-expanded="menuOpen" aria-controls="site-navigation" aria-label="切换网站导航" @click="menuOpen = !menuOpen">
          <svg v-if="menuOpen" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <div id="site-navigation" :class="['nav-links', { open: menuOpen }]">
          <a href="#home" @click="menuOpen = false">首页</a>
          <a href="#team" @click="menuOpen = false">核心成员</a>
          <a href="#services" @click="menuOpen = false">精选业务</a>
          <a href="#advantages" @click="menuOpen = false">团队优势</a>
        </div>
        <a href="#contact" class="contact-link">联系我们</a>
      </div>
    </nav>

    <main id="main">
      <section id="home" class="hero-section" aria-labelledby="hero-title">
        <div class="hero-glow" aria-hidden="true"></div>
        <div class="container hero-layout">
          <div class="hero-content">
            <p class="hero-signature">失落青空 · 陪玩运营工作室</p>
            <h1 id="hero-title">重塑陪玩生态<br><span>让增长持续发生</span></h1>
            <p class="hero-lead">专注陪玩团与陪玩店精细化运营。我们把增长策略、成员孵化和数据系统串成一条完整路径，让每一次投入都有迹可循。</p>
            <div class="hero-actions">
              <a href="#services" class="hero-cta">探索解决方案 <span aria-hidden="true">→</span></a>
              <a href="//account.lostsky.work/login" class="hero-secondary">进入工作台</a>
            </div>
          </div>
          <aside class="hero-proof" aria-label="失落青空服务方法">
            <p>增长不是一句口号</p>
            <ul>
              <li><span>策略</span><b>找到真实的流水阻力</b></li>
              <li><span>孵化</span><b>把服务质量沉淀成标准</b></li>
              <li><span>系统</span><b>让运营决策建立在数据上</b></li>
            </ul>
          </aside>
        </div>
        <a class="scroll-indicator" href="#team" aria-label="浏览核心成员"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m19 14-7 7-7-7m7 7V3" /></svg></a>
      </section>

      <section id="team" class="team-section" aria-labelledby="team-title">
        <div class="container">
          <header class="section-title"><h2 id="team-title">核心<span>成员</span></h2><i aria-hidden="true"></i></header>
          <div class="member-list">
            <article v-for="(member, index) in members" :key="member.name" :class="['member', { reverse: index === 1 }]">
              <div class="member-copy">
                <p :class="['role', member.primary ? 'primary' : 'secondary']">{{ member.role }}</p>
                <h3>{{ member.name }}</h3>
                <p class="member-description">{{ member.description }}</p>
                <div class="tag-list"><span v-for="tag in member.tags" :key="tag">{{ tag }}</span></div>
              </div>
              <div class="member-media" aria-hidden="true"><div :class="['avatar-frame', member.primary ? 'primary' : 'secondary']"><span>{{ member.initials }}</span><i></i></div></div>
            </article>
          </div>
        </div>
      </section>

      <section id="services" class="services-section" aria-labelledby="services-title">
        <div class="container">
          <header class="section-title"><h2 id="services-title">精选<span>业务</span></h2><p>直击痛点，为您提供全链路的陪玩商业化解决方案</p></header>
          <div class="service-list">
            <a v-for="([title, problem, description, tone], index) in services" :key="title" href="#contact" class="service-card">
              <span :class="['service-icon', tone]"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path v-if="index === 0" d="M13 7h8m0 0v8m0-8-8 8-4-4-6 6"/><path v-else-if="index === 1" d="M12 4.354a4 4 0 1 0 0 5.292M15 21H3v-1a6 6 0 0 1 12 0v1m0 0h6v-1a6 6 0 0 0-9-5.197M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"/><path v-else d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6m6 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2Z"/></svg></span>
              <div class="service-heading"><h3>{{ title }}</h3><strong :class="tone">{{ problem }}</strong></div>
              <p>{{ description }}</p>
              <span :class="['service-more', tone]">预约方案沟通 <b aria-hidden="true">→</b></span>
            </a>
          </div>
        </div>
      </section>

      <section id="advantages" class="advantages-section" aria-labelledby="advantages-title">
        <div class="container">
          <header class="section-title"><h2 id="advantages-title">团队<span>优势</span></h2><i aria-hidden="true"></i></header>
          <div class="stat-list"><article v-for="([value, label]) in stats" :key="label"><strong>{{ value }}</strong><span>{{ label }}</span></article></div>
          <article class="advantage-panel">
            <div class="panel-glow top" aria-hidden="true"></div><div class="panel-glow bottom" aria-hidden="true"></div>
            <div class="advantage-copy"><h3>为什么选择失落青空？</h3><ul><li v-for="([title, description]) in advantages" :key="title"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg><span><b>{{ title }}</b><small>{{ description }}</small></span></li></ul></div>
            <figure class="chart-card" aria-label="合作后平均流水呈持续增长趋势"><div class="chart" aria-hidden="true"><i class="q1"></i><i class="q2"></i><i class="q3"></i><i class="q4"></i><i class="now"></i></div><figcaption>合作后平均流水增长趋势</figcaption></figure>
          </article>
        </div>
      </section>

      <section id="contact" class="contact-section" aria-labelledby="contact-title">
        <div class="contact-background" aria-hidden="true"></div>
        <div class="contact-body"><div class="contact-panel"><h2 id="contact-title">让下一阶段的增长<br><span>从一次诊断开始</span></h2><p>告诉我们当前的团队规模和运营难题，获取免费的店铺诊断建议。</p><div class="contact-actions"><a href="mailto:contact@lostsky.com?subject=预约店铺诊断"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"/></svg>预约免费诊断</a><a href="mailto:contact@lostsky.com"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m3 8 7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z"/></svg>发送邮件咨询</a></div></div></div>
        <footer><div class="container footer-content"><span>© 2026 失落青空工作室 (LostSky Studio).</span><nav aria-label="页脚导航"><a href="//account.lostsky.work/login">进入工作台</a><a href="#home">返回顶部</a><a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">备案信息</a></nav></div></footer>
      </section>
    </main>
  </div>
</template>

<style scoped>
:global(html) { min-width: 320px; scroll-behavior: smooth; background: #020617; color-scheme: dark; }
:global(body) { min-width: 320px; margin: 0; background: #020617; }
:global(button) { font: inherit; }
.legacy-site {
  --primary: #38bdf8;
  --primary-strong: #0ea5e9;
  --secondary: #a78bfa;
  --background: #020617;
  --surface: #0f172a;
  --text: #f8fafc;
  --muted: #b6c2d2;
  --line: rgb(255 255 255 / .13);
  --z-nav: 40;
  min-height: 100dvh;
  overflow-x: hidden;
  color: var(--text);
  background: var(--background);
  font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  line-height: 1.6;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}
.legacy-site *, .legacy-site *::before, .legacy-site *::after { box-sizing: border-box; }
.legacy-site a { color: inherit; text-decoration: none; }
.legacy-site button, .legacy-site a { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
.legacy-site :focus-visible { outline: 3px solid #fbbf24; outline-offset: 4px; }
.container { width: min(100% - 2rem, 80rem); margin-inline: auto; }
.skip-link { position: fixed; z-index: 60; top: -5rem; left: 1rem; padding: .75rem 1rem; color: #020617; border-radius: .5rem; background: white; font-weight: 700; }
.skip-link:focus { top: 1rem; }
.fixed-background, .background-shade { position: fixed; z-index: 0; inset: 0; pointer-events: none; }
.fixed-background { opacity: .45; background: url('//assets.lostsky.work/images/site-bg.png') center / cover no-repeat; mix-blend-mode: screen; }
.background-shade { background: linear-gradient(to bottom, rgb(2 6 23 / .18), rgb(2 6 23 / .82) 56%, #020617); }
.navbar, main { position: relative; z-index: 1; }

.navbar { position: fixed; z-index: var(--z-nav); top: 0; width: 100%; border-bottom: 1px solid var(--line); background: rgb(8 15 34 / .78); backdrop-filter: blur(18px); }
.nav-container { display: grid; grid-template-columns: 1fr auto 1fr; min-height: 4.75rem; align-items: center; gap: 1rem; }
.wordmark { justify-self: start; font-family: 'Barlow Condensed', 'PingFang SC', sans-serif; font-size: 1.65rem; font-weight: 700; letter-spacing: .04em; }
.wordmark span, .section-title span { color: var(--primary); }
.nav-links { display: flex; align-items: center; gap: .35rem; }
.nav-links a { display: grid; min-height: 44px; place-items: center; padding-inline: .85rem; color: #d7e0ec; border-radius: .5rem; font-size: .875rem; font-weight: 600; transition: color .2s, background-color .2s; }
.nav-links a:hover { color: white; background: rgb(255 255 255 / .07); }
.contact-link { display: grid; min-height: 44px; justify-self: end; place-items: center; padding-inline: 1.35rem; color: #e8f7ff; border: 1px solid rgb(56 189 248 / .55); border-radius: 999px; background: rgb(14 165 233 / .18); font-size: .875rem; font-weight: 700; transition: background-color .2s, border-color .2s; }
.contact-link:hover { border-color: var(--primary); background: rgb(14 165 233 / .3); }
.menu-button { display: none; width: 44px; height: 44px; place-items: center; padding: 0; color: white; border: 0; border-radius: .5rem; background: transparent; cursor: pointer; }
.menu-button svg { width: 24px; stroke: currentColor; stroke-linecap: round; stroke-width: 2; }

.hero-section { position: relative; display: flex; min-height: 100svh; align-items: center; padding: clamp(8rem, 14vw, 11rem) 0 clamp(6rem, 10vw, 8rem); overflow: hidden; }
.hero-glow { position: absolute; width: min(70vw, 58rem); aspect-ratio: 1; top: 8%; left: -22%; border-radius: 50%; background: radial-gradient(circle, rgb(14 165 233 / .24), transparent 68%); filter: blur(18px); animation: atmosphere 12s ease-in-out infinite alternate; }
.hero-layout { position: relative; display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(17rem, .55fr); align-items: end; gap: clamp(3rem, 8vw, 8rem); }
.hero-content { max-width: 54rem; }
.hero-signature { margin: 0 0 1.4rem; color: #c5d4e6; font-size: .9rem; font-weight: 700; letter-spacing: .08em; }
.hero-content h1 { max-width: 54rem; margin: 0; font-family: 'Barlow Condensed', 'PingFang SC', sans-serif; font-size: clamp(3.75rem, 8.2vw, 5.5rem); font-weight: 700; letter-spacing: -.03em; line-height: .98; text-wrap: balance; }
.hero-content h1 span { color: #68d6ff; }
.hero-lead { max-width: 42rem; margin: 1.75rem 0 0; color: #c2ccda; font-size: clamp(1.05rem, 2vw, 1.25rem); line-height: 1.75; text-wrap: pretty; }
.hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .85rem 1.5rem; margin-top: 2.25rem; }
.hero-cta, .hero-secondary { display: inline-flex; min-height: 48px; align-items: center; justify-content: center; font-weight: 700; }
.hero-cta { gap: .75rem; padding-inline: 1.5rem; border-radius: 999px; background: linear-gradient(115deg, #0284c7, #7c3aed); transition: filter .2s, transform .2s; }
.hero-cta span { transition: transform .2s; }
.hero-cta:hover { filter: brightness(1.15); transform: translateY(-2px); }
.hero-cta:hover span { transform: translateX(.2rem); }
.hero-secondary { padding-inline: .5rem; color: #dce7f4; text-decoration: underline; text-decoration-color: rgb(56 189 248 / .45); text-underline-offset: .35rem; }
.hero-secondary:hover { color: white; text-decoration-color: var(--primary); }
.hero-proof { padding: 1.5rem; border: 1px solid var(--line); border-radius: 1rem; background: rgb(8 15 34 / .62); backdrop-filter: blur(14px); }
.hero-proof > p { margin: 0 0 1rem; color: #e9f1fa; font-weight: 700; }
.hero-proof ul { display: grid; gap: 0; padding: 0; margin: 0; list-style: none; }
.hero-proof li { display: grid; grid-template-columns: 3.4rem 1fr; gap: .75rem; padding: .85rem 0; border-top: 1px solid var(--line); }
.hero-proof li span { color: var(--primary); font-size: .8rem; font-weight: 700; }
.hero-proof li b { color: #d3deeb; font-size: .9rem; font-weight: 600; }
.scroll-indicator { position: absolute; bottom: 1.5rem; left: 50%; display: grid; width: 44px; height: 44px; place-items: center; color: #d5dfeb; transform: translateX(-50%); }
.scroll-indicator svg, .service-icon svg, .advantage-copy svg, .contact-actions svg { stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; }
.scroll-indicator svg { width: 23px; animation: scroll-cue 1.8s ease-in-out 3; }

.team-section, .services-section, .advantages-section { position: relative; padding: clamp(5rem, 10vw, 8rem) 0; scroll-margin-top: 4.75rem; }
.section-title { margin-bottom: clamp(3rem, 7vw, 5rem); text-align: center; }
.section-title h2 { margin: 0 0 1rem; font-family: 'Barlow Condensed', 'PingFang SC', sans-serif; font-size: clamp(2.5rem, 5vw, 4rem); letter-spacing: -.02em; line-height: 1; text-wrap: balance; }
.section-title i { display: block; width: 6rem; height: .25rem; margin: auto; border-radius: 999px; background: linear-gradient(to right, var(--primary-strong), var(--secondary)); }
.section-title p { max-width: 44rem; margin: 0 auto; color: var(--muted); font-size: 1.05rem; text-wrap: pretty; }

.member-list { display: grid; gap: clamp(5rem, 11vw, 9rem); }
.member { display: flex; align-items: center; gap: clamp(3rem, 9vw, 8rem); }
.member.reverse { flex-direction: row-reverse; }
.member-copy, .member-media { width: 50%; }
.role { display: inline-flex; min-height: 32px; align-items: center; padding: .25rem .9rem; margin: 0; border: 1px solid; border-radius: 999px; font-size: .85rem; font-weight: 700; }
.role.primary { color: #7ddcff; border-color: rgb(56 189 248 / .35); background: rgb(14 165 233 / .12); }
.role.secondary { color: #c4b5fd; border-color: rgb(167 139 250 / .35); background: rgb(139 92 246 / .12); }
.member h3 { margin: 1rem 0; font-family: 'Barlow Condensed', 'PingFang SC', sans-serif; font-size: clamp(2.5rem, 5vw, 4rem); letter-spacing: -.02em; line-height: 1; }
.member-description { max-width: 62ch; margin: 0; color: var(--muted); line-height: 1.8; text-wrap: pretty; }
.tag-list { display: flex; flex-wrap: wrap; gap: .65rem; padding-top: 1.5rem; }
.tag-list span { padding: .45rem .8rem; color: #d9e3ef; border-radius: .5rem; background: rgb(255 255 255 / .07); font-size: .85rem; }
.member-media { display: flex; justify-content: flex-end; }
.reverse .member-media { justify-content: flex-start; }
.avatar-frame { position: relative; display: grid; width: min(100%, 21rem); aspect-ratio: 1; place-items: center; overflow: hidden; border: 1px solid var(--line); border-radius: 1rem; background: #0b1830; isolation: isolate; }
.avatar-frame::before { position: absolute; z-index: -1; width: 78%; aspect-ratio: 1; border-radius: 50%; content: ''; filter: blur(4px); }
.avatar-frame.primary::before { background: radial-gradient(circle at 34% 32%, #67e8f9, #0369a1 48%, transparent 70%); }
.avatar-frame.secondary::before { background: radial-gradient(circle at 66% 34%, #c4b5fd, #6d28d9 48%, transparent 70%); }
.avatar-frame span { color: rgb(255 255 255 / .9); font-family: 'Barlow Condensed', sans-serif; font-size: clamp(5rem, 11vw, 8rem); font-weight: 700; letter-spacing: -.04em; }
.avatar-frame i { position: absolute; right: 8%; bottom: 8%; width: 22%; aspect-ratio: 1; border: 1px solid rgb(255 255 255 / .24); border-radius: 50%; background: rgb(2 6 23 / .45); backdrop-filter: blur(8px); }

.services-section { background: rgb(15 23 42 / .64); }
.service-list { border-top: 1px solid var(--line); }
.service-card { display: grid; grid-template-columns: 3.5rem minmax(12rem, .72fr) minmax(18rem, 1.28fr) auto; align-items: center; gap: 1.5rem; min-height: 9.5rem; padding: 1.5rem .5rem; border-bottom: 1px solid var(--line); transition: background-color .22s; }
.service-card:hover { background: rgb(255 255 255 / .045); }
.service-icon { display: grid; width: 3.5rem; height: 3.5rem; place-items: center; border-radius: .75rem; }
.service-icon svg { width: 2rem; }
.service-icon.primary { color: var(--primary); background: rgb(14 165 233 / .16); }
.service-icon.secondary { color: var(--secondary); background: rgb(139 92 246 / .16); }
.service-icon.blue { color: #93c5fd; background: rgb(59 130 246 / .16); }
.service-heading h3 { margin: 0 0 .35rem; font-size: 1.25rem; }
.service-heading strong { font-size: .85rem; }
.primary { color: var(--primary); }
.secondary { color: var(--secondary); }
.blue { color: #93c5fd; }
.service-card > p { max-width: 62ch; margin: 0; color: var(--muted); font-size: .92rem; line-height: 1.7; text-wrap: pretty; }
.service-more { display: flex; min-height: 44px; align-items: center; gap: .4rem; white-space: nowrap; font-size: .9rem; font-weight: 700; }
.service-more b { font-size: 1.1rem; transition: transform .2s; }
.service-card:hover .service-more b { transform: translateX(.25rem); }

.stat-list { display: grid; grid-template-columns: repeat(4, 1fr); margin-bottom: clamp(3rem, 7vw, 5rem); border-block: 1px solid var(--line); }
.stat-list article { display: grid; gap: .2rem; padding: 1.5rem; text-align: center; }
.stat-list article + article { border-left: 1px solid var(--line); }
.stat-list strong { color: #7ddcff; font-family: 'Barlow Condensed', sans-serif; font-size: clamp(2.6rem, 5vw, 4rem); font-variant-numeric: tabular-nums; line-height: 1; }
.stat-list span { color: var(--muted); font-size: .875rem; }
.advantage-panel { position: relative; display: grid; grid-template-columns: 1fr 1fr; gap: clamp(2.5rem, 6vw, 5rem); padding: clamp(2rem, 5vw, 4rem); overflow: hidden; border: 1px solid var(--line); border-radius: 1rem; background: rgb(15 23 42 / .72); backdrop-filter: blur(16px); }
.panel-glow { position: absolute; width: 16rem; height: 16rem; border-radius: 50%; filter: blur(70px); }
.panel-glow.top { top: -8rem; right: -4rem; background: rgb(14 165 233 / .2); }
.panel-glow.bottom { bottom: -10rem; left: -4rem; background: rgb(139 92 246 / .18); }
.advantage-copy, .chart-card { position: relative; z-index: 1; }
.advantage-copy h3 { margin: 0 0 1.75rem; font-size: clamp(1.6rem, 3vw, 2.25rem); }
.advantage-copy ul { display: grid; gap: 1.25rem; padding: 0; margin: 0; list-style: none; }
.advantage-copy li { display: flex; gap: .85rem; align-items: flex-start; }
.advantage-copy svg { flex: 0 0 auto; width: 1.5rem; margin-top: .1rem; color: var(--primary); }
.advantage-copy b, .advantage-copy small { display: block; }
.advantage-copy b { color: white; font-size: .98rem; }
.advantage-copy small { max-width: 52ch; margin-top: .25rem; color: var(--muted); font-size: .875rem; line-height: 1.65; }
.chart-card { padding: 1.5rem; margin: 0; border-radius: .75rem; background: rgb(255 255 255 / .055); }
.chart { display: flex; height: 13rem; gap: .6rem; align-items: end; justify-content: space-between; padding-bottom: 1rem; border-bottom: 1px solid var(--line); }
.chart i { width: 16.66%; border-radius: .375rem .375rem 0 0; background: rgb(100 116 139 / .55); }
.chart .q1 { height: 25%; }
.chart .q2 { height: 50%; }
.chart .q3 { height: 68%; background: rgb(14 165 233 / .46); }
.chart .q4 { height: 82%; background: rgb(14 165 233 / .7); }
.chart .now { height: 100%; background: linear-gradient(to top, var(--primary-strong), var(--secondary)); }
.chart-card figcaption { margin-top: 1rem; color: var(--muted); text-align: center; font-size: .875rem; }

.contact-section { position: relative; display: flex; min-height: 100svh; flex-direction: column; justify-content: space-between; padding-top: 5rem; overflow: hidden; scroll-margin-top: 4.75rem; background: #020617; }
.contact-background { position: absolute; inset: 0; opacity: .18; background: url('//assets.lostsky.work/images/site-bg.png') center / cover; mix-blend-mode: luminosity; }
.contact-body { position: relative; z-index: 1; display: flex; flex: 1; align-items: center; padding: 4rem 1rem; }
.contact-panel { width: min(100%, 60rem); padding: clamp(2.25rem, 7vw, 5rem); margin: auto; text-align: center; border: 1px solid var(--line); border-radius: 1rem; background: rgb(8 15 34 / .72); backdrop-filter: blur(18px); }
.contact-panel h2 { margin: 0 0 1.5rem; font-family: 'Barlow Condensed', 'PingFang SC', sans-serif; font-size: clamp(2.35rem, 7vw, 5rem); letter-spacing: -.025em; line-height: 1; text-wrap: balance; }
.contact-panel h2 span { color: var(--primary); }
.contact-panel p { max-width: 42rem; margin: 0 auto 2.5rem; color: var(--muted); font-size: 1.15rem; text-wrap: pretty; }
.contact-actions { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; }
.contact-actions a { display: flex; min-width: 12rem; min-height: 48px; align-items: center; justify-content: center; gap: .55rem; padding-inline: 1.5rem; color: white; border-radius: 999px; background: var(--primary-strong); font-weight: 700; transition: background-color .2s; }
.contact-actions a:hover { background: #0284c7; }
.contact-actions a:last-child { border: 1px solid var(--line); background: rgb(255 255 255 / .06); }
.contact-actions a:last-child:hover { background: rgb(255 255 255 / .12); }
.contact-actions svg { width: 1.25rem; }
.contact-section footer { position: relative; z-index: 1; padding: 2rem 0; border-top: 1px solid var(--line); background: rgb(0 0 0 / .45); backdrop-filter: blur(12px); }
.footer-content { display: flex; gap: 1rem; align-items: center; justify-content: space-between; color: #aebccd; font-size: .875rem; }
.footer-content nav { display: flex; flex-wrap: wrap; gap: 1.5rem; color: #b9c6d6; }
.footer-content a { min-height: 44px; display: inline-flex; align-items: center; }
.footer-content a:hover { color: white; }

@keyframes atmosphere { to { transform: translate3d(4rem, 2rem, 0) scale(1.08); } }
@keyframes scroll-cue { 50% { transform: translateY(.4rem); } }

@media (max-width: 960px) {
  .nav-container { grid-template-columns: 1fr auto auto; }
  .menu-button { display: grid; }
  .nav-links { position: fixed; top: 4.75rem; right: 0; left: 0; display: grid; padding: .75rem 1rem 1rem; border-bottom: 1px solid var(--line); background: rgb(8 15 34 / .97); transform: translateY(-130%); visibility: hidden; transition: transform .24s cubic-bezier(.22, 1, .36, 1), visibility .24s; }
  .nav-links.open { transform: translateY(0); visibility: visible; }
  .nav-links a { justify-content: start; }
  .hero-layout { grid-template-columns: 1fr; align-items: start; gap: 3rem; }
  .hero-proof { width: min(100%, 34rem); }
  .service-card { grid-template-columns: 3.5rem 1fr auto; }
  .service-card > p { grid-column: 2 / -1; }
  .service-more { grid-column: 2; }
  .advantage-panel { grid-template-columns: 1fr; }
}

@media (max-width: 720px) {
  .container { width: min(100% - 1.5rem, 80rem); }
  .contact-link { padding-inline: 1rem; }
  .hero-section { align-items: flex-start; }
  .hero-content h1 { font-size: clamp(3.4rem, 16vw, 4.75rem); overflow-wrap: anywhere; }
  .member, .member.reverse { flex-direction: column-reverse; align-items: stretch; gap: 2rem; }
  .member-copy, .member-media { width: 100%; }
  .member-media, .reverse .member-media { justify-content: center; }
  .avatar-frame { width: min(100%, 18rem); }
  .service-card { grid-template-columns: 3.5rem 1fr; gap: 1rem; padding: 1.5rem 0; }
  .service-card > p, .service-more { grid-column: 2; }
  .stat-list { grid-template-columns: 1fr 1fr; }
  .stat-list article:nth-child(3) { border-left: 0; border-top: 1px solid var(--line); }
  .stat-list article:nth-child(4) { border-top: 1px solid var(--line); }
  .contact-actions { align-items: stretch; flex-direction: column; }
  .contact-actions a { width: 100%; }
  .footer-content { align-items: flex-start; flex-direction: column; }
}

@media (max-width: 440px) {
  .nav-container { grid-template-columns: 1fr auto; }
  .hero-signature { letter-spacing: .04em; }
  .hero-actions { align-items: stretch; flex-direction: column; }
  .hero-cta, .hero-secondary { width: 100%; }
  .hero-proof { padding: 1.25rem; }
  .contact-panel h2 { font-size: 2.1rem; }
  .service-card { grid-template-columns: 3rem 1fr; }
  .service-icon { width: 3rem; height: 3rem; }
  .service-icon svg { width: 1.6rem; }
  .footer-content nav { gap: 1rem; }
}

@media (prefers-reduced-motion: reduce) {
  :global(html) { scroll-behavior: auto; }
  .hero-glow, .scroll-indicator svg { animation: none; }
  .nav-links, .hero-cta, .hero-cta span, .service-more b { transition: none; }
}
</style>
