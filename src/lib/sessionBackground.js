import { supabase } from './supabaseClient'

const BUCKET = 'session-backgrounds'
const SIGNED_URL_TTL_SECONDS = 60 * 60 // 1 hour — the bucket is private, so a raw path is stored in settings and re-signed on read

// profiles.settings.session_background_url stores the storage object path
// (e.g. "{user_id}/bg.jpg"), not a public URL — the bucket is private
// (Phase2_Handoff_Spec.md A6a). Callers resolve it to a usable signed URL
// on demand via this helper.
export async function resolveSessionBackgroundUrl(path) {
  if (!path) return null
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
  if (error) return null
  return data?.signedUrl ?? null
}

export async function uploadSessionBackground(userId, file) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/session-bg.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (error) return { error }
  return { path }
}
