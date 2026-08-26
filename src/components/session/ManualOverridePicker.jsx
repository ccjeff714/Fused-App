import { useState, useMemo } from 'react'
import { formatDueDate, tierInfo } from '../../lib/taskDisplay'
import { IconSearch } from '../icons'

// Swap picker — TopThreeCard only (Phase2_Handoff_Spec.md Addendum, "Swap").
// Scoped to the slot that triggered it. Lists every incomplete task
// (status != 'done'), no exclusions — a task already in Also Today can
// still be swapped in. Clicking a row assigns immediately, no confirmation.
export default function ManualOverridePicker({ slot, tasks, onPick, onClose }) {
  const [query, setQuery] = useState('')

  const eligible = useMemo(() => {
    const incomplete = tasks.filter((t) => t.status !== 'done')
    const q = query.trim().toLowerCase()
    if (!q) return incomplete
    return incomplete.filter((t) => t.title.toLowerCase().includes(q))
  }, [tasks, query])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Swap slot {slot}</h2>

        <label className="field">
          <span className="field-label-row" style={{ marginBottom: -2 }}>
            <IconSearch size={14} />
            <span>Search tasks</span>
          </span>
          <input
            className="override-picker-search"
            type="text"
            autoFocus
            placeholder="Filter by title"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        {eligible.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)' }}>No matching tasks.</p>
        ) : (
          <div className="override-picker-list">
            {eligible.map((task) => {
              const tier = tierInfo(task.priority_tier)
              return (
                <button
                  key={task.id}
                  type="button"
                  className="override-picker-item"
                  onClick={() => onPick(task.id)}
                >
                  <span>{task.title}</span>
                  <span className="override-picker-item-meta">
                    <span>{formatDueDate(task.due_date)}</span>
                    <span className="tier-dot" style={{ background: tier.dot }} />
                    <span>{tier.label}</span>
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
