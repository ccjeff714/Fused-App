import { formatDueDate, tierInfo, statusLabel } from '../../lib/taskDisplay'
import TaskBadges from './TaskBadges'
import AddToTodayButton from './AddToTodayButton'
import { IconCalendar, IconPlay } from '../icons'

// The one task-card component — used by Full List, This Week, and (via
// PlannedRow's own row layout, a deliberately different shape) not
// Planned. `onStart` is optional: Full List omits it (no direct-start
// affordance there); This Week passes it, since browsing there is meant
// to lead straight into a session, same spirit as Today's Top 3.
export default function TaskCard({ task, projects, roles, onUpdate, onOpen, onStart }) {
  const tier = tierInfo(task.priority_tier)
  const done = task.status === 'done'

  return (
    <div className="task-card" style={{ borderLeftColor: tier.dot }} onClick={() => onOpen(task)}>
      <div className="task-card-main">
        <div className={done ? 'task-card-title done' : 'task-card-title'}>{task.title}</div>
        <div className="task-card-meta">
          <span className="meta-chip">
            <IconCalendar size={15} />
            <span>{formatDueDate(task.due_date)}</span>
          </span>
          <span className="meta-chip">
            <span className="tier-dot" style={{ background: tier.dot }} />
            <span>{tier.label}</span>
          </span>
          <span className="status-chip">{statusLabel(task.status)}</span>
          <TaskBadges task={task} projects={projects} roles={roles} />
        </div>
      </div>
      {onStart && (
        <button
          type="button"
          className="btn btn-progress btn-sm"
          onClick={(e) => { e.stopPropagation(); onStart(task) }}
        >
          <IconPlay size={14} />
          <span>Start</span>
        </button>
      )}
      <span onClick={(e) => e.stopPropagation()}>
        <AddToTodayButton task={task} onUpdate={onUpdate} />
      </span>
    </div>
  )
}
