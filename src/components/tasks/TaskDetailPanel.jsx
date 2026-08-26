import { useState } from 'react'
import { computeRoleLock } from '../../lib/roleLock'
import { tierInfo } from '../../lib/taskDisplay'
import { useExecutionHistory } from '../../hooks/useExecutionHistory'
import RoleSelect from './RoleSelect'
import SubtaskList from './SubtaskList'
import { IconX, IconPlay } from '../icons'

const AREAS = ['work']
const PRIORITY_TIERS = ['critical', 'high_priority', 'medium_priority', 'low_priority']
const STATUSES = ['not_started', 'in_progress', 'blocked', 'done']

function formatSessionRow(row) {
  if (!row.ended_at) return { what: 'Work sprint', when: 'In progress', detail: 'not yet ended' }
  const minutes = Math.round((row.duration_sec ?? 0) / 60)
  const when = new Date(row.started_at).toLocaleString(undefined, {
    weekday: 'short', hour: 'numeric', minute: '2-digit',
  })
  return { what: 'Work sprint', when, detail: `${minutes} min` }
}

// Right-side sliding panel — Today screen only (Phase2_Handoff_Spec.md A8).
// Every field here is editable in place (autosaves on change/blur), unlike
// the lightweight TaskEditModal used on every other screen.
// Callers must render this with `key={task.id}` so switching the selected
// task remounts the panel (resetting local field state) instead of an
// effect syncing props to state.
export default function TaskDetailPanel({ task, projects, roles, onUpdate, onCreateRole, onClose, onStart }) {
  const [notes, setNotes] = useState(task.notes ?? '')
  const { history, loading: historyLoading } = useExecutionHistory(task.id)

  const roleLock = computeRoleLock({ projectId: task.project_id, projects, freeRoleValue: task.role_id })

  const save = (fields) => onUpdate(task.id, fields)

  const handleRoleChange = (roleId) => save({ role_id: roleId || null })
  const handleProjectChange = (e) => save({ project_id: e.target.value || null })

  return (
    <>
      <div className="modal-backdrop" style={{ background: 'transparent', padding: 0 }} onClick={onClose} />
      <aside className="task-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Task detail</div>
            <h2 className="panel-title">{task.title}</h2>
          </div>
          <button type="button" className="panel-close" onClick={onClose} aria-label="Close">
            <IconX size={16} />
          </button>
        </div>

        <div className="panel-grid">
          <span className="panel-grid-label">Due date</span>
          <input
            type="date"
            defaultValue={task.due_date ?? ''}
            onBlur={(e) => save({ due_date: e.target.value || null })}
          />

          <span className="panel-grid-label">Planned date</span>
          <input
            type="date"
            defaultValue={task.planned_date ?? ''}
            onBlur={(e) => save({ planned_date: e.target.value || null })}
          />

          <span className="panel-grid-label">Area</span>
          <select className="select" defaultValue={task.area ?? 'work'} onChange={(e) => save({ area: e.target.value })}>
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>

          <span className="panel-grid-label">Project</span>
          <select className="select" value={task.project_id ?? ''} onChange={handleProjectChange}>
            <option value="">No project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <span className="panel-grid-label">Role</span>
          <RoleSelect
            roles={roles}
            value={roleLock.roleValue}
            onChange={handleRoleChange}
            disabled={roleLock.roleLocked}
            hint={roleLock.roleHint}
            opacity={roleLock.roleOpacity}
            onCreateRole={onCreateRole}
          />

          <span className="panel-grid-label">Priority</span>
          <select className="select" defaultValue={task.priority_tier ?? 'medium_priority'} onChange={(e) => save({ priority_tier: e.target.value })}>
            {PRIORITY_TIERS.map((t) => <option key={t} value={t}>{tierInfo(t).label}</option>)}
          </select>

          <span className="panel-grid-label">Status</span>
          <select className="select" defaultValue={task.status ?? 'not_started'} onChange={(e) => save({ status: e.target.value })}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Notes</div>
          <textarea
            rows={4}
            style={{ width: '100%', boxSizing: 'border-box', padding: 10, border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', color: 'var(--text-primary)', font: 'inherit' }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => save({ notes: notes || null })}
            placeholder="Context, links, next step"
          />
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Subtasks</div>
          <SubtaskList subtasks={task.subtasks ?? []} onChange={(subtasks) => save({ subtasks })} />
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Execution history</div>
          {historyLoading ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Loading...</p>
          ) : history.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No sessions yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {history.map((row) => {
                const ev = formatSessionRow(row)
                return (
                  <div key={row.id} className="panel-history-item">
                    <span className="panel-history-dot" />
                    <span>
                      <div className="panel-history-what">{ev.what}</div>
                      <div className="panel-history-when">{ev.when} · {ev.detail}</div>
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <button type="button" className="btn btn-progress" style={{ marginTop: 'auto', justifyContent: 'center' }} onClick={() => onStart(task)}>
          <IconPlay size={16} />
          <span>Start session</span>
        </button>
      </aside>
    </>
  )
}
