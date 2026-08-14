<script setup lang="ts">
import { api } from '@lostsky/api/client'
import { useQuery } from '@tanstack/vue-query'
import { ArrowRight, Bell, BookOpen, Boxes, UserRound, Users } from '@lucide/vue'
import { computed } from 'vue'
import { abilityReason } from '../lib/teamAccess'

type MetricReason = { kind: 'ability'; key: string; label: string } | null
type DashboardMetric = {
  available: boolean
  count: number | null
  error: string | null
  reason: MetricReason
}
type DashboardSummary = {
  entities: DashboardMetric
  members: DashboardMetric
  documents: DashboardMetric
  notices: DashboardMetric
}

const query = useQuery({
  queryKey: ['team-dashboard'],
  queryFn: () => api.get<DashboardSummary>('/dashboard'),
})

const stats = computed(() => [
  { key: 'entities', label: '实体', icon: Boxes, to: '/entities', metric: query.data.value?.entities },
  { key: 'members', label: '成员', icon: Users, to: '/members', metric: query.data.value?.members },
  { key: 'documents', label: '文档', icon: BookOpen, to: '/docs', metric: query.data.value?.documents },
  { key: 'notices', label: '通知', icon: Bell, to: '/notices/entity', metric: query.data.value?.notices },
])
const documents = computed(() => query.data.value?.documents)
function reason(metric: DashboardMetric | undefined) {
  if (metric?.reason?.kind !== 'ability') return ''
  return abilityReason(metric.reason.key, metric.reason.label)
}
</script>

<template>
  <div class="dashboard">
    <section class="welcome">
      <div>
        <p>团队运行概览</p>
        <h2>今天要处理什么？</h2>
        <span>先看状态，再进入具体工作。</span>
      </div>
      <div class="welcome-actions">
        <RouterLink class="welcome-chat" to="/personal"><UserRound :size="18" />进入个人工作台 <ArrowRight :size="18" /></RouterLink>
        <div class="welcome-document">
          <div
            v-if="documents && !documents.available"
            class="welcome-disabled"
            aria-disabled="true"
            :aria-describedby="'welcome-doc-reason'"
          ><BookOpen :size="18" />使用文档 <ArrowRight :size="18" /></div>
          <RouterLink v-else class="welcome-doc" to="/docs"><BookOpen :size="18" />使用文档 <ArrowRight :size="18" /></RouterLink>
          <small v-if="documents && !documents.available" id="welcome-doc-reason">{{ reason(documents) }}</small>
        </div>
      </div>
    </section>

    <section class="stats" aria-label="团队入口">
      <template v-for="item in stats" :key="item.key">
        <div
          v-if="item.metric && !item.metric.available"
          class="stat-card disabled"
          aria-disabled="true"
          :aria-describedby="`${item.key}-reason`"
        >
          <component :is="item.icon" :size="20" />
          <span>{{ item.label }}</span>
          <strong>—</strong>
          <small :id="`${item.key}-reason`">{{ reason(item.metric) }}</small>
        </div>
        <RouterLink v-else :to="item.to" class="stat-card">
          <component :is="item.icon" :size="20" />
          <span>{{ item.label }}</span>
          <strong v-if="query.isPending.value">—</strong>
          <strong v-else-if="item.metric?.error" aria-hidden="true">!</strong>
          <strong v-else-if="item.metric?.count === null"><ArrowRight :size="25" /></strong>
          <strong v-else>{{ item.metric?.count ?? 0 }}</strong>
          <small v-if="item.metric?.error" role="status">{{ item.metric.error }}</small>
        </RouterLink>
      </template>
    </section>

    <p v-if="query.isError.value" class="dashboard-error" role="alert">
      概览暂时无法读取，请稍后重试。各工作入口仍可正常使用。
    </p>

    <section class="work-grid">
      <article>
        <div><h3>实体与权限</h3><p>维护实体资料、角色和访问范围。</p></div>
        <nav>
          <RouterLink to="/entities">实体列表<ArrowRight :size="17" /></RouterLink>
          <RouterLink to="/roles">角色权限<ArrowRight :size="17" /></RouterLink>
          <RouterLink to="/join-review">加入审核<ArrowRight :size="17" /></RouterLink>
        </nav>
      </article>
      <article>
        <div><h3>团队资料</h3><p>让文件和规范出现在需要它们的地方。</p></div>
        <nav>
          <RouterLink to="/docs">文档库<ArrowRight :size="17" /></RouterLink>
          <RouterLink to="/files">文件空间<ArrowRight :size="17" /></RouterLink>
          <RouterLink to="/fields">人员字段<ArrowRight :size="17" /></RouterLink>
        </nav>
      </article>
    </section>
  </div>
