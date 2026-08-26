import { todayISO } from '../../lib/date'

// Toggle, not a one-way action (Phase2_Handoff_Spec.md Addendum, "Add to
// Today"): on sets tasks.planned_date to today; off — only reachable when
// it's already today — clears planned_date to null. Never touches
// top3_override_slot/top3_override_date. Visual state must differ so the
// toggle is legible without a second click to discover it.
export default function AddToTodayButton({ task, onUpdate, className = 'btn btn-toggle btn-sm' }) {
  const isToday = task.planned_date === todayISO()

  const handleClick = async (e) => {
    e.stopPropagation()
    await onUpdate(task.id, { planned_date: isToday ? null : todayISO() })
  }

  return (
    <button
      type="button"
      className={isToday ? `${className} active` : className}
      onClick={handleClick}
    >
      {isToday ? 'Added to Today' : 'Add to Today'}
    </button>
  )
}
