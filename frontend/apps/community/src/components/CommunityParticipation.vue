<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { api, auth, friendlyError } from '@lostsky/api/client'
import { communityInteractionReason, communityPath, type Community } from '@lostsky/api/community'
import { identityUrl, loginUrl } from '@lostsky/shared/navigation'
import { NAlert, NButton, NFlex } from 'naive-ui'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { feedback } from '@lostsky/ui/feedback'
const props = defineProps<{ community: Community }>()
const route = useRoute(), cache = useQueryClient(), busy = ref(false)
const reason = computed(() => communityInteractionReason(props.community))
const identityHref = computed(() => { const target = identityUrl(new URL(route.fullPath, location.origin).href); return auth.token() ? target : loginUrl({ redirect: new URL(target, location.origin).href }) })
async function join() {
  if (busy.value) return
  busy.value = true
  try { await api.post(`${communityPath(props.community.slug)}/join`, { expected_entity_id: props.community.entity_id }); await Promise.all([cache.invalidateQueries({ queryKey: ['community', props.community.slug] }), cache.invalidateQueries({ queryKey: ['community-list'] })]); feedback.success('已加入社区，可以开始讨论了') }
  catch (error) { feedback.error(friendlyError(error)) } finally { busy.value = false }
}
</script>
<template>
  <NAlert v-if="reason" :type="community.status === 'Paused' || community.is_muted ? 'warning' : 'info'" :show-icon="false">
    <NFlex align="center" justify="space-between"><div><strong>{{ !community.entity_id ? '以你的人员身份参与讨论' : !community.is_joined && community.status === 'Active' && community.team_available ? '加入这个话题，一起交流' : reason }}</strong><p class="participation-description">{{ !community.entity_id ? '公开内容可直接阅读；登录并选择成员或顾客身份后，即可加入社区。' : !community.is_joined && community.status === 'Active' && community.team_available ? '加入后可以发布帖子、评论和点赞，退出仍会保留你的内容。' : '你仍可阅读这里已有的公开内容。' }}</p></div>
      <NButton v-if="!community.entity_id" tag="a" :href="identityHref" secondary>{{ auth.token() ? '选择人员身份' : '登录并选择身份' }}</NButton>
      <LsButton v-else-if="!community.is_joined && !communityInteractionReason(community, 'join')" :loading="busy" :disabled="busy" disabled-reason="正在加入社区" @click="join">加入社区</LsButton>
    </NFlex>
  </NAlert>
</template>
<style scoped>.participation-description{margin:.25rem 0 0;font-size:.875rem;line-height:1.65}</style>
