import { useState, useRef, useEffect } from 'react'

const AREAS = ['work']
const PRIORITY_TIERS = ['critical', 'high_priority', 'medium_priority', 'low_priority']

const initialState = {
  title: '',
  area: 'work',
  due_date: '',
  priority_tier: 'medium_priority',
  notes: '',
}

export default function TaskCaptureModal({ onClose, onCreate }) {
  const [fields, setFields] = useState(initialState)
  const [expanded, setExpanded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  const setField = (name) => (e) => setFields((f) => ({ ...f, [name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fields.title.trim()) return
    setSubmitting(true)
    const { error } = await onCreate({
      title: fields.title.trim(),
      area: fields.area,
      due_date: fields.due_date || null,
      priority_tier: fields.priority_tier,
      notes: fields.notes || null,
    })
    setSubmitting(false)
    if (!error) onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Capture task</h2>
        <form onSubmit={handleSubmit}>
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
            <select value={fields.area} onChange={setField('area')}>
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
            {expanded ? '- Hide details' : '+ Add details'}
          </button>

          {expanded && (
            <div className="expanded-fields">
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
                <span>Notes</span>
                <textarea value={fields.notes} onChange={setField('notes')} rows={3} />
              </label>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={!fields.title.trim() || submitting}>
              {submitting ? 'Adding...' : 'Add task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
