import { integrationStories } from './integration-stories'
import { appStories } from './app-stories'
import { uiStories } from './ui-stories'
import { teamUiStories } from './team-ui-stories'
import type { StoryDefinition } from './story-types'

export const storyRegistry: Record<string, StoryDefinition> = { ...integrationStories, ...uiStories, ...teamUiStories, ...appStories }
