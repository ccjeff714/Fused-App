import { useState } from 'react'

const NEW_ROLE_VALUE = '__new__'

// Shared Role picker with inline creation (Phase5_Handoff_Spec.md §2: "no
// dedicated Roles CRUD screen — creation happens inline wherever a Role
// picker appears"). Reused by Capture, TaskEditModal, and TaskDetailPanel.
export default function RoleSelect({ roles, value, onChange, disabled, hint, opacity, onCreateRole }) {
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState('')

  const handleSelect = (e) => {
    if (e.target.value === NEW_ROLE_VALUE) {
      setCreating(true)
      return
    }
    onChange(e.target.value)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const name = draft.trim()
    if (!name) return
    const { data, error } = await onCreateRole(name)
    if (!error && data) {
      onChange(data.id)
      setCreating(false)
      setDraft('')
    }
  }

  return (
    <label className="field">
      <span className="field-label-row">
        <span>Role</span>
        <span className="field-hint">{hint}</span>
      </span>
      {creating ? (
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            autoFocus
            placeholder="New role name"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="btn btn-outline btn-sm" disabled={!draft.trim()}>Add</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCreating(false)}>Cancel</button>
        </form>
      ) : (
        <select
          className="select"
          value={value || ''}
          onChange={handleSelect}
          disabled={disabled}
          style={{ opacity }}
        >
          <option value="">No role</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
          {!disabled && <option value={NEW_ROLE_VALUE}>+ New role</option>}
        </select>
      )}
    </label>
  )
}
