import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { rankTasks } from '../lib/ranking'
import { todayISO } from '../lib/date'

function assembleTopThree(tasks) {
  const today = todayISO()

  const overrideBySlot = {}
  for (const task of tasks) {
    if (task.top3_override_date === today && task.top3_override_slot) {
      overrideBySlot[task.top3_override_slot] = task
    }
  }

  const remaining = tasks.filter(
    (task) => !(task.top3_override_date === today && task.top3_override_slot)
  )
  const ranked = rankTasks(remaining)

  const result = []
  let rankedIndex = 0
  for (let slot = 1; slot <= 3; slot++) {
    if (overrideBySlot[slot]) {
      result.push(overrideBySlot[slot])
    } else if (rankedIndex < ranked.length) {
      result.push(ranked[rankedIndex])
      rankedIndex++
    }
  }
  return result
}

export function useTopThree(session) {
  const [topThree, setTopThree] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!session) return
    let cancelled = false

    supabase
      .from('tasks')
      .select('*')
      .neq('status', 'done')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setError(error.message)
        } else {
          setError(null)
          setTopThree(assembleTopThree(data))
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [session])

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .neq('status', 'done')

    if (error) {
      setError(error.message)
    } else {
      setError(null)
      setTopThree(assembleTopThree(data))
    }
    setLoading(false)
  }, [])

  const setOverride = useCallback(async (taskId, slot) => {
    setError(null)
    const today = todayISO()

    const currentOccupant = topThree.find(
      (t) => t.top3_override_date === today && t.top3_override_slot === slot && t.id !== taskId
    )
    if (currentOccupant) {
      const { error: clearError } = await supabase
        .from('tasks')
        .update({ top3_override_slot: null, top3_override_date: null })
        .eq('id', currentOccupant.id)
      if (clearError) {
        setError(clearError.message)
        return { error: clearError }
      }
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({ top3_override_slot: slot, top3_override_date: today })
      .eq('id', taskId)
      .select()

    if (error) {
      setError(error.message)
      return { error }
    }
    if (!data || data.length === 0) {
      const blockedError = 'Override was blocked — you may not have permission to edit this task.'
      setError(blockedError)
      return { error: blockedError }
    }

    await refetch()
    return { data: data[0] }
  }, [topThree, refetch])

  return { topThree, loading, error, setOverride, refetch }
}
