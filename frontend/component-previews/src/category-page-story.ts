import { defineComponent, h, ref } from 'vue'
import LsCategoryPage from '@lostsky/ui/components/LsCategoryPage.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsCheckboxGroupField from '@lostsky/ui/components/LsCheckboxGroupField.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsWorkspaceScene from '@lostsky/ui/components/LsWorkspaceScene.vue'
import type { StoryDefinition } from './story-types'

export const categoryPageStory: StoryDefinition = {
  name: 'LsCategoryPage', desktopWidth: 1024,
  supported: ['default', 'hover', 'focus', 'active', 'loading', 'error', 'mobile'],
  reason: { disabled: '分类导航始终可用；权限与表单只读状态由业务内容负责。' },
  render: state => h(defineComponent({ setup() {
    const current = ref('members')
    const selected = ref<string[]>(state === 'active' ? ['member.read'] : [])
    return () => h(LsWorkspaceScene, null, { default: () => h(LsCategoryPage, {
      title: '运营协作员', description: '按业务领域调整角色权限，全部分类统一保存。',
      label: '角色分类', current: current.value,
      items: [{ key: 'members', label: '成员管理', dirty: selected.value.length > 0 }, { key: 'documents', label: '文档管理' }, { key: 'advanced', label: '高级范围权限' }],
      onSelect: key => { current.value = key },
    }, { default: () => state === 'loading' || state === 'error'
      ? h(LsAsyncState, { state, title: state === 'error' ? '暂时无法读取角色' : undefined })
      : h(LsPanel, null, { header: () => h(LsSectionHeader, { title: current.value === 'members' ? '成员管理' : current.value === 'documents' ? '文档管理' : '高级范围权限', description: '切换分类保留当前草稿。' }), default: () => h(LsCheckboxGroupField, { label: '业务权限', modelValue: selected.value, options: [{ value: 'member.read', label: '查看成员资料', description: '允许查看团队成员的工作资料。' }, { value: 'member.update', label: '编辑成员资料' }], 'onUpdate:modelValue': values => { selected.value = values.map(String) } }) }) }) })
  } })),
}
