import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Roles have no dedicated CRUD screen (Phase5_Handoff_Spec.md §2) — creation
// happens inline wherever a Role picker appears, so this hook exposes a
// createIfNew helper alongside the standard CRUD set.
export function useRoles(session) {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('roles').select('*').order('name')
    if (error) {
      setError(error.message)
    } else {
      setError(null)
      setRoles(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!session) return
    let cancelled = false

    supabase
      .from('roles')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setError(error.message)
        } else {
          setError(null)
          setRoles(data)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [session])

  const createRole = useCallback(async (name) => {
    setError(null)
    const { data, error } = await supabase
      .from('roles')
      .insert({ name, user_id: session.user.id })
      .select()
      .single()

    if (error) {
      setError(error.message)
      return { error }
    }
    setRoles((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)))
    return { data }
  }, [session])

  // Returns the existing role by name (case-insensitive) if one exists,
  // otherwise creates it — used by pickers that let you type a new role
  // inline rather than requiring it to exist beforehand.
  const createIfNew = useCallback(async (name) => {
    const trimmed = name.trim()
    if (!trimmed) return { error: 'Role name is required' }
    const existing = roles.find((r) => r.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) return { data: existing }
    return createRole(trimmed)
  }, [roles, createRole])

  const updateRole = useCallback(async (roleId, fields) => {
    setError(null)
    const { data, error } = await supabase
      .from('roles')
      .update({ ...fields, updated_at: new Date() })
      .eq('id', roleId)
      .select()
      .single()

    if (error) {
      setError(error.message)
      return { error }
    }
    setRoles((current) => current.map((r) => (r.id === roleId ? data : r)))
    return { data }
  }, [])

  const deleteRole = useCallback(async (roleId) => {
    setError(null)
    const { error } = await supabase.from('roles').delete().eq('id', roleId)
    if (error) {
      setError(error.message)
      return { error }
    }
    setRoles((current) => current.filter((r) => r.id !== roleId))
    return {}
  }, [])

  return { roles, loading, error, createRole, createIfNew, updateRole, deleteRole, refetch }
}
