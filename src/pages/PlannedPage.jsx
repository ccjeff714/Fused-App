import { useState, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useProjects } from '../hooks/useProjects'
import { useRoles } from '../hooks/useRoles'
import { todayISO, mondayOfWeek, addDaysISO, endOfMonthISO, weekdayName, formatLongDate } from '../lib/date'
import PlannedRow from '../components/tasks/PlannedRow'
import TaskEditModal from '../components/tasks/TaskEditModal'
import TaskCaptureModal from '../components/tasks/TaskCaptureModal'

// Grouped by planned_date only — a task with no planned_date has no claim
// here (was a bug; Full List/Projects View are where undated tasks live).
// Week starts Monday. This Week is broken into individual date headers
// (the original literal-date design, now covering the whole current week
// instead of just Today/Tomorrow); Next Week, Next Month, and Later are
// each a single bucket with no further date subdivision.
//
// Judgment call: the spec's 4 buckets don't define a home for a
// planned_date before this week's Monday (an "overdue" plan) — rather
// than silently hiding those, they're folded into This Week's per-date
// list under their own (past) date header, so nothing disappears from
// view. Flag if a distinct Overdue bucket is wanted instead.
export default function PlannedPage({ session, startSession, onSessionStarted, captureOpen, onCloseCapture }) {
  const { tasks, loading, error, createTask, updateTask } = useTasks(session)
  const { projects } = useProjects(session)
  const { roles, createIfNew: createRole } = useRoles(session)
  const [openTaskId, setOpenTaskId] = useState(null)

  const openTask = tasks.find((t) => t.id === openTaskId) ?? null

  const groups = useMemo(() => {
    const today = todayISO()
    const thisMonday = mondayOfWeek(today)
    const thisSunday = addDaysISO(thisMonday, 6)
    const nextMonday = addDaysISO(thisMonday, 7)
    const nextSunday = addDaysISO(thisMonday, 13)
    const nextMonthEnd = endOfMonthISO(today, 1)

    const planned = tasks.filter((t) => t.status !== 'done' && t.planned_date)

    const thisWeekTasks = planned.filter((t) => t.planned_date <= thisSunday)
    const byDate = {}
    for (const t of thisWeekTasks) {
      (byDate[t.planned_date] ??= []).push(t)
    }
    const thisWeekGroups = Object.keys(byDate).sort().map((iso) => ({
      key: iso,
      label: weekdayName(iso),
      date: formatLongDate(iso),
      tasks: byDate[iso],
    }))

    const nextWeekTasks = planned.filter((t) => t.planned_date >= nextMonday && t.planned_date <= nextSunday)
    const nextMonthTasks = planned.filter((t) => t.planned_date > nextSunday && t.planned_date <= nextMonthEnd)
    const laterTasks = planned.filter((t) => t.planned_date > nextMonthEnd)

    return [
      ...thisWeekGroups,
      { key: 'next-week', label: 'Next week', date: `${formatLongDate(nextMonday)} – ${formatLongDate(nextSunday)}`, tasks: nextWeekTasks },
      { key: 'next-month', label: 'Next month', date: 'Through the end of next month', tasks: nextMonthTasks },
      { key: 'later', label: 'Later', date: 'Beyond next month', tasks: laterTasks },
    ].filter((g) => g.tasks.length > 0)
  }, [tasks])

  const handleStart = async (task) => {
    const { data, error } = await startSession(task.id)
    if (!error) onSessionStarted(task, data)
  }

  return (
    <main className="screen">
      <header>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Lists</div>
        <h1 className="screen-title">Planned</h1>
        <p className="screen-subtitle">Everything with a planned date, in the order it comes up.</p>
      </header>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : groups.length === 0 ? (
        <p>Nothing planned yet.</p>
      ) : (
        <div className="planned-group">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="planned-group-header">
                <span className="planned-group-title">{group.label}</span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{group.date}</span>
                <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  {group.tasks.length} {group.tasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>
              {group.tasks.map((task) => (
                <PlannedRow
                  key={task.id}
                  task={task}
                  projects={projects}
                  roles={roles}
                  onStart={handleStart}
                  onUpdate={updateTask}
                  onOpen={(t) => setOpenTaskId(t.id)}
                />
              ))}
            </section>
          ))}
        </div>
      )}

      {openTask && (
        <TaskEditModal
          task={openTask}
          projects={projects}
          roles={roles}
          onSave={updateTask}
          onCancel={() => setOpenTaskId(null)}
          onCreateRole={createRole}
        />
      )}

      {captureOpen && (
        <TaskCaptureModal
          onClose={onCloseCapture}
          onCreate={createTask}
          projects={projects}
          roles={roles}
          onCreateRole={createRole}
        />
      )}
    </main>
  )
}
