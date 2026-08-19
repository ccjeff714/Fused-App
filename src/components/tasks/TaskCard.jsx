const PRIORITY_LABELS = {
  critical: 'Critical',
  high_priority: 'High priority',
  medium_priority: 'Medium priority',
  low_priority: 'Low priority',
}

const STATUS_LABELS = {
  not_started: 'Not started',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
}

export default function TaskCard({ task, onEdit, onDelete }) {
  return (
    <div className="task-card">
      <div className="task-card-main">
        <h3>{task.title}</h3>
        <div className="task-card-meta">
          <span className="due-date">
            {task.due_date ? task.due_date : 'no due date'}
          </span>
          <span className={`badge priority-${task.priority_tier}`}>
            {PRIORITY_LABELS[task.priority_tier] ?? task.priority_tier}
          </span>
          <span className={`badge status-${task.status}`}>
            {STATUS_LABELS[task.status] ?? task.status}
          </span>
          {task.project_id && <span className="badge project-badge">Project</span>}
        </div>
      </div>
      <div className="task-card-actions">
        <button type="button" onClick={() => onEdit(task)}>Edit</button>
        <button type="button" onClick={() => onDelete(task)}>Delete</button>
      </div>
    </div>
  )
}
