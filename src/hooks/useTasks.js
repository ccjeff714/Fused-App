import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

function sortByDueDate(tasks) {
  return [...tasks].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return a.due_date.localeCompare(b.due_date)
  })
}

export function useTasks(session) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!session) return
    let cancelled = false

    supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setError(error.message)
        } else {
          setError(null)
          setTasks(data)
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
      .order('due_date', { ascending: true, nullsFirst: false })

    if (error) {
      setError(error.message)
    } else {
      setError(null)
      setTasks(data)
    }
    setLoading(false)
  }, [])

  const createTask = useCallback(async (fields) => {
    setError(null)
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...fields, user_id: session.user.id })
      .select()
      .single()

    if (error) {
      setError(error.message)
      return { error }
    }
    setTasks((current) => sortByDueDate([...current, data]))
    return { data }
  }, [session])

  const updateTask = useCallback(async (taskId, fields) => {
    setError(null)
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...fields, updated_at: new Date(), last_touched_at: new Date() })
      .eq('id', taskId)
      .select()

    if (error) {
      setError(error.message)
      return { error }
    }
    if (!data || data.length === 0) {
      const blockedError = 'Update was blocked — you may not have permission to edit this task.'
      setError(blockedError)
      return { error: blockedError }
    }
    setTasks((current) => sortByDueDate(current.map((t) => (t.id === taskId ? data[0] : t))))
    return { data: data[0] }
  }, [])

  const deleteTask = useCallback(async (taskId) => {
    setError(null)
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .select()

    if (error) {
      setError(error.message)
      return { error }
    }
    if (!data || data.length === 0) {
      const blockedError = 'Delete was blocked — you may not have permission to delete this task.'
      setError(blockedError)
      return { error: blockedError }
    }
    setTasks((current) => current.filter((t) => t.id !== taskId))
    return { data: data[0] }
  }, [])

  return { tasks, loading, error, createTask, updateTask, deleteTask, refetch }
}
