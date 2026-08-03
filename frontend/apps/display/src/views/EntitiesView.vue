<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { ArrowLeft, ArrowRight, Search } from '@lucide/vue'
import { computed, onScopeDispose, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import EntityList from '../components/EntityList.vue'
import { displayApi } from '../lib'

type PublicEntityType = 'teamMember' | 'teamVirtual'

const PAGE_SIZE = 20
const page = ref(1)
const keyword = ref('')
const type = ref<PublicEntityType | undefined>()
const debouncedKeyword = ref('')
const normalizedKeyword = computed(() => debouncedKeyword.value.trim())
const filters = [
  { label: '全部', value: undefined },
  { label: '成员', value: 'teamMember' as const },
  { label: '虚拟实体', value: 'teamVirtual' as const },
]

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(keyword, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    debouncedKeyword.value = value
  }, 300)
})
watch(type, () => { page.value = 1 })
onScopeDispose(() => clearTimeout(searchTimer))

const entities = useQuery({
  queryKey: computed(() => ['display-entities', 'directory', page.value, type.value, normalizedKeyword.value]),
  queryFn: () => displayApi.entities(page.value, PAGE_SIZE, type.value, normalizedKeyword.value || undefined),
})
const total = computed(() => entities.data.value?.total ?? 0)
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / (entities.data.value?.limit ?? PAGE_SIZE))))
const hasFilters = computed(() => Boolean(normalizedKeyword.value || type.value))
</script>

<template>
  <article class="entity-directory-page">
    <header class="entity-directory-header">
      <RouterLink class="back-link" to="/"><ArrowLeft :size="18" aria-hidden="true" />返回团队主页</RouterLink>
      <h1 tabindex="-1">公开实体</h1>
      <p>浏览团队公开展示的成员与虚拟实体。</p>
    </header>

    <section class="entity-directory-content" aria-label="公开实体目录">
      <div class="entity-directory-toolbar">
        <label class="entity-search">
          <span class="visually-hidden">搜索实体名称或 Slug</span>
          <Search :size="19" aria-hidden="true" />
          <input v-model="keyword" type="search" maxlength="100" placeholder="搜索名称或 Slug" autocomplete="off">
        </label>
        <div class="entity-type-filter" role="group" aria-label="按实体类型筛选">
          <button
            v-for="option in filters"
            :key="option.label"
            type="button"
            :aria-pressed="type === option.value"
            @click="type = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <p class="entity-directory-count" aria-live="polite">
        {{ entities.isPending.value ? '正在读取公开实体' : entities.isError.value ? '暂时无法读取公开实体' : `共 ${total} 个公开实体` }}
      </p>

      <div v-if="entities.isPending.value" class="entity-skeleton"><span v-for="item in 6" :key="item" /></div>
      <div v-else-if="entities.isError.value" class="inline-error" role="alert">
        <span>实体列表加载失败。</span>
        <button type="button" @click="entities.refetch()">重试</button>
      </div>
      <EntityList v-else-if="entities.data.value?.list.length" :entities="entities.data.value.list" />
      <p v-else class="empty-state">
        {{ hasFilters ? '没有符合条件的公开实体。' : '团队暂时没有公开实体。' }}
      </p>

      <nav v-if="!entities.isPending.value && !entities.isError.value && pageCount > 1" class="pager" aria-label="实体列表分页">
        <button type="button" :disabled="page <= 1" @click="page -= 1"><ArrowLeft :size="17" aria-hidden="true" />上一页</button>
        <span>第 {{ page }} / {{ pageCount }} 页</span>
        <button type="button" :disabled="page >= pageCount" @click="page += 1">下一页<ArrowRight :size="17" aria-hidden="true" /></button>
      </nav>
    </section>
  </article>
</template>

<style scoped>
.entity-directory-page{width:min(100% - 2rem,78rem);margin-inline:auto;padding:clamp(2rem,5vw,4rem) 0 clamp(5rem,9vw,8rem)}
.entity-directory-header{max-width:58rem;padding:clamp(2rem,6vw,5rem) 0 clamp(3rem,7vw,5.5rem)}
.entity-directory-header h1{margin:1.25rem 0 0;font-family:"Barlow Condensed","PingFang SC",sans-serif;font-size:clamp(3.5rem,9vw,5.5rem);font-weight:700;line-height:.95;letter-spacing:-.03em;text-wrap:balance}
.entity-directory-header>p{max-width:65ch;margin:1.25rem 0 0;color:var(--muted-ink);font-size:clamp(1rem,2vw,1.15rem);line-height:1.8;text-wrap:pretty}
.entity-directory-content{display:grid;gap:1.25rem}
.entity-directory-toolbar{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding-bottom:1.25rem;border-bottom:1px solid var(--line)}
.entity-search{min-height:48px;flex:1 1 24rem;display:flex;align-items:center;gap:.65rem;max-width:32rem;padding:0 .9rem;border:1px solid var(--line);border-radius:10px;color:var(--muted-ink);background:var(--surface);transition:border-color var(--motion-fast) var(--ease-standard),background-color var(--motion-fast) var(--ease-standard)}
.entity-search:focus-within{border-color:var(--sky-lost-strong);background:var(--sky-night)}
.entity-search input{min-width:0;flex:1;height:46px;padding:0;border:0;outline:0;color:var(--ink);background:transparent;font:inherit}
.entity-search input::placeholder{color:var(--muted-ink);opacity:1}
.entity-type-filter{display:flex;align-items:center;gap:.25rem;padding:.25rem;border:1px solid var(--line);border-radius:10px;background:var(--surface)}
.entity-type-filter button{min-height:44px;padding:0 .85rem;border:0;border-radius:7px;color:var(--muted-ink);background:transparent;cursor:pointer;font-weight:650;transition:color var(--motion-fast) var(--ease-standard),background-color var(--motion-fast) var(--ease-standard)}
.entity-type-filter button:hover{color:var(--ink)}
.entity-type-filter button[aria-pressed="true"]{color:var(--ink);background:oklch(.5 .11 190/.22)}
.entity-directory-count{margin:0;color:var(--muted-ink);font-size:.82rem;font-variant-numeric:tabular-nums}
.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media(max-width:760px){.entity-directory-toolbar{align-items:stretch;flex-direction:column}.entity-search{width:100%;max-width:none}.entity-type-filter{width:100%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}.entity-type-filter button{min-height:44px;padding-inline:.4rem}}
@media(prefers-reduced-motion:reduce){.entity-search,.entity-type-filter button{transition:none}}
</style>