</template>

<style scoped>
.dashboard{display:grid;gap:1rem}.welcome{padding:1.25rem;color:white;background:var(--sky-night);border-radius:12px}.welcome p{margin:0;color:var(--sky-lost);font-size:.76rem;font-weight:750}.welcome h2{margin:.35rem 0 0;font-size:1.65rem}.welcome span{display:block;margin-top:.35rem;color:oklch(.72 .014 210);font-size:.9rem}.welcome-actions{display:grid;gap:.5rem;margin-top:1.25rem}.welcome-actions a,.welcome-disabled{width:100%;min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:0 .9rem;border:0;border-radius:8px;font-weight:700}.welcome-chat{color:var(--sky-void);background:var(--afterglow)}.welcome-doc,.welcome-disabled{color:white;background:color-mix(in oklch,var(--sky-night),white 8%);box-shadow:inset 0 0 0 1px color-mix(in oklch,var(--sky-lost),transparent 52%)}.welcome-disabled{opacity:.5;cursor:help}.welcome-document{display:grid}.welcome-document small{display:block;max-width:28rem;margin-top:.5rem;color:oklch(.75 .04 190);font-size:.7rem}.stats{display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem}.stat-card{min-height:132px;display:grid;grid-template-columns:1fr auto;align-content:space-between;padding:1rem;color:var(--ink);text-align:left;background:white;border:1px solid var(--line);border-radius:10px;transition:border-color .18s ease,background .18s ease}.stat-card:not(.disabled):hover{border-color:var(--sky-lost);background:color-mix(in oklch,white,var(--cloud) 28%)}.stat-card:focus-visible{outline:3px solid color-mix(in oklch,var(--sky-lost),transparent 72%);outline-offset:2px}.stat-card>svg{color:var(--sky-lost-strong)}.stat-card>span{grid-column:1;color:var(--muted-ink);font-size:.82rem}.stat-card>strong{grid-column:2;grid-row:1/3;align-self:end;display:grid;place-items:center;font-size:1.8rem}.stat-card>small{grid-column:1/-1;margin-top:.7rem;color:var(--muted-ink);font-size:.7rem;line-height:1.45;overflow-wrap:anywhere}.stat-card.disabled{color:var(--muted-ink);background:color-mix(in oklch,white,var(--cloud) 50%);cursor:help}.stat-card.disabled>svg{color:var(--muted-ink)}.dashboard-error{margin:0;padding:.8rem;color:var(--danger);background:white;border:1px solid color-mix(in oklch,var(--danger),white 70%);border-radius:8px}.work-grid{display:grid;gap:.75rem}.work-grid article{padding:1.1rem;background:white;border:1px solid var(--line);border-radius:10px}.work-grid h3{margin:0}.work-grid p{margin:.35rem 0 1rem;color:var(--muted-ink);font-size:.88rem}.work-grid nav{border-top:1px solid var(--line)}.work-grid nav a{min-height:46px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);font-size:.9rem}
@media(min-width:480px){.welcome-actions{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(min-width:640px){.stats{grid-template-columns:repeat(4,1fr)}.work-grid{grid-template-columns:repeat(2,1fr)}}@media(min-width:900px){.welcome{display:flex;align-items:end;justify-content:space-between;padding:1.75rem}.welcome-actions{width:calc(24rem + .5rem);margin:0}.stat-card{min-height:150px;padding:1.25rem}.work-grid article{padding:1.5rem}}
</style>
