import { useState } from 'react'

const AREAS = ['work']
const PRIORITY_TIERS = ['critical', 'high_priority', 'medium_priority', 'low_priority']
const STATUSES = ['not_started', 'in_progress', 'blocked', 'done']

export default function TaskEditForm({ task, onSave, onCancel }) {
  const [fields, setFields] = useState({
    title: task.title,
    area: task.area ?? 'work',
    due_date: task.due_date ?? '',
    priority_tier: task.priority_tier ?? 'medium_priority',
    status: task.status ?? 'not_started',
    notes: task.notes ?? '',
  })
  const [saving, setSaving] = useState(false)

  const setField = (name) => (e) => setFields((f) => ({ ...f, [name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fields.title.trim()) return
    setSaving(true)
    const { error } = await onSave(task.id, {
      title: fields.title.trim(),
      area: fields.area,
      due_date: fields.due_date || null,
      priority_tier: fields.priority_tier,
      status: fields.status,
      notes: fields.notes || null,
    })
    setSaving(false)
    if (!error) onCancel()
  }

  return (
    <form className="task-edit-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Title</span>
        <input type="text" value={fields.title} onChange={setField('title')} required />
      </label>

      <label className="field">
        <span>Area</span>
        <select value={fields.area} onChange={setField('area')}>
          {AREAS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Due date</span>
        <input type="date" value={fields.due_date} onChange={setField('due_date')} />
      </label>

      <label className="field">
        <span>Priority tier</span>
        <select value={fields.priority_tier} onChange={setField('priority_tier')}>
          {PRIORITY_TIERS.map((tier) => (
            <option key={tier} value={tier}>{tier}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Status</span>
        <select value={fields.status} onChange={setField('status')}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Notes</span>
        <textarea value={fields.notes} onChange={setField('notes')} rows={3} />
      </label>

      <div className="modal-actions">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit" disabled={!fields.title.trim() || saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
