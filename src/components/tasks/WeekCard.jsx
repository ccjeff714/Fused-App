import { tierInfo, statusLabel } from '../../lib/taskDisplay'
import TaskBadges from './TaskBadges'
import AddToTodayButton from './AddToTodayButton'
import { IconPlay } from '../icons'

// Compact recommendation-style card for This Week — distinct from Full
// List's flat/filterable rows, per the mockup chat correction ("This Week
// should be visually distinct from Full List... same compact,
// recommendation-style card format as Today's Top 3, just browsable").
export default function WeekCard({ task, projects, roles, onStart, onUpdate, onOpen }) {
  const tier = tierInfo(task.priority_tier)

  return (
    <div className="week-card" onClick={() => onOpen(task)}>
      <div className="week-card-title-row">
        <span className="tier-dot" style={{ background: tier.dot, marginTop: 8 }} />
        <span className="week-card-title">{task.title}</span>
      </div>
      <div className="week-card-meta">
        <span>{tier.label}</span>
        <span>·</span>
        <span>{statusLabel(task.status)}</span>
        <TaskBadges task={task} projects={projects} roles={roles} />
      </div>
      <div className="week-card-actions">
        <button
          type="button"
          className="btn btn-progress btn-sm"
          onClick={(e) => { e.stopPropagation(); onStart(task) }}
        >
          <IconPlay size={14} />
          <span>Start</span>
        </button>
        <span onClick={(e) => e.stopPropagation()}>
          <AddToTodayButton task={task} onUpdate={onUpdate} />
        </span>
      </div>
    </div>
  )
}
