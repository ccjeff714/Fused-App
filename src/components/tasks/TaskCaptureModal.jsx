import { useState, useRef, useEffect } from 'react'
import { computeRoleLock } from '../../lib/roleLock'
import RoleSelect from './RoleSelect'

const AREAS = ['work']
const PRIORITY_TIERS = ['critical', 'high_priority', 'medium_priority', 'low_priority']

const initialState = {
  title: '',
  area: 'work',
  due_date: '',
  planned_date: '',
  priority_tier: 'medium_priority',
  project_id: '',
  role_id: '',
  notes: '',
}

export default function TaskCaptureModal({ onClose, onCreate, projects = [], roles = [], onCreateRole }) {
  const [fields, setFields] = useState(initialState)
  const [expanded, setExpanded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  const setField = (name) => (e) => setFields((f) => ({ ...f, [name]: e.target.value }))

  const roleLock = computeRoleLock({ projectId: fields.project_id, projects, freeRoleValue: fields.role_id })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fields.title.trim()) return
    setSubmitting(true)
    const { error } = await onCreate({
      title: fields.title.trim(),
      area: fields.area,
      due_date: fields.due_date || null,
      planned_date: fields.planned_date || null,
      priority_tier: fields.priority_tier,
      project_id: fields.project_id || null,
      role_id: roleLock.roleValue || null,
      notes: fields.notes || null,
    })
    setSubmitting(false)
    if (!error) onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Capture task</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <label className="field">
            <span>Title</span>
            <input
              ref={titleRef}
              type="text"
              value={fields.title}
              onChange={setField('title')}
              placeholder="What needs doing?"
              required
            />
          </label>

          <label className="field">
            <span>Area</span>
            <select className="select" value={fields.area} onChange={setField('area')}>
              {AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="link-button"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Hide details' : 'Add details'}
          </button>

          {expanded && (
            <div className="expanded-fields">
              <div className="field-row-2">
                <label className="field">
                  <span>Due date</span>
                  <input type="date" value={fields.due_date} onChange={setField('due_date')} />
                </label>
                <label className="field">
                  <span className="field-label-row"><span>Planned date</span><span className="field-hint">optional</span></span>
                  <input type="date" value={fields.planned_date} onChange={setField('planned_date')} />
                </label>
              </div>

              <label className="field">
                <span>Priority tier</span>
                <select className="select" value={fields.priority_tier} onChange={setField('priority_tier')}>
                  {PRIORITY_TIERS.map((tier) => (
                    <option key={tier} value={tier}>{tier}</option>
                  ))}
                </select>
              </label>

              <div className="field-row-2">
                <label className="field">
                  <span className="field-label-row"><span>Project</span><span className="field-hint">optional</span></span>
                  <select
                    className="select"
                    value={fields.project_id}
                    onChange={(e) => setFields((f) => ({ ...f, project_id: e.target.value }))}
                  >
                    <option value="">No project</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
                <RoleSelect
                  roles={roles}
                  value={roleLock.roleValue}
                  onChange={(roleId) => setFields((f) => ({ ...f, role_id: roleId }))}
                  disabled={roleLock.roleLocked}
                  hint={roleLock.roleHint}
                  opacity={roleLock.roleOpacity}
                  onCreateRole={onCreateRole}
                />
              </div>

              <label className="field">
                <span>Notes</span>
                <textarea value={fields.notes} onChange={setField('notes')} rows={3} />
              </label>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!fields.title.trim() || submitting}>
              {submitting ? 'Adding...' : 'Save task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
