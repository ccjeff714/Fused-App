import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

// Execution history shown in TaskDetailPanel — sourced entirely from
// execution_sessions (Build_Plan.md: "the execution log — auto-populated,
// never manually entered"). There's no separate activity-log table, so this
// only ever reflects real session rows, not synthetic events.
export function useExecutionHistory(taskId) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!taskId) return
    let cancelled = false

    supabase
      .from('execution_sessions')
      .select('*')
      .eq('task_id', taskId)
      .order('started_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setHistory(data)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [taskId])

  return { history, loading }
}
