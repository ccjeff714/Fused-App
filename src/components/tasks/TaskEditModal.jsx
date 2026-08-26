import { useState } from 'react'
import { computeRoleLock } from '../../lib/roleLock'
import { tierInfo, statusLabel } from '../../lib/taskDisplay'
import RoleSelect from './RoleSelect'
import SubtaskList from './SubtaskList'

const AREAS = ['work']
const PRIORITY_TIERS = ['critical', 'high_priority', 'medium_priority', 'low_priority']
const STATUSES = ['not_started', 'in_progress', 'blocked', 'done']

// Lightweight edit modal used on every screen except Today (Full List, This
// Week, Planned, Completed) — per Phase2_Handoff_Spec.md A8. No execution
// history, no panel treatment; that's TaskDetailPanel's job.
export default function TaskEditModal({ task, projects, roles, onSave, onCancel, onCreateRole, onDelete }) {
  const [fields, setFields] = useState({
    title: task.title,
    area: task.area ?? 'work',
    due_date: task.due_date ?? '',
    planned_date: task.planned_date ?? '',
    priority_tier: task.priority_tier ?? 'medium_priority',
    status: task.status ?? 'not_started',
    notes: task.notes ?? '',
    project_id: task.project_id ?? '',
    role_id: task.role_id ?? '',
    subtasks: task.subtasks ?? [],
  })
  const [saving, setSaving] = useState(false)

  const setField = (name) => (e) => setFields((f) => ({ ...f, [name]: e.target.value }))
  const setSubtasks = (subtasks) => setFields((f) => ({ ...f, subtasks }))

  const roleLock = computeRoleLock({ projectId: fields.project_id, projects, freeRoleValue: fields.role_id })

  const handleProjectChange = (e) => {
    const projectId = e.target.value
    setFields((f) => ({ ...f, project_id: projectId }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fields.title.trim()) return
    setSaving(true)
    const { error } = await onSave(task.id, {
      title: fields.title.trim(),
      area: fields.area,
      due_date: fields.due_date || null,
      planned_date: fields.planned_date || null,
      priority_tier: fields.priority_tier,
      status: fields.status,
      notes: fields.notes || null,
      project_id: fields.project_id || null,
      role_id: roleLock.roleValue || null,
      subtasks: fields.subtasks,
    })
    setSaving(false)
    if (!error) onCancel()
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit task</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <label className="field">
            <span>Title</span>
            <input type="text" value={fields.title} onChange={setField('title')} required />
          </label>

          <div className="field-row-2">
            <label className="field">
              <span>Due date</span>
              <input type="date" value={fields.due_date} onChange={setField('due_date')} />
            </label>
            <label className="field">
              <span className="field-label-row"><span>Planned date</span><span className="field-hint">optional</span></span>
              <input type="date" value={fields.planned_date} onChange={setField('planned_date')} />
            </label>
            <label className="field">
              <span>Area</span>
              <select className="select" value={fields.area} onChange={setField('area')}>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Priority tier</span>
              <select className="select" value={fields.priority_tier} onChange={setField('priority_tier')}>
                {PRIORITY_TIERS.map((t) => <option key={t} value={t}>{tierInfo(t).label}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Status</span>
              <select className="select" value={fields.status} onChange={setField('status')}>
                {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </label>
          </div>

          <div className="field-row-2">
            <label className="field">
              <span className="field-label-row"><span>Project</span><span className="field-hint">optional</span></span>
              <select className="select" value={fields.project_id} onChange={handleProjectChange}>
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
            <textarea rows={3} value={fields.notes} onChange={setField('notes')} placeholder="Context, links, next step" />
          </label>

          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Subtasks</div>
            <SubtaskList subtasks={fields.subtasks} onChange={setSubtasks} />
          </div>

          <div className="modal-actions" style={{ justifyContent: onDelete ? 'space-between' : 'flex-end' }}>
            {onDelete && (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ color: 'var(--tier-critical)' }}
                onClick={() => onDelete(task)}
              >
                Delete
              </button>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={!fields.title.trim() || saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
