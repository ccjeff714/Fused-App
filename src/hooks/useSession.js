import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { todayISO } from '../lib/date'

export function useSession(session) {
  const [activeSession, setActiveSession] = useState(null)
  const [error, setError] = useState(null)

  const startSession = useCallback(async (taskId) => {
    setError(null)
    const { data, error } = await supabase
      .from('execution_sessions')
      .insert({ task_id: taskId, user_id: session.user.id, started_at: new Date() })
      .select()
      .single()

    if (error) {
      setError(error.message)
      return { error }
    }
    setActiveSession(data)
    return { data }
  }, [session])

  const endSession = useCallback(async (executionSessionId, taskId, durationSec) => {
    setError(null)
    const endedAt = new Date()

    const { data, error } = await supabase
      .from('execution_sessions')
      .update({ ended_at: endedAt, duration_sec: durationSec })
      .eq('id', executionSessionId)
      .select()

    if (error) {
      setError(error.message)
      return { error }
    }
    if (!data || data.length === 0) {
      const blockedError = 'Ending the session was blocked — you may not have permission to update it.'
      setError(blockedError)
      return { error: blockedError }
    }

    const [{ error: taskError }, { error: streakError }] = await Promise.all([
      supabase.from('tasks').update({ last_touched_at: endedAt }).eq('id', taskId),
      supabase
        .from('streak_log')
        .upsert({ user_id: session.user.id, date: todayISO(), engaged: true }, { onConflict: 'user_id,date' }),
    ])

    if (taskError) setError(taskError.message)
    if (streakError) setError(streakError.message)

    setActiveSession(null)
    return { data: data[0] }
  }, [session])

  return { activeSession, error, startSession, endSession }
}
