<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { api, auth, friendlyError } from '@lostsky/api/client'
import { communityInteractionReason, communityPath, type Community } from '@lostsky/api/community'
import { identityUrl, loginUrl } from '@lostsky/shared/navigation'
import { NAlert, NButton } from 'naive-ui'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { feedback } from '@lostsky/ui/feedback'
const props = defineProps<{ community: Community }>()
const route = useRoute(), cache = useQueryClient(), busy = ref(false)
const reason = computed(() => communityInteractionReason(props.community))
const restriction = computed(() => !props.community.team_available ? '所属团队当前不可用，暂时不能加入或互动' : props.community.status === 'Paused' ? '社区已暂停，暂时不能加入或互动' : props.community.is_muted ? `你在此社区被禁言：${props.community.mute_reason}` : '')
const identityHref = computed(() => { const target = identityUrl(new URL(route.fullPath, location.origin).href); return auth.token() ? target : loginUrl({ redirect: new URL(target, location.origin).href }) })
async function join() {
  if (busy.value) return
  busy.value = true
  try { await api.post(`${communityPath(props.community.slug)}/join`, { expected_entity_id: props.community.entity_id }); await Promise.all([cache.invalidateQueries({ queryKey: ['community', props.community.slug] }), cache.invalidateQueries({ queryKey: ['community-list'] })]); feedback.success('已加入社区') }
  catch (error) { feedback.error(friendlyError(error)) } finally { busy.value = false }
}
</script>
<template>
  <NAlert v-if="restriction" type="warning" :show-icon="false"><strong>{{ restriction }}</strong><span class="participation-description">仍可阅读已有公开内容。</span><NButton v-if="!community.entity_id" class="participation-action" tag="a" :href="identityHref" text>{{ auth.token() ? '选择人员身份' : '登录并选择身份' }}</NButton><LsButton v-else-if="!community.is_joined && !communityInteractionReason(community, 'join')" :loading="busy" :disabled="busy" disabled-reason="正在加入社区" @click="join">加入社区</LsButton></NAlert>
  <div v-else-if="reason" class="community-participation">
    <span>{{ !community.entity_id ? '公开内容可直接阅读，选择人员身份后参与讨论。' : '加入社区后，可以发帖、评论和点赞。' }}</span>
    <NButton v-if="!community.entity_id" class="participation-action" tag="a" :href="identityHref" text>{{ auth.token() ? '选择人员身份' : '登录并选择身份' }}</NButton>
    <LsButton v-else-if="!community.is_joined && !communityInteractionReason(community, 'join')" :loading="busy" :disabled="busy" disabled-reason="正在加入社区" @click="join">加入社区</LsButton>
  </div>
</template>
<style scoped>.participation-action{min-height:44px}.community-participation{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.25rem 1rem;min-height:44px;color:var(--text-secondary);font-family:var(--font-ui);font-size:.875rem;line-height:1.6}.community-participation>span{min-width:0;overflow-wrap:anywhere}.participation-description{margin-left:.5rem;font-size:.875rem;line-height:1.65}</style>
