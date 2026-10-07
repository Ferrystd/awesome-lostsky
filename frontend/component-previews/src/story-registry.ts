import { communityStories } from './community-stories'
import { appStories } from './app-stories'
import { uiStories } from './ui-stories'
import type { StoryDefinition } from './story-types'

export const storyRegistry: Record<string, StoryDefinition> = { ...uiStories, ...appStories, ...communityStories }
