import { formatDueDate, tierInfo } from '../../lib/taskDisplay'
import { IconCalendar, IconPlay } from '../icons'
import { todayISO } from '../../lib/date'

// Card for the "Also Today" section (Phase2_Handoff_Spec.md Addendum) —
// tasks planned for today that aren't in the real Top 3. "Remove from
// Today" is the same toggle-off as AddToTodayButton, just labeled for this
// context since a task here is always already planned for today.
export default function AlsoTodayCard({ task, onStart, onUpdate, onOpen }) {
  const tier = tierInfo(task.priority_tier)

  const handleRemove = async (e) => {
    e.stopPropagation()
    await onUpdate(task.id, { planned_date: task.planned_date === todayISO() ? null : task.planned_date })
  }

  return (
    <div className="task-card" style={{ borderLeftColor: tier.dot }} onClick={() => onOpen(task)}>
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
      <button type="button" className="btn btn-ghost btn-sm" onClick={handleRemove}>
        Remove from Today
      </button>
      <button
        type="button"
        className="btn btn-progress"
        onClick={(e) => { e.stopPropagation(); onStart(task) }}
      >
        <IconPlay size={16} />
        <span>Start</span>
      </button>
    </div>
  )
}
