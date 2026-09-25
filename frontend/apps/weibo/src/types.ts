export interface AbilityState { enabled: boolean; reason: string | null; label: string }
export interface WeiboFeedItem { id: number; text: string; author_name?: string; posted_at: number; status_url?: string; app_url?: string; restricted: boolean }
export interface WeiboFeedPage { list: WeiboFeedItem[]; total: number; page: number; limit: number; restricted: boolean; updated_at: number; poll_status: 'unconfigured' | 'failed' | 'ready'; last_error: string | null }
export interface WeiboCommentPreset { id: number; content: string; scope: 'team' | 'personal' }
export interface WorkspaceAccess {
  team?: { id: number; slug: string; name: string } | null
  permissions: string[]
  abilities: Record<string, AbilityState>
  identity: { entity_id: number; name: string; type: string; slug?: string | null; avatar?: string | null; belongs_to_team: boolean; is_external: boolean }
  entry_warning?: { required: boolean; kind: string | null; ttl_seconds: number }
}
export interface WeiboAccount { id: number; binding_id: number; entity_id: number; uid: string; screen_name: string; health: 'Unchecked' | 'Valid' | 'Invalid' | 'Unknown'; checked_at: number | null }
export interface WeiboTask { id: number; owner_entity_id: number | null; operation_type: 'Post' | 'Checkin'; topic: { name: string; display_tag: string }; content: string; account_ids: number[]; media_ids: number[]; start_at: number; min_interval: number; max_interval: number; version: number; status: 'Paused' | 'Active' | 'BlockedLogin' | 'BlockedAbility' | 'Cancelled'; block_reason: string | null; next_run_at: number | null }
export interface WeiboOperation { id: number; operation_type: 'Post' | 'Like' | 'Comment' | 'Checkin'; source: 'Manual' | 'Schedule'; status: 'Dispatching' | 'Succeeded' | 'Failed' | 'Unknown'; content_summary: string | null; target_id: string | null; reason: string | null; remote_message: string | null; started_at: number; finished_at: number | null }
