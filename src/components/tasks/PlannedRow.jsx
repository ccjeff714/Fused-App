import { tierInfo } from '../../lib/taskDisplay'
import TaskBadges from './TaskBadges'
import AddToTodayButton from './AddToTodayButton'
import { IconPlay } from '../icons'

export default function PlannedRow({ task, projects, roles, onStart, onUpdate, onOpen }) {
  const tier = tierInfo(task.priority_tier)

  return (
    <div className="list-row" onClick={() => onOpen(task)}>
      <span className="list-row-dot" style={{ background: tier.dot }} />
      <span className="list-row-main">
        <span className="list-row-title">{task.title}</span>
        <span className="list-row-badges">
          <TaskBadges task={task} projects={projects} roles={roles} />
        </span>
      </span>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{task.area}</span>
      <span onClick={(e) => e.stopPropagation()}>
        <AddToTodayButton task={task} onUpdate={onUpdate} />
      </span>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={(e) => { e.stopPropagation(); onStart(task) }}
      >
        <IconPlay size={14} />
        <span>Start</span>
      </button>
    </div>
  )
}
