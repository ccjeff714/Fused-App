import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const DEFAULT_SETTINGS = {
  inactivity_threshold_days: 2,
  default_session_minutes: 25,
  default_break_minutes: 5,
  pomodoro_enabled: true,
  auto_start_breaks: true,
  auto_start_next_sprint: false,
  show_success_screen: true,
  success_screen_gif: true,
  success_sound_effect: true,
  // session_background_url is intentionally absent from defaults — its
  // absence is the normal case until a user uploads an image (see
  // Phase2_Handoff_Spec.md A6a), not an error state.
}

// Single point of contact for profiles.settings reads/writes (Phase 2
// Addendum A2's refactor note) — every read/write of this jsonb column
// should go through here so the merge behavior can't drift out of sync
// in two places, same lesson as the Phase 1 sort-order bug.
export function useSettings(session) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!session) return
    let cancelled = false

    supabase
      .from('profiles')
      .select('settings')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setError(error.message)
        } else {
          setError(null)
          setSettings({ ...DEFAULT_SETTINGS, ...(data?.settings ?? {}) })
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [session])

  const updateSettings = useCallback(async (partial) => {
    setError(null)
    const merged = { ...settings, ...partial }
    setSettings(merged) // optimistic — the timer/UI shouldn't stall on a round trip

    const { error } = await supabase
      .from('profiles')
      .update({ settings: merged })
      .eq('id', session.user.id)

    if (error) {
      setError(error.message)
      setSettings(settings) // roll back the optimistic update
      return { error }
    }
    return { data: merged }
  }, [session, settings])

  return { settings, loading, error, updateSettings }
}
