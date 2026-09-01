import { useState } from 'react'

const NEW_ROLE_VALUE = '__new__'

// Shared Role picker with inline creation (Phase5_Handoff_Spec.md §2: "no
// dedicated Roles CRUD screen — creation happens inline wherever a Role
// picker appears"). Reused by Capture, TaskEditModal, and TaskDetailPanel.
// TaskDetailPanel's grid already supplies a "Role" label in its own left
// column for every row, so pass hideLabel there — otherwise this
// component's own internal label doubles it up (one above the field from
// here, one beside it from the grid).
// `required` drops the "No role" option in favor of a disabled placeholder
// — for ProjectCreateModal's global (non-role-locked) entry point, where
// Role is a required field rather than the usual optional task field.
export default function RoleSelect({ roles, value, onChange, disabled, hint, opacity, onCreateRole, hideLabel, required }) {
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState('')

  const handleSelect = (e) => {
    if (e.target.value === NEW_ROLE_VALUE) {
      setCreating(true)
      return
    }
    onChange(e.target.value)
  }

  const handleCreate = async () => {
    const name = draft.trim()
    if (!name) return
    const { data, error } = await onCreateRole(name)
    if (!error && data) {
      onChange(data.id)
      setCreating(false)
      setDraft('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreate()
    }
  }

  const Wrapper = hideLabel ? 'div' : 'label'

  return (
    <Wrapper className="field">
      {!hideLabel && (
        <span className="field-label-row">
          <span>Role</span>
          <span className="field-hint">{hint}</span>
        </span>
      )}
      {creating ? (
        // Deliberately not a <form> — this renders inside TaskCaptureModal
        // and TaskEditModal's own outer <form>, and a nested <form> is
        // invalid HTML whose submit routing isn't reliable across browsers
        // (the root cause of the "Add just refreshes the page, nothing
        // saved" bug). Enter-to-submit is wired via onKeyDown instead.
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            autoFocus
            placeholder="New role name"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" className="btn btn-outline btn-sm" disabled={!draft.trim()} onClick={handleCreate}>Add</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCreating(false)}>Cancel</button>
        </div>
      ) : (
        <select
          className="select"
          value={value || ''}
          onChange={handleSelect}
          disabled={disabled}
          required={required}
          style={{ opacity }}
        >
          <option value="" disabled={required}>{required ? 'Select a role' : 'No role'}</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
          {!disabled && <option value={NEW_ROLE_VALUE}>+ New role</option>}
        </select>
      )}
    </Wrapper>
  )
}
