let position = { scope: '', top: 0 }

export function feedPosition(scope: string) {
  if (position.scope !== scope) position = { scope, top: 0 }
  return { top: position.top }
}

export function saveFeedPosition(scope: string, top: number) {
  position = { scope, top }
}

export interface FeedCommentDraft { text: string; baseline: string; expanded: boolean; pending: boolean; error: string }
let commentDraft: { scope: string; accountId: number | null; drafts: Record<number, FeedCommentDraft> } | undefined

export function saveFeedDraft(scope: string, accountId: number | null, drafts: Record<number, FeedCommentDraft>) {
  commentDraft = { scope, accountId, drafts: Object.fromEntries(Object.entries(drafts).map(([id, draft]) => [id, { ...draft }])) }
}

export function takeFeedDraft(scope: string) {
  const saved = commentDraft
  commentDraft = undefined
  return saved?.scope === scope ? saved : undefined
}

export function clearFeedDraft() { commentDraft = undefined }
