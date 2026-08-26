import { formatDueDate, tierInfo } from '../../lib/taskDisplay'
import { IconCalendar, IconPlay } from '../icons'

export default function TopThreeCard({ task, slot, onStart, onSwap }) {
  const tier = tierInfo(task.priority_tier)

  return (
    <div className="task-card" style={{ borderLeftColor: tier.dot }}>
      <span className="task-card-slot tnum">{slot}</span>
      <div className="task-card-main">
        <div className="task-card-title">{task.title}</div>
        <div className="task-card-meta">
          <span className="meta-chip">
            <IconCalendar size={15} />
            <span>{formatDueDate(task.due_date)}</span>
          </span>
          <span className="meta-chip">
            <span className="tier-dot" style={{ background: tier.dot }} />
            <span>{tier.label}</span>
          </span>
        </div>
      </div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onSwap(slot)}>
        Swap
      </button>
      <button type="button" className="btn btn-progress" onClick={() => onStart(task)}>
        <IconPlay size={16} />
        <span>Start</span>
      </button>
    </div>
  )
}
