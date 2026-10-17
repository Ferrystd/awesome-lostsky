import { formFieldsStories } from './form-fields-story'
import { formPageStory } from './form-page-story'
import { detailPageStory } from './detail-page-story'
import { categoryPageStory } from './category-page-story'
import { overviewStory } from './overview-story'
import { communityStories } from './community-stories'
import { appStories } from './app-stories'
import { uiStories } from './ui-stories'
import type { StoryDefinition } from './story-types'

export const storyRegistry: Record<string, StoryDefinition> = { ...formFieldsStories, ...uiStories, ...appStories, ...communityStories, ...objectDirectoryStories, LsOverviewPage: overviewStory, LsCategoryPage: categoryPageStory, LsDetailPage: detailPageStory, LsFormPage: formPageStory }
import { objectDirectoryStories } from './object-directory-story'
