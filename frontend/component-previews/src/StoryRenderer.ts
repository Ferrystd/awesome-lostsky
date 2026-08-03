import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { PreviewState, StoryDefinition } from './story-types'

export default defineComponent({
  name: 'StoryRenderer',
  props: {
    story: { type: Object as PropType<StoryDefinition>, required: true },
    state: { type: String as PropType<PreviewState>, required: true },
  },
  setup: props => () => props.story.render(props.state),
})
