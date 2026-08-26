import { useState, useRef, useEffect } from 'react'
import { PROJECT_STATUSES, projectStatusLabel } from '../../lib/taskDisplay'

// Shared by both Project-creation entry points (Phase5_Handoff_Spec.md §10
// + this round's addition of a second entry point):
// - Inline "+ New Project" per Role section on Projects View — passes
//   lockedRoleId/lockedRoleName, Role is fixed to that section.
// - The sidebar "+" next to Projects, reachable from anywhere — has no
//   Role context to inherit, so Role renders as a required, editable
//   select instead.
export default function ProjectCreateModal({ roles, lockedRoleId, lockedRoleName, onCreate, onClose }) {
  const [fields, setFields] = useState({
    name: '',
    description: '',
    status: 'active',
    due_date: '',
    role_id: lockedRoleId ?? '',
  })
  const [submitting, setSubmitting] = useState(false)
  const nameRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  const setField = (name) => (e) => setFields((f) => ({ ...f, [name]: e.target.value }))

  const canSubmit = fields.name.trim() && fields.role_id

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    const { error } = await onCreate({
      name: fields.name.trim(),
      description: fields.description || null,
      status: fields.status,
      due_date: fields.due_date || null,
      role_id: fields.role_id,
    })
    setSubmitting(false)
    if (!error) onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New project</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <label className="field">
            <span>Name</span>
            <input
              ref={nameRef}
              type="text"
              value={fields.name}
              onChange={setField('name')}
              placeholder="What's the project?"
              required
            />
          </label>

          <label className="field">
            <span>Role</span>
            {lockedRoleId ? (
              <select className="select" value={lockedRoleId} disabled style={{ opacity: 0.6 }}>
                <option value={lockedRoleId}>{lockedRoleName}</option>
              </select>
            ) : (
              <select className="select" value={fields.role_id} onChange={setField('role_id')} required>
                <option value="">Select a role</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            )}
          </label>

          <label className="field">
            <span>Description</span>
            <textarea value={fields.description} onChange={setField('description')} rows={3} placeholder="Optional" />
          </label>

          <div className="field-row-2">
            <label className="field">
              <span>Status</span>
              <select className="select" value={fields.status} onChange={setField('status')}>
                {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{projectStatusLabel(s)}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Due date</span>
              <input type="date" value={fields.due_date} onChange={setField('due_date')} />
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit || submitting}>
              {submitting ? 'Adding...' : 'Save project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
