const PRIORITY_LABELS = {
  critical: 'Critical',
  high_priority: 'High priority',
  medium_priority: 'Medium priority',
  low_priority: 'Low priority',
}

export default function TopThreeCard({ task, slot, onStart, onOverride }) {
  return (
    <div className="top-three-card">
      <button type="button" className="top-three-card-main" onClick={() => onStart(task)}>
        <h3>{task.title}</h3>
        <div className="task-card-meta">
          <span className="due-date">{task.due_date ? task.due_date : 'no due date'}</span>
          <span className={`badge priority-${task.priority_tier}`}>
            {PRIORITY_LABELS[task.priority_tier] ?? task.priority_tier}
          </span>
        </div>
      </button>
      <button type="button" className="link-button" onClick={() => onOverride(slot)}>
        Swap
      </button>
    </div>
  )
}
