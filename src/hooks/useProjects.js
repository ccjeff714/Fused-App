import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useProjects(session) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('projects').select('*').order('name')
    if (error) {
      setError(error.message)
    } else {
      setError(null)
      setProjects(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!session) return
    let cancelled = false

    supabase
      .from('projects')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setError(error.message)
        } else {
          setError(null)
          setProjects(data)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [session])

  const createProject = useCallback(async (fields) => {
    setError(null)
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...fields, user_id: session.user.id })
      .select()
      .single()

    if (error) {
      setError(error.message)
      return { error }
    }
    setProjects((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)))
    return { data }
  }, [session])

  const updateProject = useCallback(async (projectId, fields) => {
    setError(null)
    const { data, error } = await supabase
      .from('projects')
      .update({ ...fields, updated_at: new Date() })
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      setError(error.message)
      return { error }
    }
    setProjects((current) => current.map((p) => (p.id === projectId ? data : p)))
    return { data }
  }, [])

  const deleteProject = useCallback(async (projectId) => {
    setError(null)
    const { error } = await supabase.from('projects').delete().eq('id', projectId)
    if (error) {
      setError(error.message)
      return { error }
    }
    setProjects((current) => current.filter((p) => p.id !== projectId))
    return {}
  }, [])

  return { projects, loading, error, createProject, updateProject, deleteProject, refetch }
}
