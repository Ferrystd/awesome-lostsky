<script setup lang="ts">
import { auth, friendlyError } from '@lostsky/api/client'
import { redirectToLogin, safeRedirect } from '@lostsky/shared/navigation'
import { useQuery } from '@tanstack/vue-query'
import { ArrowRight, BadgeCheck, WalletCards } from '@lucide/vue'
import { NButton, NInput } from 'naive-ui'
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { rememberCustomer, shopApi } from '../lib'

const route = useRoute()
const router = useRouter()
const storefront = useQuery({ queryKey: ['shop-storefront'], queryFn: shopApi.storefront })
const shopName = computed(() => storefront.data.value?.profile.name || '当前商家')
const slug = ref('')
const pending = ref(false)
const error = ref('')

async function bind() {
  if (!auth.token()) { redirectToLogin({ redirect: location.href }); return }
  pending.value = true
  error.value = ''
  try {
    const result = await shopApi.bind(slug.value.trim() || undefined)
    if (result.token) auth.save({ token: result.token })
    rememberCustomer(result.customer.id)
    const target = safeRedirect(route.query.redirect, '/orders')
    if (target.startsWith('/')) await router.replace(target)
    else location.replace(target)
  } catch (reason) {
    error.value = friendlyError(reason)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <section class="bind-page">
    <header class="bind-intro">
      <RouterLink class="back-link" to="/">返回商城</RouterLink>
      <p class="section-label">商店账户</p>
      <h1 tabindex="-1">在 {{ shopName }} 建立客户账户</h1>
      <p>这一步会把你现在的 LostSky 身份与本店的独立客户账户关联。之后可以使用商家为你预存的余额购买，原身份不会被转移。</p>
      <div class="bind-benefits">
        <span><BadgeCheck :size="20" aria-hidden="true" />仅关联本店，归属不可转移</span>
        <span><WalletCards :size="20" aria-hidden="true" />余额、订单与退款都保留记录</span>
      </div>
    </header>

    <form class="bind-form" @submit.prevent="bind">
      <div class="form-heading"><span>可选设置</span><strong>给客户账户起一个标识</strong><p>不填写时，系统会自动生成唯一标识。</p></div>
      <label for="customer-slug">客户标识 <span>可选</span></label>
      <NInput id="customer-slug" v-model:value="slug" size="large" maxlength="50" aria-label="客户标识（可选）" placeholder="例如 sky-friend" />
      <p class="field-help">创建后不可更改或转移，请勿填写手机号等隐私信息。</p>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <NButton attr-type="submit" type="primary" size="large" :loading="pending" block>建立账户并继续 <ArrowRight :size="18" aria-hidden="true" /></NButton>
      <p class="form-footnote">继续即表示你确认关联当前商家。</p>
    </form>
  </section>
</template>
